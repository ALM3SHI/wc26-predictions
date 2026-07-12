"use client";

// ─────────────────────────────────────────────────────────────
// Push opt-in banner
//
// Shows a soft bottom banner one time per user, urging them to
// enable push notifications. Dismissal is remembered in
// localStorage so it never nags the same person twice. Only
// renders when the browser both supports push AND the user
// hasn't already granted / denied permission.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { isPushSupported, subscribeToPush } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "wc26.push.optin";

export function PushOptInBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPushSupported()) return;

    // Already granted or already denied? Never nag again.
    const perm = Notification.permission;
    if (perm === "granted" || perm === "denied") return;

    // Already dismissed within the same install? Skip.
    const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const ts = Number(dismissedAt);
      const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      // Ask again after 7 days if user tapped "later".
      if (Number.isFinite(ts) && days < 7) return;
    }

    // Give the app a beat to settle before we pop the banner.
    const to = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(to);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore quota / private-mode errors
    }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        }).catch(() => {});
        setVisible(false);
        try {
          window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          // ignore
        }
      } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setDenied(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-x-3 z-40 bottom-[calc(env(safe-area-inset-bottom)+80px)] md:bottom-6 md:left-auto md:right-6 md:inset-x-auto md:max-w-sm"
        >
          <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-wc-purple/10 text-wc-purple flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-sm">
                {t("push.optin.title")}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                {denied ? t("push.optin.denied") : t("push.optin.sub")}
              </div>
              {!denied && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={enable}
                    disabled={busy}
                    className="flex-1 gradient-purple-cyan text-white text-xs font-bold py-2 rounded-xl disabled:opacity-60"
                  >
                    {t("push.optin.enable")}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    disabled={busy}
                    className="text-xs font-semibold text-gray-500 px-3 py-2"
                  >
                    {t("push.optin.later")}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="close"
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
