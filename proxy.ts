import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/reviews", "/insights", "/settings", "/onboarding"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Runs before every matched request (Next 16 "proxy", formerly middleware).
 *
 * Private routes are rejected here, on the server, before any page code is
 * sent: without a valid session the visitor is redirected to /login. The
 * AppShell client guard remains only as a fallback. Data access itself is
 * protected independently by RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/dev-login") && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Public pages and API routes (which authenticate themselves) need no session work.
  if (!isProtected(pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifies the JWT signature (refreshing an expired session first). Unlike
  // getSession(), a forged or tampered cookie is not accepted.
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
