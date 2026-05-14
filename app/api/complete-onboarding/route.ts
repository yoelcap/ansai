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

  // Upsert the profile — creates it if the on_auth_user_created trigger failed,
  // or just flips onboarded=true for the normal path.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? null,
        onboarded: true,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Failed to upsert profile:", profileError);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
