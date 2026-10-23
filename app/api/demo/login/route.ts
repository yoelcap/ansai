import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getDemoUser } from "@/lib/demo";

/**
 * POST /api/demo/login — signs the visitor in as the shared demo account and
 * redirects to the dashboard. Called by a plain <form method="post">, so it
 * works without JavaScript; it is POST-only so link prefetching can never log
 * anyone in.
 *
 * It does not use the demo password: a one-time magic-link token is minted
 * with the service role and exchanged server-side for a session cookie. A
 * visitor who changes the demo password therefore cannot lock others out.
 */
export async function POST(request: NextRequest) {
  const fail = () =>
    NextResponse.redirect(new URL("/login?error=demo_unavailable", request.url), 303);

  try {
    const admin = createAdminClient();
    const demoUser = await getDemoUser(admin);
    if (!demoUser?.email) {
      console.error("demo login: demo account not set up (run `npm run db:seed`)");
      return fail();
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: demoUser.email,
    });
    if (linkError || !link.properties?.hashed_token) {
      console.error("demo login: generateLink failed", linkError);
      return fail();
    }

    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });
    if (otpError) {
      console.error("demo login: verifyOtp failed", otpError);
      return fail();
    }

    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch (err) {
    console.error("demo login error:", err);
    return fail();
  }
}
