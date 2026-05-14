"use client";

import { useState, useCallback, useRef } from "react";
import { ToastContext, type ToastItem, type ToastType } from "@/lib/hooks/useToast";
import { ToastContainer } from "./ToastContainer";

const TOAST_DURATION = 4000;
const EXIT_DURATION = 300;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, subtitle?: string) => {
      const id = String(Date.now());
      setToasts((prev) => [
        ...prev,
        { id, type, message, subtitle, createdAt: Date.now() },
      ]);

      const timer = setTimeout(() => {
        timers.current.delete(id);
        removeToast(id);
      }, TOAST_DURATION);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
      removeToast(id);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast: handleRemove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={handleRemove} />
    </ToastContext.Provider>
  );
}
