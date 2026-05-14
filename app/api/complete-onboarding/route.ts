import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  // Verify the caller is authenticated
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use the service role key to bypass RLS for the profile/business writes
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create a default business if the user doesn't have one yet
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: bizError } = await admin.from("businesses").insert({
      user_id: user.id,
      name: "Mi negocio",
      type: "restaurant",
      city: "Mechelen",
      country: "BE",
    });
    if (bizError) {
      console.error("Failed to create business:", bizError);
    }
  }

  // Mark onboarded = true — this MUST succeed before redirecting to dashboard
  const { error: profileError } = await admin
    .from("profiles")
    .update({ onboarded: true })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to update profile:", profileError);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
