"use client";

import { Toast } from "./Toast";
import type { ToastItem } from "@/lib/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      className="fixed top-4 z-[9999] flex flex-col gap-2 pointer-events-none left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
