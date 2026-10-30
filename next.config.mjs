const isDev = process.env.NODE_ENV !== "production";

// Supabase origin (REST, Auth and Realtime websockets).
let supabaseOrigin = "https://*.supabase.co";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  }
} catch {
  // keep the wildcard
}
const supabaseWs = supabaseOrigin.replace(/^http/, "ws");
const turnstile = "https://challenges.cloudflare.com";

/**
 * Content-Security-Policy. Next.js emits inline bootstrap scripts, so
 * script-src needs 'unsafe-inline' unless every page is rendered dynamically
 * with a per-request nonce (which would disable static rendering). The other
 * directives still block the high-value cases: no external script origins
 * except Turnstile, no plugins, no framing, no foreign form targets, no
 * <base> hijacking. See docs/SECURITY.md (S-12).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} ${turnstile}${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
