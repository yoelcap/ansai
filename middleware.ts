import { NextResponse, type NextRequest } from "next/server";

// TODO: reemplazar por Supabase Auth
// import { createServerClient } from "@supabase/ssr";
const FAKE_AUTH_COOKIE = "replyo_fake_user";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // TODO: reemplazar por Supabase Auth (createServerClient + getUser)
  const fakeUserCookie = request.cookies.get(FAKE_AUTH_COOKIE);
  const isAuthenticated = !!fakeUserCookie?.value;

  const protectedRoutes = ["/dashboard", "/reviews", "/insights", "/settings", "/onboarding"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/dev-login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/dev-login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
