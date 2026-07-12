"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

const SEEN_FLAG = "wc26.splash.seen";
const MIN_DURATION_MS = 1400;
const MAX_DURATION_MS = 2400;

export function SplashScreen() {
  const { t } = useI18n();
  // Start `null` on server + first client paint so hydration matches, then
  // decide once we can read sessionStorage.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem(SEEN_FLAG) === "1";
    } catch {
      // sessionStorage blocked (private mode) — show splash once per load
    }
    if (alreadySeen) {
      setVisible(false);
      return;
    }
    setVisible(true);

    const start = performance.now();
    let hidden = false;

    const finish = () => {
      if (hidden) return;
      hidden = true;
      setVisible(false);
      try {
        window.sessionStorage.setItem(SEEN_FLAG, "1");
      } catch {
        // ignore
      }
    };

    const scheduleFinish = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_DURATION_MS - elapsed);
      window.setTimeout(finish, remaining);
    };

    // Dismiss once critical resources are ready — or after MAX_DURATION as a floor.
    const maxTimer = window.setTimeout(finish, MAX_DURATION_MS);
    if (document.readyState === "complete") {
      scheduleFinish();
    } else {
      window.addEventListener("load", scheduleFinish, { once: true });
    }

    return () => {
      window.clearTimeout(maxTimer);
      window.removeEventListener("load", scheduleFinish);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible === true && (
        <motion.div
          key="wc26-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, #C8102E22, transparent 45%), radial-gradient(circle at 70% 60%, #00286822, transparent 50%), radial-gradient(circle at 40% 90%, #00684722, transparent 55%), #0A0A0F",
          }}
          aria-hidden
        >
          {/* Tri-color bars at edges */}
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: HOST_TRI_GRADIENT }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{ background: HOST_TRI_GRADIENT }}
          />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 16,
              delay: 0.1,
            }}
          >
            <HostSeal size={128} />
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-6 text-center px-8"
          >
            <div className="font-fifa text-5xl tracking-tight text-white leading-none">
              WC26
            </div>
            <div
              className="mx-auto mt-3 tri-underline"
              style={{ width: 140, background: HOST_TRI_GRADIENT }}
            />
            <div className="mt-4 text-[11px] uppercase tracking-[0.3em] text-white/70">
              {t("splash.tagline")}
            </div>
          </motion.div>

          {/* Loading dots */}
          <div className="absolute bottom-16 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-white/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
