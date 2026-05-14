"use client";

import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastItem, ToastType } from "@/lib/hooks/useToast";

type IconComponent = typeof CheckCircle;

const VARIANTS: Record<
  ToastType,
  { container: string; icon: IconComponent; iconClass: string }
> = {
  success: {
    container: "bg-forest-light border-forest text-white",
    icon: CheckCircle,
    iconClass: "text-white",
  },
  error: {
    container: "bg-terra-light border-terra text-white",
    icon: XCircle,
    iconClass: "text-white",
  },
  warning: {
    container: "bg-gold/10 border-gold text-ink",
    icon: AlertTriangle,
    iconClass: "text-gold",
  },
  info: {
    container: "bg-paper border-line text-ink",
    icon: Info,
    iconClass: "text-muted",
  },
};

const PROGRESS_CLASS: Record<ToastType, string> = {
  success: "bg-white/30",
  error: "bg-white/30",
  warning: "bg-gold/40",
  info: "bg-line",
};

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const variant = VARIANTS[toast.type];
  const Icon = variant.icon;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 w-full rounded-xl border px-4 py-3 shadow-lg overflow-hidden",
        toast.exiting ? "animate-toast-exit" : "animate-toast-enter",
        variant.container
      )}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", variant.iconClass)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
        {toast.subtitle && (
          <p className="text-xs mt-0.5 opacity-75">{toast.subtitle}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Cerrar"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity -mr-1 -mt-0.5 cursor-pointer"
      >
        <X size={16} />
      </button>

      <span
        className={cn(
          "absolute bottom-0 left-0 h-[2px] animate-toast-progress",
          PROGRESS_CLASS[toast.type]
        )}
      />
    </div>
  );
}
