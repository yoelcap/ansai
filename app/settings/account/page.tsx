"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Mail } from "lucide-react";
import { useTranslation, Locale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { useToast } from "@/lib/hooks/useToast";
import { CONTACT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT = "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40 transition-shadow";
const INPUT_ERR = "w-full px-3 py-2 text-sm text-ink border border-terra/50 rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-terra/40 transition-shadow";
const SECTION = "bg-paper border border-line rounded-2xl p-5 md:p-6";

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-paper border border-line rounded-2xl p-5 md:p-6 animate-pulse space-y-4">
          <div className="h-5 w-40 bg-line rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3 w-20 bg-line rounded" />
                <div className="h-9 bg-line rounded-lg" />
              </div>
            ))}
          </div>
          <div className="h-9 w-32 bg-line rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function AccountPage() {
  const { t, locale, setLocale } = useTranslation();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  // ── Personal data ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Locale>(locale);
  const initialName = useRef("");
  const initialLang = useRef<Locale>(locale);
  const [personalSaving, setPersonalSaving] = useState(false);

  // ── Password ───────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<{ next?: string; confirm?: string }>({});
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Delete zone ────────────────────────────────────────────────────────────
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;
    const n = profile.full_name ?? "";
    const lang = (profile.interface_language as Locale) ?? locale;
    setName(n);
    setLanguage(lang);
    initialName.current = n;
    initialLang.current = lang;
  }, [loading, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPersonalDirty =
    name !== initialName.current || language !== initialLang.current;

  const handlePersonalSave = async () => {
    if (!user) return;
    setPersonalSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), interface_language: language })
      .eq("id", user.id);

    setPersonalSaving(false);

    if (error) {
      toast.error(t("app.settings.saveError"));
    } else {
      initialName.current = name.trim();
      initialLang.current = language;
      setLocale(language);
      toast.success(t("app.settings.saved"));
    }
  };

  const validatePassword = () => {
    const errs: { next?: string; confirm?: string } = {};
    if (passwords.next.length < 8) errs.next = t("auth.errors.weakPassword");
    if (passwords.next !== passwords.confirm) errs.confirm = t("auth.errors.passwordsDontMatch");
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) return;
    setPasswordSaving(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwords.next });

    setPasswordSaving(false);

    if (error) {
      toast.error(t("app.settings.saveError"));
    } else {
      setPasswords({ next: "", confirm: "" });
      setPwErrors({});
      toast.success(t("app.settings.saved"));
    }
  };

  const canSavePassword =
    passwords.next.length >= 8 && passwords.next === passwords.confirm;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      {/* ── Personal data ──────────────────────────────────────────────────── */}
      <div className={SECTION}>
        <h2 className="font-serif font-semibold text-ink text-base mb-5">
          {t("app.settings.account_personal")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t("app.settings.account_name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>{t("app.settings.account_email")}</label>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className={cn(INPUT, "opacity-60 cursor-not-allowed")}
            />
          </div>

          <div>
            <label className={LABEL}>{t("app.settings.account_language")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Locale)}
              className={cn(INPUT, "cursor-pointer")}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handlePersonalSave}
            disabled={personalSaving || !isPersonalDirty}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              personalSaving || !isPersonalDirty
                ? "bg-line text-muted cursor-not-allowed"
                : "bg-forest text-paper hover:bg-forest-dark"
            )}
          >
            {personalSaving ? t("app.settings.saving") : t("app.settings.save")}
          </button>
        </div>
      </div>

      {/* ── Change password ─────────────────────────────────────────────────── */}
      <div className={SECTION}>
        <h2 className="font-serif font-semibold text-ink text-base mb-5">
          {t("app.settings.account_password_section")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t("app.settings.account_new_password")}</label>
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => {
                setPasswords((p) => ({ ...p, next: e.target.value }));
                setPwErrors((err) => ({ ...err, next: undefined }));
              }}
              className={pwErrors.next ? INPUT_ERR : INPUT}
            />
            {pwErrors.next && <p className="text-xs text-terra mt-1">{pwErrors.next}</p>}
          </div>

          <div>
            <label className={LABEL}>{t("app.settings.account_confirm_password")}</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => {
                setPasswords((p) => ({ ...p, confirm: e.target.value }));
                setPwErrors((err) => ({ ...err, confirm: undefined }));
              }}
              className={pwErrors.confirm ? INPUT_ERR : INPUT}
            />
            {pwErrors.confirm && (
              <p className="text-xs text-terra mt-1">{pwErrors.confirm}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handlePasswordSave}
            disabled={passwordSaving || !canSavePassword}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              passwordSaving || !canSavePassword
                ? "bg-line text-muted cursor-not-allowed"
                : "bg-forest text-paper hover:bg-forest-dark"
            )}
          >
            {passwordSaving ? t("app.settings.saving") : t("app.settings.save")}
          </button>
        </div>
      </div>

      {/* ── Danger zone ─────────────────────────────────────────────────────── */}
      <div className="bg-paper border border-terra/30 rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-terra shrink-0" />
          <h2 className="font-serif font-semibold text-terra text-base">
            {t("app.settings.account_danger")}
          </h2>
        </div>

        <h3 className="text-sm font-semibold text-ink mb-1">
          {t("app.settings.account_delete_title")}
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          {t("app.settings.account_delete_desc")}
        </p>

        {!showDeleteInfo ? (
          <button
            onClick={() => setShowDeleteInfo(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-terra/10 text-terra hover:bg-terra/20 border border-terra/30 transition-colors"
          >
            {t("app.settings.account_delete_btn")}
          </button>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-terra/5 border border-terra/20 rounded-xl max-w-sm">
            <Mail size={15} className="text-terra shrink-0 mt-0.5" />
            <p className="text-sm text-ink leading-relaxed">
              Para eliminar tu cuenta escríbenos a{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-forest underline underline-offset-2 hover:text-forest-dark transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
