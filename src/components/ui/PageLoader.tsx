"use client";

import { motion } from "framer-motion";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

interface Props {
  compact?: boolean;
}

/**
 * Branded, screen-filling loader for route transitions and data fetches.
 * Shows the WC26 seal, tri-color underline, and pulsing dots.
 * `compact` renders a smaller inline variant suitable for card-level loads.
 */
export function PageLoader({ compact = false }: Props) {
  const { t } = useI18n();

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
          {t("loading.title")}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
      >
        <HostSeal size={72} />
      </motion.div>
      <div
        className="mt-5 tri-underline"
        style={{ width: 96, background: HOST_TRI_GRADIENT }}
      />
      <div className="mt-4 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-gray-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.28em] text-gray-500 font-bold">
        {t("loading.title")}
      </div>
    </div>
  );
}
