import type { NextRequest } from "next/server";

/**
 * CSRF guard for cookie-authenticated POST routes: rejects requests a browser
 * sent from another site. Browsers always attach `Origin` (and
 * `Sec-Fetch-Site`) to cross-site POSTs; requests without them come from
 * non-browser clients, which cannot carry a victim's cookies anyway.
 */
export function isCrossSiteRequest(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set([request.nextUrl.origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    } catch {
      // ignore a malformed env value
    }
  }
  return !allowed.has(origin);
}
