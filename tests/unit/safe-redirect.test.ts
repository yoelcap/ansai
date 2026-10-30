import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

const FALLBACK = "/dashboard";
const BS = "\\";

describe("safeNextPath (open-redirect guard)", () => {
  it.each([
    ["/reset-password", "/reset-password"],
    ["/settings/tone?tab=1#top", "/settings/tone?tab=1#top"],
    ["/reviews", "/reviews"],
  ])("keeps internal path %s", (input, expected) => {
    expect(safeNextPath(input, FALLBACK)).toBe(expected);
  });

  it.each([
    ["userinfo trick, appended to an origin", "@evil.com"],
    ["protocol-relative", "//evil.com"],
    ["backslash normalised to //", `/${BS}evil.com`],
    ["double backslash", `${BS}${BS}evil.com`],
    ["slash + backslash + slash", `/${BS}/evil.com`],
    ["absolute https URL", "https://evil.com/login"],
    ["javascript: URL", "javascript:alert(1)"],
    ["tab inside the path", "/\t/evil.com"],
    ["newline inside the path", "/\n/evil.com"],
    ["empty string", ""],
  ])("rejects %s", (_label, input) => {
    expect(safeNextPath(input, FALLBACK)).toBe(FALLBACK);
  });

  it("rejects null and undefined", () => {
    expect(safeNextPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("never returns something that resolves to another origin", () => {
    const attacks = ["@evil.com", "//evil.com", `/${BS}evil.com`, "https://evil.com", "/\t/evil.com"];
    for (const attack of attacks) {
      const target = new URL(`https://ansai.app${safeNextPath(attack, FALLBACK)}`);
      expect(target.origin).toBe("https://ansai.app");
    }
  });
});
