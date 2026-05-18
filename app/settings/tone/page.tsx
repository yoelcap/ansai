"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Formality = 0 | 1 | 2 | 3 | 4;
type Length = "short" | "medium" | "long";

const FORMALITY_DB = ["very_informal", "informal", "neutral", "formal", "very_formal"] as const;
const toFormalityDB = (i: Formality) => FORMALITY_DB[i];
const fromFormalityDB = (s: string | null): Formality => {
  const idx = FORMALITY_DB.indexOf(s as (typeof FORMALITY_DB)[number]);
  return (idx >= 0 ? idx : 2) as Formality;
};

interface FormState {
  formality: Formality;
  length: Length;
  language: string;
  signature: string;
  forbidden: string;
  favorites: string;
}

const DEFAULT: FormState = {
  formality: 2,
  length: "medium",
  language: "auto",
  signature: "",
  forbidden: "",
  favorites: "",
};

// ─── Preview generation ───────────────────────────────────────────────────────
const GREETINGS: Record<Formality, string> = {
  0: "¡Hola María! ",
  1: "¡Hola María! ",
  2: "Estimada María, ",
  3: "Estimada Sra. García, ",
  4: "Muy estimada Sra. García, ",
};
const THANKS: Record<Formality, string> = {
  0: "Gracias por tu reseña 😊 ",
  1: "Gracias por compartir tu experiencia. ",
  2: "Gracias por su valoración. ",
  3: "Le agradecemos sinceramente su valoración. ",
  4: "Le agradecemos profundamente haber compartido esta valoración. ",
};
const POSITIVE: Record<Formality, string> = {
  0: "¡Nos alegra un montón que la pasta te haya encantado! ",
  1: "Nos alegra saber que disfrutaste de nuestra pasta. ",
  2: "Nos complace saber que encontró nuestra pasta de su agrado. ",
  3: "Es un placer saber que encontró nuestra pasta de su agrado. ",
  4: "Nos gratifica enormemente que encontrara nuestra pasta de su agrado. ",
};
const APOLOGY: Record<Formality, string> = {
  0: "Tienes razón, esperasteis demasiado y lo sentimos mucho. ",
  1: "Lamentamos el tiempo de espera y estamos trabajando para reducirlo. ",
  2: "Lamentamos el tiempo de espera y estamos tomando medidas al respecto. ",
  3: "Somos conscientes y estamos adoptando las medidas necesarias. ",
  4: "Tomamos debida nota y estamos implementando las medidas correctivas pertinentes con carácter urgente. ",
};
const CLOSING: Record<Formality, string> = {
  0: "¡Esperamos verte de nuevo muy pronto! 🙌",
  1: "¡Esperamos verte pronto!",
  2: "Esperamos poder ofrecerle una experiencia más satisfactoria.",
  3: "Esperamos tener el placer de atenderle de nuevo.",
  4: "Quedamos a su entera disposición y esperamos tener el honor de volver a atenderle.",
};

function generatePreview(f: Formality, length: Length, signature: string): string {
  let text = GREETINGS[f] + THANKS[f];
  if (length !== "short") text += POSITIVE[f];
  text += APOLOGY[f];
  if (length === "long") text += "Cada opinión nos ayuda a mejorar día a día. ";
  text += CLOSING[f];
  if (signature.trim()) text += "\n\n" + signature.trim();
  return text;
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-2";
const INPUT = "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40";
const TEXTAREA = cn(INPUT, "resize-none");
const SECTION = "bg-paper border border-line rounded-2xl p-5";

// ─── Sub-components ───────────────────────────────────────────────────────────
function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border transition-colors",
              value === o.value
                ? "bg-forest text-paper border-forest"
                : "text-muted border-line hover:text-ink hover:border-ink/30"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= n ? "fill-gold text-gold" : "fill-line text-line"}
        />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
      <div className="space-y-4">
        <div className="bg-paper border border-line rounded-2xl p-5 animate-pulse space-y-6">
          <div className="h-5 w-40 bg-line rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-line rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-8 w-20 bg-line rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-paper border border-line rounded-2xl p-5 h-64 animate-pulse" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TonePage() {
  const { t } = useTranslation();
  const { business, loading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(DEFAULT);
  const initialRef = useRef<FormState>(DEFAULT);
  const [dbLoading, setDbLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!business?.id) { setDbLoading(false); return; }

    const supabase = createClient();
    supabase
      .from("tone_configs")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) toast.error(t("app.settings.loadError"));
        if (data) {
          const loaded: FormState = {
            formality: fromFormalityDB(data.formality),
            length: (data.response_length as Length) ?? "medium",
            language: data.response_language ?? "auto",
            signature: data.signature ?? "",
            forbidden: (data.forbidden_phrases as string[] | null)?.join("\n") ?? "",
            favorites: (data.favorite_phrases as string[] | null)?.join("\n") ?? "",
          };
          setForm(loaded);
          initialRef.current = loaded;
        }
        setDbLoading(false);
      });
  }, [loading, business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialRef.current);

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("tone_configs").upsert(
      {
        business_id: business.id,
        formality: toFormalityDB(form.formality),
        response_length: form.length,
        response_language: form.language,
        signature: form.signature.trim() || null,
        forbidden_phrases: form.forbidden
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        favorite_phrases: form.favorites
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      { onConflict: "business_id" }
    );

    setSaving(false);

    if (error) {
      toast.error(t("app.settings.saveError"));
    } else {
      initialRef.current = { ...form };
      toast.success(t("app.settings.saved"));
    }
  };

  const preview = generatePreview(form.formality, form.length, form.signature);

  const formalityOptions = ([0, 1, 2, 3, 4] as Formality[]).map((v) => ({
    value: v,
    label: t(`app.settings.tone_formality_${v}`),
  }));

  const lengthOptions: { value: Length; label: string }[] = [
    { value: "short", label: t("app.settings.tone_short") },
    { value: "medium", label: t("app.settings.tone_medium") },
    { value: "long", label: t("app.settings.tone_long") },
  ];

  if (loading || dbLoading) return <PageSkeleton />;

  if (!business) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10 text-center">
        <p className="text-sm text-muted">{t("app.settings.business_no_data")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
      {/* ── Left: settings form ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className={SECTION}>
          <h2 className="font-serif font-semibold text-ink text-base mb-5">
            {t("app.settings.tone_title")}
          </h2>

          <div className="space-y-6">
            <PillGroup
              label={t("app.settings.tone_formality")}
              options={formalityOptions}
              value={form.formality}
              onChange={(v) => set("formality", v)}
            />

            <PillGroup
              label={t("app.settings.tone_length")}
              options={lengthOptions}
              value={form.length}
              onChange={(v) => set("length", v)}
            />

            <div>
              <label className={LABEL}>{t("app.settings.tone_language")}</label>
              <select
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                className={cn(INPUT, "cursor-pointer")}
              >
                <option value="auto">{t("app.settings.tone_lang_auto")}</option>
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className={LABEL}>{t("app.settings.tone_signature")}</label>
              <input
                type="text"
                value={form.signature}
                onChange={(e) => set("signature", e.target.value)}
                placeholder={t("app.settings.tone_signature_placeholder")}
                className={INPUT}
              />
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>{t("app.settings.tone_forbidden")}</label>
              <textarea
                rows={3}
                value={form.forbidden}
                onChange={(e) => set("forbidden", e.target.value)}
                placeholder={t("app.settings.tone_forbidden_placeholder")}
                className={TEXTAREA}
              />
            </div>
            <div>
              <label className={LABEL}>{t("app.settings.tone_favorites")}</label>
              <textarea
                rows={3}
                value={form.favorites}
                onChange={(e) => set("favorites", e.target.value)}
                placeholder={t("app.settings.tone_favorites_placeholder")}
                className={TEXTAREA}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            "w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
            saving || !isDirty
              ? "bg-line text-muted cursor-not-allowed"
              : "bg-forest text-paper hover:bg-forest-dark"
          )}
        >
          {saving ? t("app.settings.saving") : t("app.settings.save_tone")}
        </button>
      </div>

      {/* ── Right: sticky live preview ─────────────────────────────────────── */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <div className={cn(SECTION, "space-y-4")}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            {t("app.settings.tone_preview_title")}
          </p>

          <div className="bg-cream rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              {t("app.settings.tone_preview_review_label")}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center text-[10px] font-semibold">
                M
              </div>
              <span className="text-xs font-semibold text-ink">María García</span>
              <StarRow n={3} />
            </div>
            <p className="text-xs text-ink leading-relaxed">
              La comida estaba deliciosa, especialmente la pasta fresca. Sin embargo, esperamos
              casi 40 minutos para que nos atendieran pese a tener reserva.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
              {t("app.settings.tone_preview_response_label")}
            </p>
            <div className="bg-forest/5 border border-forest/15 rounded-xl p-3.5">
              <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{preview}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
              {t(`app.settings.tone_formality_${form.formality}`)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
              {t(`app.settings.tone_${form.length}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
