import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Explicit override (e.g. /reset-password). Internal paths only: building
  // `${origin}${next}` from raw input allowed `?next=@evil.com` (open redirect).
  const rawNext = searchParams.get("next");
  const next = rawNext ? safeNextPath(rawNext, "/dashboard") : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // No explicit next — check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", user.id)
          .single();

        const redirectPath = profile?.onboarded ? "/dashboard" : "/onboarding";
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
