"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, Star, Plus, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { ReviewSlideOver, type ReviewWithResponse } from "@/components/app/dashboard/ReviewSlideOver";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { usePendingCount } from "@/lib/hooks/usePendingCount";

type StatusFilter = "all" | "pending" | "responded" | "ignored";
type StarsFilter = "all" | "low" | "mid" | "high";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string | null | undefined, locale: string): string {
  if (!isoDate) return "";
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (mins < 60) return rtf.format(-mins, "minute");
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-days, "day");
  } catch {
    return "";
  }
}

function mapDbStatus(dbStatus: string): ReviewWithResponse["status"] {
  if (dbStatus === "approved" || dbStatus === "published") return "responded";
  if (dbStatus === "rejected") return "ignored";
  return "pending";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any, locale: string): ReviewWithResponse {
  const response = Array.isArray(row.responses) ? row.responses[0] : row.responses;
  const authorName: string = row.customer_name ?? "—";
  return {
    id: row.id,
    authorName,
    authorInitial: authorName.charAt(0).toUpperCase(),
    rating: Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5,
    text: row.text ?? "",
    language: row.language ?? "es",
    createdAt: row.created_at ?? "",
    relativeTime: formatRelativeTime(row.review_date ?? row.created_at, locale),
    status: mapDbStatus(row.status ?? "pending"),
    source: row.source ?? "manual",
    responseText: response?.text ?? null,
    editedText: response?.edited_text ?? null,
    responseStatus: response?.status ?? null,
    modelUsed: response?.model_used ?? null,
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── sub-components ──────────────────────────────────────────────────────────

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

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-terra/10 text-terra">
        {t("app.reviews.badge_pending")}
      </span>
    );
  if (status === "responded")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-forest/10 text-forest">
        {t("app.reviews.badge_responded")}
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ink/8 text-muted">
      {t("app.reviews.badge_rejected")}
    </span>
  );
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-line">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-3.5">
          <div className="w-8 h-8 rounded-full bg-line animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-line rounded animate-pulse w-32" />
            <div className="h-3 bg-line rounded animate-pulse w-full" />
            <div className="h-3 bg-line rounded animate-pulse w-3/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Add Review Modal ─────────────────────────────────────────────────────────

interface AddReviewModalProps {
  onClose: () => void;
  onSaved: (reviewId: string, newReview: ReviewWithResponse) => void;
  businessId: string;
}

function AddReviewModal({ onClose, onSaved, businessId }: AddReviewModalProps) {
  const { t, locale } = useTranslation();
  const supabase = createClient();

  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [date, setDate] = useState(todayISO());
  const [reviewText, setReviewText] = useState("");
  const [language, setLanguage] = useState<string>("es");
  const [platform, setPlatform] = useState("manual");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({ customerName: false, reviewText: false });

  const nameError = touched.customerName && !customerName.trim()
    ? t("app.reviews.form_validation_name")
    : "";
  const textError = touched.reviewText && reviewText.trim().length < 10
    ? t("app.reviews.form_validation_text")
    : "";
  const isValid = customerName.trim() && reviewText.trim().length >= 10;


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ customerName: true, reviewText: true });
    if (!isValid) return;

    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        business_id: businessId,
        customer_name: customerName.trim(),
        rating,
        text: reviewText.trim(),
        language,
        source: platform,
        review_date: date ? new Date(date).toISOString() : new Date().toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    setSaving(false);

    if (error || !inserted) {
      return;
    }

    const now = new Date().toISOString();
    const name = customerName.trim();
    const newReview: ReviewWithResponse = {
      id: inserted.id as string,
      authorName: name,
      authorInitial: name.charAt(0).toUpperCase(),
      rating: Math.min(5, Math.max(1, rating)) as 1 | 2 | 3 | 4 | 5,
      text: reviewText.trim(),
      language,
      createdAt: now,
      relativeTime: formatRelativeTime(now, locale),
      status: "pending",
      source: platform,
      responseText: null,
      editedText: null,
      responseStatus: "generating",
      modelUsed: null,
    };
    onSaved(inserted.id as string, newReview);
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-[520px] flex flex-col max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-line flex items-center justify-between shrink-0">
            <h2 className="font-serif font-semibold text-ink text-base">
              {t("app.reviews.addReview")}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-cream hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Customer name */}
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                {t("app.reviews.form_customerName")} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, customerName: true }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40"
              />
              {nameError && <p className="mt-1 text-xs text-terra">{nameError}</p>}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                {t("app.reviews.form_rating")}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-0.5"
                  >
                    <Star
                      size={22}
                      className={n <= rating ? "fill-gold text-gold" : "fill-line text-line"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                {t("app.reviews.form_date")}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40"
              />
            </div>

            {/* Review text */}
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                {t("app.reviews.form_reviewText")} *
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, reviewText: true }))}
                rows={4}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-cream resize-none focus:outline-none focus:ring-1 focus:ring-forest/40"
              />
              {textError && <p className="mt-1 text-xs text-terra">{textError}</p>}
            </div>

            {/* Language + Platform row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-ink-soft mb-1">
                  {t("app.reviews.form_language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40"
                >
                  <option value="es">🇪🇸 Español</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="nl">🇳🇱 Nederlands</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-ink-soft mb-1">
                  {t("app.reviews.form_platform")}
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40"
                >
                  <option value="manual">Manual</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="tripadvisor">TripAdvisor</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t("app.reviews.form_saving") : t("app.reviews.form_save")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { t, locale } = useTranslation();
  const { business, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { refreshPendingCount } = usePendingCount();
  const supabase = createClient();

  const [reviews, setReviews] = useState<ReviewWithResponse[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDbRowsRef = useRef<any[]>([]); // backup for locale-only remaps
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [starsFilter, setStarsFilter] = useState<StarsFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewWithResponse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadReviews = useCallback(async (businessId: string) => {
    setDataLoading(true);
    setDataError(null);
    const { data, error } = await supabase
      .from("reviews")
      .select("*, responses(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      setDataError(error.message);
      setDataLoading(false);
      return;
    }
    const rows = data ?? [];
    rawDbRowsRef.current = rows;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setReviews(rows.map((r: any) => mapRow(r, locale)));
    setDataLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // locale omitted — locale changes trigger the re-map effect below, not a re-fetch

  useEffect(() => {
    if (!authLoading && business?.id) {
      loadReviews(business.id);
    } else if (!authLoading && !business) {
      setDataLoading(false);
    }
  }, [authLoading, business?.id, loadReviews]);

  // Re-map relative times when locale changes without re-fetching from Supabase
  useEffect(() => {
    if (rawDbRowsRef.current.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReviews(rawDbRowsRef.current.map((r: any) => mapRow(r, locale)));
    }
  }, [locale]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (starsFilter === "low" && r.rating > 2) return false;
      if (starsFilter === "mid" && r.rating !== 3) return false;
      if (starsFilter === "high" && r.rating < 4) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.authorName.toLowerCase().includes(q) && !r.text.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [reviews, statusFilter, starsFilter, search]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApprove = useCallback(async (id: string) => {
    await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
    await supabase
      .from("responses")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("review_id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: "responded" } : r));
    setSelectedReview(null);
    refreshPendingCount();
    toast.success(t("app.review_panel.approve"));
  }, [supabase, t, toast, refreshPendingCount]);

  const handleReject = useCallback(async (id: string) => {
    await supabase.from("reviews").update({ status: "rejected" }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: "ignored" } : r));
    setSelectedReview(null);
    refreshPendingCount();
    toast.warning(t("app.review_panel.reject"));
  }, [supabase, t, toast, refreshPendingCount]);

  const handleEdit = useCallback(async (id: string, newText: string) => {
    const { error } = await supabase
      .from("responses")
      .update({ edited_text: newText, status: "edited" })
      .eq("review_id", id);
    if (error) {
      toast.error(t("app.reviews.generationError"));
      return;
    }
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, editedText: newText, responseStatus: "edited" } : r)
    );
    setSelectedReview((prev) =>
      prev?.id === id ? { ...prev, editedText: newText, responseStatus: "edited" } : prev
    );
    toast.success(t("app.settings.saved"));
  }, [supabase, t, toast]);

  const handleRetry = useCallback(async (id: string) => {
    toast.info(t("app.reviews.generating"));
    const res = await fetch("/api/responses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: id }),
    });
    if (res.ok) {
      const { responseText, modelUsed } = await res.json() as { responseText: string; modelUsed: string };
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, responseText, responseStatus: "generated", modelUsed } : r
        )
      );
      setSelectedReview((prev) =>
        prev?.id === id
          ? { ...prev, responseText, responseStatus: "generated", modelUsed }
          : prev
      );
      toast.success(t("app.reviews.responseReady"));
    } else {
      toast.error(t("app.reviews.generationError"));
    }
  }, [t, toast]);

  async function handleReviewSaved(reviewId: string, newReview: ReviewWithResponse) {
    setShowAddModal(false);

    // Optimistically add the new review with "generating" status
    setReviews((prev) => [newReview, ...prev]);
    refreshPendingCount();

    toast.info(t("app.reviews.generating"));

    const res = await fetch("/api/responses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });

    if (res.ok) {
      const { responseText, modelUsed } = await res.json() as {
        responseText: string;
        modelUsed: string;
      };
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, responseText, responseStatus: "generated", modelUsed }
            : r
        )
      );
      setSelectedReview((prev) =>
        prev?.id === reviewId
          ? { ...prev, responseText, responseStatus: "generated", modelUsed }
          : prev
      );
      toast.success(t("app.reviews.responseReady"));
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, responseStatus: "generation_failed" } : r
        )
      );
      setSelectedReview((prev) =>
        prev?.id === reviewId ? { ...prev, responseStatus: "generation_failed" } : prev
      );
      toast.error(t("app.reviews.generationError"));
    }
  }

  // ── Status tabs ────────────────────────────────────────────────────────────

  const statusTabs: { key: StatusFilter; labelKey: string }[] = [
    { key: "all", labelKey: "app.reviews.filter_all" },
    { key: "pending", labelKey: "app.reviews.filter_pending" },
    { key: "responded", labelKey: "app.reviews.filter_responded" },
    { key: "ignored", labelKey: "app.reviews.filter_rejected" },
  ];

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            {t("app.reviews.addReview")}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-paper border border-line rounded-2xl p-4 mb-4">
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

        {/* List */}
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {dataLoading || authLoading ? (
            <SkeletonList />
          ) : dataError ? (
            <div className="py-10 px-6 text-center">
              <p className="text-sm text-terra mb-3">{t("app.reviews.loadError")}</p>
              <button
                onClick={() => business?.id && loadReviews(business.id)}
                className="text-sm font-medium text-forest border border-forest/40 rounded-lg px-4 py-2 hover:bg-forest hover:text-paper transition-all"
              >
                {t("app.reviews.retryLoad")}
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-muted text-sm mb-4">{t("app.reviews.emptyState")}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-1.5 mx-auto"
              >
                <Plus size={15} />
                {t("app.reviews.addReview")}
              </button>
            </div>
          ) : filtered.length === 0 ? (
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
                  <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                    {review.authorInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">
                        {review.authorName}
                      </span>
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted">{review.relativeTime}</span>
                      <StatusBadge status={review.status} t={t} />
                      {review.responseStatus === "generation_failed" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-terra/10 text-terra">
                          {t("app.reviews.generationFailed")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft line-clamp-2 leading-snug">
                      {review.text}
                    </p>
                  </div>
                  {review.responseStatus === "generating" ? (
                    <button
                      disabled
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-line text-muted text-xs font-medium opacity-60 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Loader2 size={11} className="animate-spin" />
                      {t("app.reviews.generating_short")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-forest/40 text-forest text-xs font-medium hover:bg-forest hover:text-paper hover:border-forest transition-all"
                    >
                      {t("app.reviews.review_action")}
                    </button>
                  )}
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
        onEdit={handleEdit}
        onRetry={handleRetry}
      />

      {showAddModal && business?.id && (
        <AddReviewModal
          businessId={business.id}
          onClose={() => setShowAddModal(false)}
          onSaved={handleReviewSaved}
        />
      )}
    </>
  );
}
