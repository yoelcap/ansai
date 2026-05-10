"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MOCK = {
  name: "La Trattoria Marco",
  type: "restaurant",
  address: "Calle Mercado 12, 2800 Mechelen",
  phone: "+32 15 43 21 00",
  email: "info@latrattoriamarco.be",
  web: "www.latrattoriamarco.be",
  hours: "Lun–Vie: 12h–22h  ·  Sáb–Dom: 12h–23h",
};

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT =
  "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40 transition-shadow";

export default function BusinessPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(MOCK);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof MOCK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-paper border border-line rounded-2xl p-5 md:p-6">
        <h2 className="font-serif font-semibold text-ink text-base mb-5">
          {t("app.settings.business_title")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Business name */}
          <div className="sm:col-span-2">
            <label className={LABEL}>{t("app.settings.business_name")}</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              className={INPUT}
            />
          </div>

          {/* Business type */}
          <div>
            <label className={LABEL}>{t("app.settings.business_type")}</label>
            <select
              value={form.type}
              onChange={set("type")}
              className={cn(INPUT, "cursor-pointer")}
            >
              <option value="restaurant">{t("app.settings.business_type_restaurant")}</option>
              <option value="bar">{t("app.settings.business_type_bar")}</option>
              <option value="cafe">{t("app.settings.business_type_cafe")}</option>
              <option value="hotel">{t("app.settings.business_type_hotel")}</option>
              <option value="other">{t("app.settings.business_type_other")}</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className={LABEL}>{t("app.settings.business_phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              className={INPUT}
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className={LABEL}>{t("app.settings.business_address")}</label>
            <input
              type="text"
              value={form.address}
              onChange={set("address")}
              className={INPUT}
            />
          </div>

          {/* Email */}
          <div>
            <label className={LABEL}>{t("app.settings.business_email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              className={INPUT}
            />
          </div>

          {/* Web */}
          <div>
            <label className={LABEL}>{t("app.settings.business_web")}</label>
            <input
              type="text"
              value={form.web}
              onChange={set("web")}
              className={INPUT}
            />
          </div>

          {/* Hours */}
          <div className="sm:col-span-2">
            <label className={LABEL}>{t("app.settings.business_hours")}</label>
            <input
              type="text"
              value={form.hours}
              onChange={set("hours")}
              className={INPUT}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              saved
                ? "bg-forest/70 text-paper cursor-default"
                : "bg-forest text-paper hover:bg-forest-dark"
            )}
          >
            {saved ? t("app.settings.saved") : t("app.settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
