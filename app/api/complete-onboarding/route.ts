import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse, type NextRequest } from "next/server";
import { isCrossSiteRequest } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the caller is authenticated
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use the service role key to bypass RLS for the profile/business writes
  const admin = createAdminClient();

  // Create a default business if the user doesn't have one yet.
  const { data: existing, error: existingError } = await admin
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existingError) {
    console.error("complete-onboarding: business lookup failed", existingError);
    return NextResponse.json({ error: "Failed to set up business" }, { status: 500 });
  }

  if (!existing) {
    const { error: bizError } = await admin.from("businesses").insert({
      user_id: user.id,
      name: "Mi negocio",
      type: "restaurant",
      city: "Mechelen",
      country: "BE",
    });
    if (bizError) {
      // Do not mark the user as onboarded without a business: every page
      // would show "no business" with no way out.
      console.error("complete-onboarding: business insert failed", bizError);
      return NextResponse.json({ error: "Failed to set up business" }, { status: 500 });
    }
  }

  // This route runs with the service role, so it writes only `onboarded`.
  // It must not copy user-controlled data (user_metadata can be changed by the
  // user through the Auth API) into the profile, which would bypass RLS.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = profile
    ? await admin.from("profiles").update({ onboarded: true }).eq("id", user.id)
    : // Profile missing (users created before the signup trigger existed).
      await admin.from("profiles").insert({
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? null,
        onboarded: true,
      });

  if (profileError) {
    console.error("complete-onboarding: profile update failed", profileError);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
