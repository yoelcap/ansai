import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isCrossSiteRequest } from "@/lib/http";

function post(headers: Record<string, string>) {
  return new NextRequest("https://ansai.app/api/demo/login", { method: "POST", headers });
}

describe("isCrossSiteRequest (CSRF guard)", () => {
  it("allows same-origin browser requests", () => {
    expect(isCrossSiteRequest(post({ origin: "https://ansai.app", "sec-fetch-site": "same-origin" }))).toBe(false);
  });

  it("allows non-browser requests without Origin (they carry no victim cookies)", () => {
    expect(isCrossSiteRequest(post({}))).toBe(false);
  });

  it("rejects another origin", () => {
    expect(isCrossSiteRequest(post({ origin: "https://evil.example" }))).toBe(true);
  });

  it("rejects Sec-Fetch-Site: cross-site even if Origin is missing", () => {
    expect(isCrossSiteRequest(post({ "sec-fetch-site": "cross-site" }))).toBe(true);
  });

  it("rejects look-alike origins", () => {
    expect(isCrossSiteRequest(post({ origin: "https://ansai.app.evil.example" }))).toBe(true);
    expect(isCrossSiteRequest(post({ origin: "http://ansai.app" }))).toBe(true);
  });
});
