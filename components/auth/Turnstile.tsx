"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Cloudflare Turnstile CAPTCHA for the auth forms. Supabase Auth verifies the
 * token server-side (Dashboard → Authentication → Attack Protection), so the
 * browser only has to obtain one and pass it as `captchaToken`.
 *
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY nothing is rendered and no token is
 * required (local development with CAPTCHA disabled in Supabase).
 */

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable"));
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error("Failed to load Turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function TurnstileWidget({
  onToken,
  onError,
}: {
  onToken: (token: string | null) => void;
  onError: () => void;
}) {
  const { locale } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without re-rendering the widget.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        widgetId = api.render(containerRef.current, {
          sitekey: SITE_KEY,
          language: locale,
          theme: "light",
          size: "flexible",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null);
            onErrorRef.current();
          },
        });
      })
      .catch(() => onErrorRef.current());

    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [locale]);

  return <div ref={containerRef} className="min-h-[65px]" data-testid="turnstile" />;
}

/**
 * State + widget for one form. Tokens are single-use: call `reset()` after
 * every submit that reached Supabase (success or failure).
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);

  const reset = useCallback(() => {
    setToken(null);
    setFailed(false);
    setGeneration((g) => g + 1);
  }, []);

  const widget = SITE_KEY ? (
    <TurnstileWidget key={generation} onToken={setToken} onError={() => setFailed(true)} />
  ) : null;

  return {
    /** Pass as `captchaToken`; undefined when CAPTCHA is not configured. */
    token: token ?? undefined,
    /** False while a configured CAPTCHA has not been solved yet. */
    ready: !SITE_KEY || token !== null,
    /** The widget could not load (blocked by an extension, network…). */
    failed,
    reset,
    widget,
  };
}

/** True when Supabase rejected the request because of the CAPTCHA. */
export function isCaptchaError(message: string | undefined): boolean {
  return !!message && /captcha/i.test(message);
}
