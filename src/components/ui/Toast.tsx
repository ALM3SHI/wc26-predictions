"use client";

// ─────────────────────────────────────────────────────────────
// Toast — tiny top-mounted feedback pill with a context provider
// so any component can call `toast.success(...)` / `toast.error(...)`
// without threading callbacks through props.
//
// Auto-dismiss after 2.5s, tap-to-dismiss anywhere on the pill.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

interface ToastState {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastAPI {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastState[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    seq += 1;
    const id = seq;
    setItems((prev) => [...prev.slice(-2), { id, kind, text }]);
    // Auto-dismiss
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const api = useMemo<ToastAPI>(
    () => ({
      success: (text) => push("success", text),
      error: (text) => push("error", text),
      info: (text) => push("info", text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed inset-x-0 top-4 z-[120] pointer-events-none flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="pointer-events-auto max-w-sm w-full rounded-2xl px-4 py-3 shadow-2xl border backdrop-blur flex items-center gap-3 cursor-pointer"
              style={{
                background:
                  t.kind === "success"
                    ? "rgba(16, 185, 129, 0.95)"
                    : t.kind === "error"
                      ? "rgba(239, 68, 68, 0.95)"
                      : "rgba(17, 24, 39, 0.92)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "white",
              }}
              role="status"
              aria-live="polite"
            >
              {t.kind === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : t.kind === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : null}
              <span className="text-sm font-bold flex-1 leading-snug">
                {t.text}
              </span>
              <X className="w-4 h-4 opacity-70 shrink-0" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const c = useContext(ToastContext);
  return (
    c ?? {
      success: () => {},
      error: () => {},
      info: () => {},
    }
  );
}

// Skeleton pulse — reusable for loading placeholders.
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return (
    <div
      className={`rounded-xl ${className} ${ready ? "animate-pulse" : ""}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))",
        ...style,
      }}
    />
  );
}
