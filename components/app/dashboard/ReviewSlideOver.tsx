"use client";

import { useState, useEffect } from "react";
import { X, Star, RefreshCw } from "lucide-react";
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

// Extends Review with optional real-data fields (all extra fields optional
// so that plain Review objects remain assignable to this type).
export interface ReviewWithResponse extends Omit<Review, "language" | "status" | "source"> {
  language: string;
  status: string;
  source: string;
  responseText?: string | null;
  editedText?: string | null;
  responseStatus?: string | null;
  modelUsed?: string | null;
}

interface ReviewSlideOverProps {
  review: ReviewWithResponse | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onRetry?: (id: string) => void;
}

export function ReviewSlideOver({
  review,
  onClose,
  onApprove,
  onReject,
  onEdit,
  onRetry,
}: ReviewSlideOverProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");

  useEffect(() => {
    if (review) {
      setDraftText(review.editedText ?? review.responseText ?? "");
      setIsEditing(false);
    }
  }, [review?.id]);

  if (!review) return null;

  const hasFailed = review.responseStatus === "generation_failed";
  const modelLabel =
    review.modelUsed === "claude-opus-4-7"
      ? t("app.reviews.modelUsedOpus")
      : review.modelUsed === "claude-haiku-4-5-20251001"
      ? t("app.reviews.modelUsedHaiku")
      : null;

  function handleSaveEdit() {
    if (!review) return;
    onEdit?.(review.id, draftText);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setDraftText(review?.editedText ?? review?.responseText ?? "");
    setIsEditing(false);
  }

  const displayText = review.editedText || draftText;

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

          {/* AI response section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  {t("app.review_panel.ai_label")}
                </span>
                {!hasFailed && displayText && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
                    {t("app.review_panel.ai_badge")}
                  </span>
                )}
              </div>
              {modelLabel && !hasFailed && (
                <span className="text-[10px] px-2 py-0.5 bg-ink/8 text-muted rounded font-medium shrink-0">
                  {modelLabel}
                </span>
              )}
            </div>

            {hasFailed ? (
              <div className="rounded-lg border border-terra/30 bg-terra/5 px-4 py-3 text-sm text-terra flex items-center justify-between gap-3">
                <span>{t("app.reviews.generationFailed")}</span>
                {onRetry && (
                  <button
                    onClick={() => onRetry(review.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-terra border border-terra/40 rounded-lg px-2.5 py-1.5 hover:bg-terra hover:text-paper transition-all shrink-0"
                  >
                    <RefreshCw size={12} />
                    {t("app.reviews.retry")}
                  </button>
                )}
              </div>
            ) : isEditing ? (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={8}
                className="w-full text-sm text-ink bg-cream border border-line rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-forest/40 leading-relaxed"
              />
            ) : (
              <p className="text-sm text-ink bg-cream/60 border border-line rounded-lg px-3 py-3 leading-relaxed whitespace-pre-wrap">
                {displayText || "—"}
              </p>
            )}

            {isEditing && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-3 py-2 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
                >
                  {t("app.review_panel.save_changes")}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-2 rounded-lg border border-line text-muted text-sm hover:bg-cream transition-colors"
                >
                  {t("app.review_panel.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {!isEditing && !hasFailed && (
          <div className="px-5 py-4 border-t border-line flex gap-2 shrink-0">
            <button
              onClick={() => onApprove(review.id)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              {t("app.review_panel.approve")}
            </button>
            {onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 rounded-lg border border-line text-ink text-sm font-medium hover:bg-cream transition-colors"
              >
                {t("app.review_panel.edit")}
              </button>
            )}
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
