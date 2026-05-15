"use client";

import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

type Role = "owner" | "admin" | "editor" | "viewer";

interface DBMember {
  id: string;
  business_id: string;
  user_id: string;
  email: string;
  role: Role;
}

const ROLE_COLORS: Record<Role, string> = {
  owner:  "bg-forest/10 text-forest",
  admin:  "bg-gold/15 text-ink",
  editor: "bg-cream-dark text-ink",
  viewer: "bg-cream-dark text-muted",
};

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT = "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40";

function Avatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-semibold shrink-0">
      {initial}
    </div>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-line shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-40 bg-line rounded" />
        <div className="h-3 w-28 bg-line rounded" />
      </div>
      <div className="h-5 w-14 bg-line rounded-full" />
    </li>
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { user, business, loading } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<DBMember[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");

  useEffect(() => {
    if (loading) return;
    if (!business?.id) { setDbLoading(false); return; }

    const supabase = createClient();
    supabase
      .from("team_members")
      .select("*")
      .eq("business_id", business.id)
      .then(({ data }) => {
        if (data) setMembers(data as DBMember[]);
        setDbLoading(false);
      });
  }, [loading, business?.id]);

  const handleComingSoon = () => toast.info(t("app.settings.comingSoon"));

  return (
    <>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {!dbLoading && (
            <p className="text-sm text-muted">
              {members.length} {members.length === 1 ? "miembro" : "miembros"}
            </p>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
          >
            <UserPlus size={15} />
            {t("app.settings.invite_btn")}
          </button>
        </div>

        {/* Members table */}
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_140px_48px] gap-4 px-5 py-3 border-b border-line bg-cream/60">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {t("app.settings.col_member")}
            </span>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {t("app.settings.col_role")}
            </span>
            <span />
          </div>

          <ul className="divide-y divide-line">
            {(loading || dbLoading)
              ? Array.from({ length: 2 }).map((_, i) => <RowSkeleton key={i} />)
              : members.length === 0
              ? (
                <li className="px-5 py-8 text-center text-sm text-muted">
                  {t("app.settings.invite_btn")} para añadir miembros al equipo.
                </li>
              )
              : members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-5 py-3.5 flex-wrap md:grid md:grid-cols-[1fr_140px_48px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar email={member.email} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-ink truncate">
                          {member.email}
                        </span>
                        {member.user_id === user?.id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
                            {t("app.settings.you_badge")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      ROLE_COLORS[member.role]
                    )}
                  >
                    {t(`app.settings.role_${member.role}`)}
                  </span>

                  <div className="md:col-start-3">
                    {member.user_id !== user?.id && (
                      <button
                        onClick={handleComingSoon}
                        className="text-xs text-muted hover:text-terra transition-colors"
                        title={t("app.settings.remove_btn")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* ── Invite modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-ink/40 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-paper rounded-2xl border border-line shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif font-semibold text-ink text-base">
                  {t("app.settings.invite_title")}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-cream hover:text-ink transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL}>{t("app.settings.invite_email")}</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className={INPUT}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={LABEL}>{t("app.settings.invite_role")}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className={cn(INPUT, "cursor-pointer")}
                  >
                    <option value="admin">{t("app.settings.role_admin")}</option>
                    <option value="editor">{t("app.settings.role_editor")}</option>
                    <option value="viewer">{t("app.settings.role_viewer")}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-line text-muted text-sm font-medium hover:bg-cream transition-colors"
                >
                  {t("app.settings.invite_cancel")}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setInviteEmail("");
                    setInviteRole("editor");
                    handleComingSoon();
                  }}
                  disabled={!inviteEmail.trim()}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    inviteEmail.trim()
                      ? "bg-forest text-paper hover:bg-forest-dark"
                      : "bg-line text-muted cursor-not-allowed"
                  )}
                >
                  {t("app.settings.invite_send")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
