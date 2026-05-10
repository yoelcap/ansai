"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { Review } from "@/lib/mock/dashboardData";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "fill-gold text-gold" : "fill-line text-line"}
        />
      ))}
    </div>
  );
}

const mockAIResponses: Record<string, string> = {
  r1: "Gracias, María, por tu reseña y por tomarte el tiempo de compartir tu experiencia. Lamentamos mucho la larga espera y entendemos lo frustrante que puede resultar, especialmente cuando el servicio no estuvo a la altura. Estamos trabajando activamente para mejorar nuestros tiempos de atención en horas de mayor afluencia. Esperamos tener la oportunidad de ofrecerte una experiencia mejor en tu próxima visita.",
  r2: "Hartelijk dank voor uw geweldige beoordeling, Jan! We zijn blij dat het eten en de bediening naar uw wens waren. We kijken er al naar uit u opnieuw te mogen verwelkomen. Tot ziens!",
  r3: "Thank you so much for your kind review, Sophie! We're really glad you enjoyed the food and cosy atmosphere — the pasta is a house favourite. We take your note about service speed to heart and are always working to improve. We hope to see you again soon!",
  r4: "Estimado Carlos, agradecemos que nos haya comunicado su experiencia. Lo que describes es completamente inaceptable y nos ha consternado. Le pedimos disculpas sinceras tanto por el incidente como por la falta de atención de nuestro equipo. Estamos tomando medidas para que esto no vuelva a ocurrir y nos gustaría invitarle a volver para ofrecerle la experiencia que merece.",
  r5: "Dank u wel voor uw vriendelijke beoordeling, Emma! Het doet ons goed te horen dat u genoten heeft van het eten en de sfeer. We hopen u binnenkort weer te mogen verwelkomen. Tot ziens!",
};

function getMockResponse(review: Review): string {
  return (
    mockAIResponses[review.id] ??
    `Gracias por tu reseña, ${review.authorName}. Valoramos mucho tu opinión y esperamos verte de nuevo pronto.`
  );
}

interface ReviewSlideOverProps {
  review: Review | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ReviewSlideOver({
  review,
  onClose,
  onApprove,
  onReject,
}: ReviewSlideOverProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");

  useEffect(() => {
    if (review) {
      setDraftText(getMockResponse(review));
      setIsEditing(false);
    }
  }, [review?.id]);

  if (!review) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ink/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-paper z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-semibold shrink-0">
              {review.authorInitial}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">
                {review.authorName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating rating={review.rating} />
                <span className="text-xs text-muted">{review.relativeTime}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-cream hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Review text */}
          <p className="text-sm text-ink leading-relaxed">{review.text}</p>

          <div className="border-t border-line" />

          {/* AI response */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                {t("app.review_panel.ai_label")}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
                {t("app.review_panel.ai_badge")}
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={8}
                className="w-full text-sm text-ink bg-cream border border-line rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-forest/40 leading-relaxed"
              />
            ) : (
              <p className="text-sm text-ink bg-cream/60 border border-line rounded-lg px-3 py-3 leading-relaxed whitespace-pre-wrap">
                {draftText}
              </p>
            )}

            {isEditing && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
                >
                  {t("app.review_panel.save_changes")}
                </button>
                <button
                  onClick={() => {
                    setDraftText(getMockResponse(review));
                    setIsEditing(false);
                  }}
                  className="px-3 py-2 rounded-lg border border-line text-muted text-sm hover:bg-cream transition-colors"
                >
                  {t("app.review_panel.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {!isEditing && (
          <div className="px-5 py-4 border-t border-line flex gap-2 shrink-0">
            <button
              onClick={() => onApprove(review.id)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              {t("app.review_panel.approve")}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-lg border border-line text-ink text-sm font-medium hover:bg-cream transition-colors"
            >
              {t("app.review_panel.edit")}
            </button>
            <button
              onClick={() => onReject(review.id)}
              className="px-4 py-2.5 rounded-lg border border-terra/30 text-terra text-sm font-medium hover:bg-terra hover:text-paper hover:border-terra transition-all"
            >
              {t("app.review_panel.reject")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
