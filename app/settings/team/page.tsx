"use client";

import { useState } from "react";
import { UserPlus, Lock, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";

type Role = "owner" | "admin" | "editor" | "viewer";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastAccess: string;
  isCurrentUser?: boolean;
}

const MOCK_MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Marco Rossi",
    email: "demo@ansai.app",
    role: "owner",
    lastAccess: "Ahora",
    isCurrentUser: true,
  },
  {
    id: "m2",
    name: "Laura Gómez",
    email: "laura@latrattoriamarco.be",
    role: "admin",
    lastAccess: "Hace 2h",
  },
  {
    id: "m3",
    name: "Thomas Jacobs",
    email: "thomas@latrattoriamarco.be",
    role: "editor",
    lastAccess: "Hace 3 días",
  },
];

const ROLE_COLORS: Record<Role, string> = {
  owner:  "bg-forest/10 text-forest",
  admin:  "bg-gold/15 text-ink",
  editor: "bg-cream-dark text-ink",
  viewer: "bg-cream-dark text-muted",
};

const LABEL = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";
const INPUT =
  "w-full px-3 py-2 text-sm text-ink border border-line rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-forest/40";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>(() =>
    MOCK_MEMBERS.map((m) =>
      m.isCurrentUser ? { ...m, email: user?.email ?? m.email } : m
    )
  );
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");

  const canInvite = true; // TODO: check subscription plan via Stripe

  const handleRemove = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newMember: Member = {
      id: `m${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      lastAccess: "—",
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteRole("editor");
    setShowModal(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted">
            {members.length} {members.length === 1 ? "miembro" : "miembros"}
          </p>

          {canInvite ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              <UserPlus size={15} />
              {t("app.settings.invite_btn")}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-cream text-muted text-sm cursor-not-allowed">
              <Lock size={14} />
              <span>{t("app.settings.invite_btn")}</span>
            </div>
          )}
        </div>

        {/* Upgrade notice for starter */}
        {!canInvite && (
          <div className="bg-gold/8 border border-gold/25 rounded-2xl px-5 py-4 flex items-center gap-3">
            <Lock size={16} className="text-gold shrink-0" />
            <p className="text-sm text-ink flex-1">{t("app.settings.upgrade_lock")}</p>
            <a
              href="#pricing"
              className="text-xs font-semibold text-forest hover:text-forest-dark underline underline-offset-2 shrink-0"
            >
              {t("app.settings.upgrade_btn")}
            </a>
          </div>
        )}

        {/* Members table */}
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_100px_48px] gap-4 px-5 py-3 border-b border-line bg-cream/60">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {t("app.settings.col_member")}
            </span>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {t("app.settings.col_last_access")}
            </span>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {t("app.settings.col_role")}
            </span>
            <span />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-line">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 px-5 py-3.5 flex-wrap md:grid md:grid-cols-[1fr_1fr_100px_100px_48px]"
              >
                {/* Member info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-ink truncate">
                        {member.name}
                      </span>
                      {member.isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded font-medium">
                          {t("app.settings.you_badge")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted truncate block">{member.email}</span>
                  </div>
                </div>

                {/* Last access */}
                <span className="text-xs text-muted hidden md:block">{member.lastAccess}</span>

                {/* Role badge */}
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold",
                    ROLE_COLORS[member.role]
                  )}
                >
                  {t(`app.settings.role_${member.role}`)}
                </span>

                {/* Remove */}
                <div className="md:col-start-5">
                  {!member.isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.id)}
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
                  onClick={handleInvite}
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
