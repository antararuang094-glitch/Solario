"use client";

import * as React from "react";

type ToastVariant = "default" | "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: React.ReactNode;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: React.ReactNode, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    (message: React.ReactNode, variant: ToastVariant = "default") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-xl px-4 py-3 shadow-lg border text-sm animate-slide-in " +
              (t.variant === "success"
                ? "bg-[#16a34a] text-white border-[#16a34a]"
                : t.variant === "error"
                ? "bg-red-600 text-white border-red-600"
                : t.variant === "info"
                ? "bg-[#0d3b2e] text-white border-[#0d3b2e]"
                : "bg-white text-ink border-[#e5e7eb]")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return { toast: (message: React.ReactNode) => console.log("[toast]", message) };
  }
  return ctx;
}
