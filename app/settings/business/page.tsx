"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT = "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40 transition-shadow";
const INPUT_ERR = "w-full px-3 py-2 text-sm text-ink border border-terra/50 rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-terra/40 transition-shadow";

interface FormState {
  name: string;
  type: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const EMPTY: FormState = {
  name: "", type: "restaurant", city: "", country: "",
  address: "", phone: "", email: "", website: "",
};

function isValidEmail(v: string) {
  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidUrl(v: string) {
  if (!v) return true;
  try { new URL(v.startsWith("http") ? v : `https://${v}`); return true; } catch { return false; }
}

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-20 bg-line rounded animate-pulse" />
      <div className="h-9 bg-line rounded-lg animate-pulse" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5 md:p-6 space-y-4">
      <div className="h-5 w-40 bg-line rounded animate-pulse mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <FieldSkeleton key={i} />
        ))}
      </div>
      <div className="h-9 w-32 bg-line rounded-lg animate-pulse mt-2" />
    </div>
  );
}

export default function BusinessPage() {
  const { t } = useTranslation();
  const { user, business, loading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const initialRef = useRef<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (loading || !business) return;
    const data: FormState = {
      name: business.name ?? "",
      type: business.type ?? "restaurant",
      city: business.city ?? "",
      country: business.country ?? "",
      address: business.address ?? "",
      phone: business.phone ?? "",
      email: business.email ?? "",
      website: business.website ?? "",
    };
    setForm(data);
    initialRef.current = data;
  }, [loading, business]);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((err) => ({ ...err, [key]: undefined }));
    };

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialRef.current);

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = t("auth.errors.requiredField");
    if (!form.type) errs.type = t("auth.errors.requiredField");
    if (!isValidEmail(form.email)) errs.email = t("auth.errors.invalidEmail");
    if (!isValidUrl(form.website)) errs.website = "URL no válida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!user || !business) return;
    if (!validate()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        name: form.name.trim(),
        type: form.type,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast.error(t("app.settings.saveError"));
    } else {
      initialRef.current = { ...form };
      toast.success(t("app.settings.saved"));
    }
  };

  if (loading) return <PageSkeleton />;

  if (!business) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10 text-center">
        <p className="text-sm text-muted">{t("app.settings.business_no_data")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-paper border border-line rounded-2xl p-5 md:p-6">
        <h2 className="font-serif font-semibold text-ink text-base mb-5">
          {t("app.settings.business_title")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className={LABEL}>{t("app.settings.business_name")} *</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              className={errors.name ? INPUT_ERR : INPUT}
            />
            {errors.name && <p className="text-xs text-terra mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className={LABEL}>{t("app.settings.business_type")} *</label>
            <select
              value={form.type}
              onChange={set("type")}
              className={cn(errors.type ? INPUT_ERR : INPUT, "cursor-pointer")}
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
            <input type="tel" value={form.phone} onChange={set("phone")} className={INPUT} />
          </div>

          {/* City */}
          <div>
            <label className={LABEL}>{t("app.settings.business_city")}</label>
            <input type="text" value={form.city} onChange={set("city")} className={INPUT} />
          </div>

          {/* Country */}
          <div>
            <label className={LABEL}>{t("app.settings.business_country")}</label>
            <input type="text" value={form.country} onChange={set("country")} className={INPUT} />
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
              className={errors.email ? INPUT_ERR : INPUT}
            />
            {errors.email && <p className="text-xs text-terra mt-1">{errors.email}</p>}
          </div>

          {/* Website */}
          <div>
            <label className={LABEL}>{t("app.settings.business_web")}</label>
            <input
              type="text"
              value={form.website}
              onChange={set("website")}
              placeholder="https://..."
              className={errors.website ? INPUT_ERR : INPUT}
            />
            {errors.website && <p className="text-xs text-terra mt-1">{errors.website}</p>}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              saving || !isDirty
                ? "bg-line text-muted cursor-not-allowed"
                : "bg-forest text-paper hover:bg-forest-dark"
            )}
          >
            {saving ? t("app.settings.saving") : t("app.settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
