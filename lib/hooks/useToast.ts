"use client";

import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  subtitle?: string;
  createdAt: number;
  exiting?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, subtitle?: string) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");

  return {
    toast: {
      success: (message: string, subtitle?: string) =>
        ctx.addToast("success", message, subtitle),
      error: (message: string, subtitle?: string) =>
        ctx.addToast("error", message, subtitle),
      warning: (message: string, subtitle?: string) =>
        ctx.addToast("warning", message, subtitle),
      info: (message: string, subtitle?: string) =>
        ctx.addToast("info", message, subtitle),
    },
    removeToast: ctx.removeToast,
  };
}
