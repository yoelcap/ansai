import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // setAll is called once with ALL cookies to set (e.g. chunked session tokens).
        // The old get/set/remove pattern recreated the response on every individual set,
        // which silently dropped all but the last cookie chunk and corrupted the session.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const authOnlyPaths = ["/login", "/signup", "/forgot-password"];
  const protectedPaths = [
    "/dashboard",
    "/reviews",
    "/insights",
    "/settings",
    "/onboarding",
    "/help",
  ];

  const isAuthOnly = authOnlyPaths.some((p) => pathname.startsWith(p));
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Not logged in → block protected routes
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in → redirect away from auth-only pages
  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dev-login") && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};