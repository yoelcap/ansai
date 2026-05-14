"use client";

import { useState } from "react";
import { Download, CreditCard, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CONTACT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Mock data ────────────────────────────────────────────────────────────────
const PLAN_DATA = {
  starter: { label: "Starter", price: "€25", color: "text-muted" },
  pro:     { label: "Pro",     price: "€75", color: "text-forest" },
  business:{ label: "Business",price: "€150",color: "text-forest" },
} as const;

const INVOICES = [
  { id: "INV-2026-05", date: "1 May 2026",  amount: "€75,00", paid: true },
  { id: "INV-2026-04", date: "1 Abr 2026",  amount: "€75,00", paid: true },
  { id: "INV-2026-03", date: "1 Mar 2026",  amount: "€75,00", paid: true },
  { id: "INV-2026-02", date: "1 Feb 2026",  amount: "€75,00", paid: true },
];

const SECTION = "bg-paper border border-line rounded-2xl p-5 md:p-6";

export default function BillingPage() {
  const { t } = useTranslation();
  const plan = PLAN_DATA["pro"];
  const [cancelConfirm, setCancelConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* ── Current plan ──────────────────────────────────────────────────── */}
      <div className={SECTION}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              {t("app.settings.nav_billing")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-serif text-4xl font-semibold", plan.color)}>
                {plan.label}
              </span>
              <span className="text-muted text-sm">{plan.price}/mes</span>
            </div>
            <p className="text-xs text-muted mt-1.5">
              {t("app.settings.plan_renews")} <span className="text-ink font-medium">11 Jun 2026</span>
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-forest/5 rounded-xl border border-forest/10">
            <Zap size={16} className="text-forest" />
            <span className="text-xs font-medium text-forest">
              {plan.label} — activo
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          <button className="px-4 py-2 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors">
            {t("app.settings.change_plan")}
          </button>

          {!cancelConfirm ? (
            <button
              onClick={() => setCancelConfirm(true)}
              className="px-4 py-2 rounded-lg border border-line text-muted text-sm font-medium hover:bg-cream hover:text-ink transition-colors"
            >
              {t("app.settings.cancel_sub")}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-terra/30 bg-terra/5">
              <span className="text-xs text-terra">¿Seguro?</span>
              <button
                onClick={() => setCancelConfirm(false)}
                className="text-xs font-semibold text-terra hover:text-terra-light"
              >
                {t("app.settings.cancel_sub")}
              </button>
              <span className="text-terra/30">·</span>
              <button
                onClick={() => setCancelConfirm(false)}
                className="text-xs text-muted hover:text-ink"
              >
                No, mantener
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment method ────────────────────────────────────────────────── */}
      <div className={SECTION}>
        <h2 className="font-serif font-semibold text-ink text-base mb-4">
          {t("app.settings.payment_title")}
        </h2>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 rounded-lg border border-line bg-cream flex items-center justify-center">
              <CreditCard size={16} className="text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Visa •••• 4242</p>
              <p className="text-xs text-muted">
                {t("app.settings.payment_expires")} 09/28
              </p>
            </div>
          </div>

          <button className="text-sm text-forest font-medium hover:text-forest-dark transition-colors underline underline-offset-2">
            {t("app.settings.payment_change")}
          </button>
        </div>
      </div>

      {/* ── Invoice history ───────────────────────────────────────────────── */}
      <div className={SECTION}>
        <h2 className="font-serif font-semibold text-ink text-base mb-4">
          {t("app.settings.invoices_title")}
        </h2>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide pb-2.5 pr-4">
                  {t("app.settings.col_date")}
                </th>
                <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide pb-2.5 pr-4">
                  {t("app.settings.col_amount")}
                </th>
                <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide pb-2.5 pr-4">
                  {t("app.settings.col_status")}
                </th>
                <th className="pb-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 pr-4 text-ink">{inv.date}</td>
                  <td className="py-3 pr-4 font-medium text-ink">{inv.amount}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-forest/10 text-forest">
                      {t("app.settings.status_paid")}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="inline-flex items-center gap-1 text-xs text-muted hover:text-forest transition-colors">
                      <Download size={12} />
                      {t("app.settings.download_btn")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <p className="text-sm text-muted pt-1">
        {t("app.settings.billing_contact")}{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-forest hover:text-forest-dark underline underline-offset-2 transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
