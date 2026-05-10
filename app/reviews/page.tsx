"use client";

import { useState, useMemo } from "react";
import { Search, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getAllMockReviews, type Review } from "@/lib/mock/dashboardData";
import { ReviewSlideOver } from "@/components/app/dashboard/ReviewSlideOver";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "responded" | "ignored";
type StarsFilter = "all" | "low" | "mid" | "high";

const allReviews = getAllMockReviews();

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          className={n <= rating ? "fill-gold text-gold" : "fill-line text-line"}
        />
      ))}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: Review["status"];
  t: (k: string) => string;
}) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-terra/10 text-terra">
        {t("app.reviews.badge_pending")}
      </span>
    );
  }
  if (status === "responded") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-forest/10 text-forest">
        {t("app.reviews.badge_responded")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ink/8 text-muted">
      {t("app.reviews.badge_rejected")}
    </span>
  );
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>(allReviews);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [starsFilter, setStarsFilter] = useState<StarsFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (starsFilter === "low" && r.rating > 2) return false;
      if (starsFilter === "mid" && r.rating !== 3) return false;
      if (starsFilter === "high" && r.rating < 4) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.authorName.toLowerCase().includes(q) &&
          !r.text.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reviews, statusFilter, starsFilter, search]);

  const handleApprove = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "responded" as const } : r
      )
    );
    setSelectedReview(null);
  };

  const handleReject = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "ignored" as const } : r
      )
    );
    setSelectedReview(null);
  };

  const statusTabs: { key: StatusFilter; labelKey: string }[] = [
    { key: "all", labelKey: "app.reviews.filter_all" },
    { key: "pending", labelKey: "app.reviews.filter_pending" },
    { key: "responded", labelKey: "app.reviews.filter_responded" },
    { key: "ignored", labelKey: "app.reviews.filter_rejected" },
  ];

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="display-serif text-[26px] font-semibold text-forest">
              {t("app.reviews.title")}
            </h1>
            {pendingCount > 0 && (
              <span className="bg-terra text-paper text-xs px-2 py-0.5 rounded-full font-semibold">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-muted text-sm mt-1">{t("app.reviews.subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="bg-paper border border-line rounded-2xl p-4 mb-4">
          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === tab.key
                    ? "bg-forest text-paper"
                    : "text-muted hover:text-ink hover:bg-cream"
                )}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Stars filter + search */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={starsFilter}
              onChange={(e) => setStarsFilter(e.target.value as StarsFilter)}
              className="text-sm text-ink border border-line rounded-lg px-3 py-1.5 bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40 cursor-pointer"
            >
              <option value="all">{t("app.reviews.stars_all")}</option>
              <option value="low">{t("app.reviews.stars_low")}</option>
              <option value="mid">{t("app.reviews.stars_mid")}</option>
              <option value="high">{t("app.reviews.stars_high")}</option>
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("app.reviews.search_placeholder")}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-line rounded-lg bg-cream text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-forest/40"
              />
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-14 text-center text-muted text-sm">
              {t("app.reviews.empty")}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((review) => (
                <li
                  key={review.id}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-cream/50 transition-colors"
                >
                  {/* Avatar */}
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
                      <span className="text-xs text-muted">
                        {review.relativeTime}
                      </span>
                      <StatusBadge status={review.status} t={t} />
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
                    {t("app.reviews.review_action")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
