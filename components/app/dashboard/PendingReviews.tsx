"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { Review } from "@/lib/mock/dashboardData";
import { ReviewSlideOver } from "./ReviewSlideOver";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          className={
            n <= rating
              ? "fill-gold text-gold"
              : "fill-line text-line"
          }
        />
      ))}
    </div>
  );
}

export function PendingReviews({ reviews: initialReviews }: { reviews: Review[] }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const handleApprove = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelectedReview(null);
  };

  const handleReject = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelectedReview(null);
  };

  return (
    <>
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-serif font-semibold text-ink text-base">
            {t("app.dashboard.pending_title")}
          </h2>
          <Link
            href="/reviews"
            className="text-xs font-medium text-terra hover:text-terra-light transition-colors"
          >
            {t("app.dashboard.view_all")} →
          </Link>
        </div>

        <ul className="divide-y divide-line">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-cream/50 transition-colors"
            >
              {/* Initial avatar */}
              <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                {review.authorInitial}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink">
                    {review.authorName}
                  </span>
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted">{review.relativeTime}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-soft line-clamp-2 leading-snug">
                  {review.text}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => setSelectedReview(review)}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-forest/40 text-forest text-xs font-medium hover:bg-forest hover:text-paper hover:border-forest transition-all"
              >
                {t("app.dashboard.review_action")}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ReviewSlideOver
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
