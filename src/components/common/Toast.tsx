import { useState, useEffect, useCallback } from "react";

interface ToastMessage {
  id: number;
  message: string;
  type: "error" | "success" | "warning" | "info";
}

let toastId = 0;

export function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = ++toastId;
      setToasts((prev) => [
        ...prev,
        { id, message: detail.message, type: detail.type || "error" },
      ]);
      setTimeout(() => removeToast(id), 4000);
    };

    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  const bgColor = {
    error: "bg-red-500",
    warning: "bg-yellow-500",
    success: "bg-green-500",
    info: "bg-blue-500",
  };

  const icon = {
    error: "🚫",
    warning: "⚠️",
    success: "✓",
    info: "ℹ️",
  };

  return (
    <div className="fixed top-4 right-4 z-9999 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgColor[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-75 animate-slide-in`}
        >
          <span>{icon[toast.type]}</span>
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(
  message: string,
  type: "error" | "success" | "warning" | "info" = "error",
) {
  window.dispatchEvent(
    new CustomEvent("app:toast", { detail: { message, type } }),
  );
}
