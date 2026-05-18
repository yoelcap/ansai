import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FORMALITY_INSTRUCTIONS: Record<string, string> = {
  very_informal: "Tutea, cercano y espontáneo, como un amigo",
  informal: "Tutea, cercano pero correcto",
  neutral: "Trato neutro, ni muy cercano ni muy distante",
  formal: "Trato de usted, profesional y cortés",
  very_formal: "Trato de usted, muy formal y protocolario",
};

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: "2-3 frases",
  medium: "4-6 frases",
  long: "7-10 frases",
};

const LANGUAGE_NAMES: Record<string, string> = {
  es: "español",
  en: "inglés",
  nl: "neerlandés",
  fr: "francés",
  de: "alemán",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: "restaurante",
  bar: "bar",
  cafe: "café",
  hotel: "hotel",
  other: "negocio de hostelería",
};

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function POST(req: NextRequest) {
  let reviewId: string | undefined;

  try {
    const body = await req.json();
    reviewId = body.reviewId as string;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 2. Fetch business
    const { data: business } = await supabase
      .from("businesses")
      .select("name, type")
      .eq("id", review.business_id)
      .maybeSingle();

    // 3. Fetch tone config (may not exist)
    const { data: toneConfig } = await supabase
      .from("tone_configs")
      .select("*")
      .eq("business_id", review.business_id)
      .maybeSingle();

    const formality = toneConfig?.formality ?? "neutral";
    const responseLength = toneConfig?.response_length ?? "medium";
    const responseLanguage = toneConfig?.response_language ?? "auto";
    const signature = toneConfig?.signature ?? "";
    const forbiddenPhrases: string[] = toneConfig?.forbidden_phrases ?? [];
    const favoritePhrases: string[] = toneConfig?.favorite_phrases ?? [];

    // 4. Choose model
    const modelUsed =
      review.rating <= 2 || (review.text?.length ?? 0) > 400
        ? "claude-opus-4-7"
        : "claude-haiku-4-5-20251001";

    // 5. Build system prompt
    const formalityInstruction =
      FORMALITY_INSTRUCTIONS[formality] ?? FORMALITY_INSTRUCTIONS.neutral;
    const lengthInstruction =
      LENGTH_INSTRUCTIONS[responseLength] ?? LENGTH_INSTRUCTIONS.medium;

    const lang =
      responseLanguage === "auto"
        ? LANGUAGE_NAMES[review.language] ?? "español"
        : LANGUAGE_NAMES[responseLanguage] ?? "español";

    const businessName = business?.name ?? "nuestro negocio";
    const businessType =
      BUSINESS_TYPE_LABELS[business?.type ?? ""] ?? "negocio de hostelería";

    let systemPrompt = `Eres el encargado de responder reseñas de ${businessName}, un/a ${businessType}. ${formalityInstruction}. Longitud: ${lengthInstruction}. Responde en ${lang}.`;

    if (signature) {
      systemPrompt += ` Termina SIEMPRE con esta firma exacta en su propia línea: ${signature}`;
    }
    if (forbiddenPhrases.length > 0) {
      systemPrompt += ` NUNCA uses estas expresiones: ${forbiddenPhrases.join(", ")}.`;
    }
    if (favoritePhrases.length > 0) {
      systemPrompt += ` Cuando sea natural, usa expresiones de la marca como: ${favoritePhrases.join(", ")}.`;
    }

    systemPrompt += `
Reglas:
- Reseña positiva (4-5★): agradece con sinceridad y personaliza mencionando algo concreto que dijo el cliente.
- Reseña negativa (1-2★): discúlpate de forma sincera y concreta, reconociendo el problema específico que menciona el cliente. Muestra empatía genuina. NO invites sistemáticamente a contactar por privado ni a 'continuar la conversación' — eso suena defensivo en una respuesta pública. Una disculpa honesta y bien expresada es suficiente. Solo si el caso es muy grave (problema de salud, seguridad, cobro incorrecto) puedes ofrecer resolverlo directamente.
- Reseña mixta (3★): agradece lo positivo, reconoce lo mejorable.
- NO inventes hechos, nombres ni detalles que el cliente no mencionó.
- NO prometas compensaciones concretas (descuentos, regalos).
- Suena humano, nunca robótico ni plantillero.`;

    // 6. Build user prompt
    const customerName = review.customer_name ?? "el cliente";
    const userPrompt = `Reseña de ${customerName} (${review.rating} estrellas):
"${review.text}"
Escribe ÚNICAMENTE el texto de la respuesta, sin comillas ni preámbulo.`;

    // 7. Call Anthropic with one retry on failure
    let result: { text: string; inputTokens: number; outputTokens: number };
    try {
      result = await callAnthropic(modelUsed, systemPrompt, userPrompt);
    } catch (firstError) {
      console.error("Anthropic first attempt failed:", firstError);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        result = await callAnthropic(modelUsed, systemPrompt, userPrompt);
      } catch (secondError) {
        console.error("Anthropic second attempt failed:", secondError);
        // Upsert generation_failed
        await supabase.from("responses").upsert(
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
        return NextResponse.json(
          { error: "Failed to generate response" },
          { status: 500 }
        );
      }
    }

    // 8. Upsert in responses table
    await supabase.from("responses").upsert(
      {
        review_id: reviewId,
        text: result.text,
        status: "generated",
        model_used: modelUsed,
        tokens_input: result.inputTokens,
        tokens_output: result.outputTokens,
      },
      { onConflict: "review_id" }
    );

    return NextResponse.json({
      responseText: result.text,
      modelUsed,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    });
  } catch (err) {
    console.error("generate route error:", err);
    if (reviewId) {
      try {
        const supabase = await createClient();
        await supabase.from("responses").upsert(
          {
            review_id: reviewId,
            text: "",
            status: "generation_failed",
            model_used: null,
            tokens_input: 0,
            tokens_output: 0,
          },
          { onConflict: "review_id" }
        );
      } catch {
        // best-effort
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
