"use client";

import { useState } from "react";
import {
  TranslationProvider,
  useTranslation,
  localeFullLabels,
  type Locale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Mock responses per language × tone.
// Replace with real Anthropic API call when ready.
const MOCK: Record<Locale, Record<"formal" | "casual", string>> = {
  es: {
    formal:
      "Estimado cliente, le agradecemos sinceramente haberse tomado el tiempo de compartir su experiencia con nosotros. Lamentamos profundamente los inconvenientes que pudo haber encontrado y le aseguramos que su opinión nos ayuda a mejorar cada día. Esperamos tener pronto el placer de recibirle de nuevo y demostrarle nuestro compromiso con la excelencia. — El equipo de dirección",
    casual:
      "¡Hola! Muchas gracias por tu reseña, de verdad que nos ayuda un montón. Sentimos mucho si algo no estuvo a la altura, eso no va con nosotros. La próxima vez que vengas cuéntanoslo y nos aseguramos de que todo salga perfecto. ¡Te esperamos! — El equipo",
  },
  en: {
    formal:
      "Dear valued guest, thank you sincerely for taking the time to share your feedback with us. We apologise for any inconvenience you may have experienced and remain fully committed to continuous improvement. Your opinion is invaluable to us, and we hope to have the pleasure of welcoming you again very soon. — Management",
    casual:
      "Hey, thanks so much for the review — we really appreciate it! Sorry if anything wasn't quite right, that's definitely not what we're about. Next time you stop by just let us know and we'll make sure everything is spot on. See you soon! — The team",
  },
  nl: {
    formal:
      "Geachte gast, hartelijk dank voor het nemen van de tijd om uw ervaring met ons te delen. Wij bieden onze oprechte excuses aan voor eventuele ongemakken die u heeft ondervonden en blijven vastbesloten om ons aanbod voortdurend te verbeteren. Uw mening is voor ons van grote waarde. Wij hopen u binnenkort weer te mogen verwelkomen. — De directie",
    casual:
      "Hey, super bedankt voor je review! We vinden het echt fijn dat je de moeite neemt. Sorry als iets niet naar wens was, dat willen we echt niet. Volgende keer dat je langskomt laat het ons weten en we zorgen ervoor dat alles perfect is. Tot snel! — Het team",
  },
  fr: {
    formal:
      "Cher client, nous vous remercions sincèrement d'avoir pris le temps de nous faire part de votre expérience. Nous présentons nos excuses pour les désagréments rencontrés et nous nous engageons à améliorer continuellement la qualité de notre service. Votre avis est précieux. Nous espérons avoir bientôt le plaisir de vous accueillir à nouveau. — La direction",
    casual:
      "Bonjour et merci beaucoup pour votre avis, ça compte vraiment pour nous ! On est vraiment désolés si quelque chose n'était pas à la hauteur, ce n'est pas ce qu'on vise. La prochaine fois n'hésitez pas à nous le dire sur place et on s'assure que tout se passe parfaitement. À très bientôt ! — L'équipe",
  },
  it: {
    formal:
      "Gentile cliente, la ringraziamo sinceramente per aver dedicato del tempo a condividere la sua esperienza con noi. Ci scusiamo per gli eventuali inconvenienti riscontrati e ci impegniamo a migliorare continuamente la qualità del nostro servizio. La sua opinione è per noi preziosa. Speriamo di poterla accogliere di nuovo molto presto. — La direzione",
    casual:
      "Ciao! Grazie mille per la tua recensione, ci fa davvero piacere. Siamo dispiaciuti se qualcosa non è stato all'altezza, non è quello che vogliamo. La prossima volta dimmelo e ci assicuriamo che tutto vada alla perfezione. A presto! — Il team",
  },
};

function DemoContent() {
  const { t } = useTranslation();

  const [review, setReview] = useState("");
  const [tone, setTone] = useState<"formal" | "casual">("casual");
  const [responseLang, setResponseLang] = useState<Locale>("es");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleGenerate = async () => {
    if (!review.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setIsLoading(true);
    setResult(null);
    await new Promise((res) => setTimeout(res, 2000));
    setResult(MOCK[responseLang][tone]);
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="container-x py-6 flex items-center justify-between">
        <a
          href="/"
          className="font-serif text-[26px] font-semibold tracking-tight text-forest flex items-center gap-2"
        >
          Replyo
          <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
        </a>
        <a
          href="/"
          className="text-sm font-medium text-muted hover:text-terra transition-colors"
        >
          {t("demo_page.back")}
        </a>
      </header>

      <main>
        {/* Hero */}
        <section className="container-x pt-10 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-line rounded-full text-[13px] font-medium text-forest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-terra" />
            <span>{t("demo_page.eyebrow")}</span>
          </div>
          <h1 className="display-serif text-4xl sm:text-5xl md:text-[64px] leading-[1.0] font-normal text-ink mb-5">
            {t("demo_page.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-[520px] mx-auto leading-relaxed">
            {t("demo_page.subtitle")}
          </p>
        </section>

        {/* Form + Result */}
        <section className="container-x pb-16">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Form card */}
            <div className="bg-paper rounded-3xl border border-line shadow-[0_8px_40px_rgba(20,40,33,0.08)] p-8 md:p-10">

              {/* Textarea */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-ink mb-2">
                  {t("demo_page.review_label")}
                </label>
                <textarea
                  value={review}
                  onChange={(e) => {
                    setReview(e.target.value);
                    if (showError) setShowError(false);
                  }}
                  placeholder={t("demo_page.review_placeholder")}
                  rows={5}
                  className={cn(
                    "w-full px-5 py-4 bg-cream border rounded-2xl text-[15px] resize-none focus:outline-none transition-colors leading-relaxed",
                    showError
                      ? "border-terra"
                      : "border-line focus:border-forest"
                  )}
                />
                {showError && (
                  <p className="text-terra text-sm mt-1.5">
                    {t("demo_page.error")}
                  </p>
                )}
              </div>

              {/* Tone */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-ink mb-2.5">
                  {t("demo_page.tone_label")}
                </label>
                <div className="flex gap-2">
                  {(["casual", "formal"] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setTone(val)}
                      className={cn(
                        "flex-1 py-2.5 rounded-full text-sm font-semibold border transition-all",
                        tone === val
                          ? "bg-forest text-paper border-forest"
                          : "bg-transparent text-ink border-line hover:border-forest"
                      )}
                    >
                      {val === "casual"
                        ? t("demo_page.tone_casual")
                        : t("demo_page.tone_formal")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response language */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-ink mb-2.5">
                  {t("demo_page.lang_label")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(localeFullLabels) as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setResponseLang(l)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                        responseLang === l
                          ? "bg-forest text-paper border-forest"
                          : "bg-transparent text-ink border-line hover:border-forest"
                      )}
                    >
                      {localeFullLabels[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-forest text-paper font-semibold text-sm hover:bg-forest-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,40,33,0.2)] disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none"
              >
                {isLoading ? t("demo_page.generating") : t("demo_page.generate")}
              </button>
            </div>

            {/* Loading spinner */}
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-10 animate-slide-up">
                <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-forest animate-spin" />
                <p className="text-sm text-muted">{t("demo_page.generating")}</p>
              </div>
            )}

            {/* Result card */}
            {result && !isLoading && (
              <div className="bg-paper rounded-3xl border border-line shadow-[0_8px_40px_rgba(20,40,33,0.08)] p-8 animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-terra">
                    ✦ {t("demo_page.result_label")}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-semibold text-muted hover:text-forest transition-colors px-3 py-1 rounded-full border border-line hover:border-forest"
                  >
                    {copied ? t("demo_page.copied") : t("demo_page.copy")}
                  </button>
                </div>

                <div className="bg-cream rounded-2xl px-5 py-4 text-[15px] leading-relaxed text-ink border-l-4 border-forest mb-4">
                  {result}
                </div>

                <p className="text-[12px] text-muted text-center">
                  {t("demo_page.badge")}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="container-x pb-20">
          <div className="max-w-2xl mx-auto bg-forest-dark rounded-3xl px-8 md:px-14 py-14 text-center text-paper">
            <h2 className="display-serif text-3xl md:text-[40px] font-normal leading-tight mb-3">
              {t("demo_page.cta_title")}
            </h2>
            <p className="text-white/70 mb-8 text-base">{t("demo_page.cta_sub")}</p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-paper text-forest font-semibold text-sm hover:bg-gold hover:text-forest-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            >
              {t("demo_page.cta_btn")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <TranslationProvider>
      <DemoContent />
    </TranslationProvider>
  );
}
