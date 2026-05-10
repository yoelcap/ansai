"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT =
  "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40 transition-shadow";
const SECTION = "bg-paper border border-line rounded-2xl p-5 md:p-6";

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export default function AccountPage() {
  const { t, locale, setLocale } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();

  // ── Personal data ──────────────────────────────────────────────────────────
  const [name, setName] = useState("Marco Rossi");
  const [email] = useState(user?.email ?? "demo@ansai.app");
  const [personalSaved, setPersonalSaved] = useState(false);

  // ── Password ───────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordSaved, setPasswordSaved] = useState(false);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deleteEmail, setDeleteEmail] = useState("");
  const canDelete = deleteEmail.trim() === email;

  const handlePersonalSave = () => {
    setPersonalSaved(true);
    setTimeout(() => setPersonalSaved(false), 2500);
  };

  const handlePasswordSave = () => {
    setPasswordSaved(true);
    setPasswords({ current: "", next: "", confirm: "" });
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  const handleDelete = () => {
    // TODO: reemplazar por Supabase Auth (deleteUser)
    logout();
    router.replace("/dev-login");
  };

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
              value={email}
              readOnly
              className={cn(INPUT, "opacity-60 cursor-not-allowed")}
            />
          </div>

          <div>
            <label className={LABEL}>{t("app.settings.account_language")}</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
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
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              personalSaved
                ? "bg-forest/70 text-paper cursor-default"
                : "bg-forest text-paper hover:bg-forest-dark"
            )}
          >
            {personalSaved ? t("app.settings.saved") : t("app.settings.save")}
          </button>
        </div>
      </div>

      {/* ── Change password ─────────────────────────────────────────────────── */}
      <div className={SECTION}>
        <h2 className="font-serif font-semibold text-ink text-base mb-5">
          {t("app.settings.account_password_section")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>{t("app.settings.account_current_password")}</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>{t("app.settings.account_new_password")}</label>
            <input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>{t("app.settings.account_confirm_password")}</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={INPUT}
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handlePasswordSave}
            disabled={!passwords.current || !passwords.next || !passwords.confirm}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              passwordSaved
                ? "bg-forest/70 text-paper cursor-default"
                : passwords.current && passwords.next && passwords.confirm
                ? "bg-forest text-paper hover:bg-forest-dark"
                : "bg-line text-muted cursor-not-allowed"
            )}
          >
            {passwordSaved ? t("app.settings.saved") : t("app.settings.save")}
          </button>
        </div>
      </div>

      {/* ── Danger zone ─────────────────────────────────────────────────────── */}
      <div className="bg-paper border border-terra/30 rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-terra shrink-0" />
          <h2 className="font-serif font-semibold text-terra text-base">
            {t("app.settings.account_danger")}
          </h2>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ink mb-1">
            {t("app.settings.account_delete_title")}
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            {t("app.settings.account_delete_desc")}
          </p>

          <div className="max-w-sm space-y-3">
            <div>
              <label className={LABEL}>{t("app.settings.account_delete_confirm_label")}</label>
              <input
                type="email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder={email}
                className={cn(INPUT, "border-terra/30 focus:ring-terra/30")}
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={!canDelete}
              className={cn(
                "w-full px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                canDelete
                  ? "bg-terra text-paper hover:bg-terra-light"
                  : "bg-terra/15 text-terra/40 cursor-not-allowed"
              )}
            >
              {t("app.settings.account_delete_btn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
