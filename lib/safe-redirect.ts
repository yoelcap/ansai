/**
 * Returns `input` only if it is an internal path of this site, else `fallback`.
 *
 * Guards every user-controlled redirect target (`?next=`, `?redirect=`)
 * against open redirects. Rejected: absolute URLs ("https://evil.com"),
 * protocol-relative ("//evil.com"), backslash tricks ("/\\evil.com", which
 * browsers normalise to "//"), userinfo tricks ("@evil.com" appended to an
 * origin) and anything with control characters.
 */
export function safeNextPath(input: string | null | undefined, fallback: string): string {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\")) {
    return fallback;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(input)) return fallback;

  const base = "http://internal.invalid";
  try {
    const url = new URL(input, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
