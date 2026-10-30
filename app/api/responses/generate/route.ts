import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { demoDailyAiLimit } from "@/lib/demo";
import { isCrossSiteRequest } from "@/lib/http";
import {
  buildPrompt,
  leaksSystemPrompt,
  needsComplexModel,
  stripDashes,
} from "@/lib/ai/buildPrompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Larger model for complex reviews (≤2★ or long), smaller one otherwise. */
const MODEL_COMPLEX = process.env.ANTHROPIC_MODEL_COMPLEX || "claude-opus-4-7";
const MODEL_SIMPLE = process.env.ANTHROPIC_MODEL_SIMPLE || "claude-haiku-4-5";

function intEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

const BodySchema = z.object({ reviewId: z.uuid() });

async function callAnthropic(model: string, system: string, user: string) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return {
    text,
    stopReason: response.stop_reason,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body: reviewId (uuid) is required" }, { status: 400 });
  }
  const { reviewId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Records a failed generation. Errors are logged, never thrown.
  const markFailed = async (modelUsed: string | null) => {
    const { error } = await supabase.from("responses").upsert(
      {
        review_id: reviewId,
        text: "",
        status: "generation_failed",
        model_used: modelUsed,
        tokens_input: 0,
        tokens_output: 0,
      },
      { onConflict: "review_id" }
    );
    if (error) console.error("generate: could not record failure", error);
  };

  try {
    // 1. Review (RLS already hides other users' reviews → 404).
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, business_id, rating, text, customer_name, language")
      .eq("id", reviewId)
      .maybeSingle();
    if (reviewError) throw reviewError;
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 2. Explicit ownership check, not only RLS (defence in depth).
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, user_id, name, type")
      .eq("id", review.business_id)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business || business.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Quotas + ledger entry, atomic in the database (migration 0005).
    //    Before the Anthropic call, so a blocked request costs nothing.
    const { data: claim, error: claimError } = await createAdminClient().rpc(
      "claim_ai_generation",
      {
        p_user_id: user.id,
        p_business_id: business.id,
        p_demo_daily_limit: demoDailyAiLimit(),
        p_user_minute_limit: intEnv("AI_USER_MINUTE_LIMIT", 5),
        p_user_daily_limit: intEnv("AI_USER_DAILY_LIMIT", 100),
      }
    );
    if (claimError) {
      // Fail closed: without the quota check no credits are spent.
      console.error("claim_ai_generation failed:", claimError);
      return NextResponse.json({ error: "Quota check unavailable" }, { status: 503 });
    }
    if (claim !== "ok") {
      return NextResponse.json({ error: "AI generation limit reached", code: claim }, { status: 429 });
    }

    // 4. Tone config (optional; every field has a default).
    const { data: tone } = await supabase
      .from("tone_configs")
      .select("formality, response_length, response_language, signature, forbidden_phrases, favorite_phrases")
      .eq("business_id", business.id)
      .maybeSingle();

    const { system, user: userPrompt } = buildPrompt({
      review: {
        text: review.text,
        rating: review.rating,
        customerName: review.customer_name,
        language: review.language,
      },
      business: { name: business.name, type: business.type },
      tone: tone && {
        formality: tone.formality,
        responseLength: tone.response_length,
        responseLanguage: tone.response_language,
        signature: tone.signature,
        forbiddenPhrases: tone.forbidden_phrases,
        favoritePhrases: tone.favorite_phrases,
      },
    });
    const modelUsed = needsComplexModel(review) ? MODEL_COMPLEX : MODEL_SIMPLE;

    // 5. Anthropic, with one retry.
    let result: Awaited<ReturnType<typeof callAnthropic>>;
    try {
      result = await callAnthropic(modelUsed, system, userPrompt);
    } catch (firstError) {
      console.error("Anthropic first attempt failed:", firstError);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        result = await callAnthropic(modelUsed, system, userPrompt);
      } catch (secondError) {
        console.error("Anthropic second attempt failed:", secondError);
        await markFailed(modelUsed);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 502 });
      }
    }

    // 6. Output checks: empty / refused / echoing the instructions.
    const text = stripDashes(result.text);
    if (!text || result.stopReason === "refusal" || leaksSystemPrompt(text)) {
      console.warn("generate: reply rejected", {
        reviewId,
        stopReason: result.stopReason,
        leaked: leaksSystemPrompt(text),
      });
      await markFailed(modelUsed);
      return NextResponse.json({ error: "Generated reply was rejected" }, { status: 502 });
    }

    // 7. Persist. A failed write must not look like success to the client.
    const { error: saveError } = await supabase.from("responses").upsert(
      {
        review_id: reviewId,
        text,
        status: "generated",
        model_used: modelUsed,
        tokens_input: result.inputTokens,
        tokens_output: result.outputTokens,
      },
      { onConflict: "review_id" }
    );
    if (saveError) {
      console.error("generate: could not save response", saveError);
      return NextResponse.json({ error: "Could not save the response" }, { status: 500 });
    }

    return NextResponse.json({
      responseText: text,
      modelUsed,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    });
  } catch (err) {
    console.error("generate route error:", err);
    await markFailed(null);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
