"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { STAKES, type StakeId, getStakeById, stakePreview } from "@/lib/gamble";
import { StakeChip } from "./StakeChip";
import { useI18n } from "@/lib/i18n";

interface Props {
  value: StakeId;
  onChange: (id: StakeId) => void;
  disabled?: boolean;
}

const ICONS = {
  safe: ShieldCheck,
  bold: Zap,
  legend: Flame,
  allin: Sparkles,
} as const;

export function StakeSelector({ value, onChange, disabled }: Props) {
  const { t } = useI18n();
  const selected = getStakeById(value);
  const preview = stakePreview(selected.mult);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 leading-tight">
          {t("stake.picker.title")}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full whitespace-nowrap"
          style={{
            background: `${selected.color}18`,
            color: selected.color,
          }}
        >
          {t(`stake.${selected.id}`)} · {selected.mult}x
        </span>
      </div>

      {/* Chip row */}
      <div className="relative rounded-3xl p-3 md:p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #C8102E 0 2px, transparent 3px), radial-gradient(circle at 80% 60%, #002868 0 2px, transparent 3px), radial-gradient(circle at 40% 90%, #006847 0 2px, transparent 3px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative grid grid-cols-4 gap-1 md:gap-3">
          {STAKES.map((s) => {
            const Icon = ICONS[s.id];
            const isActive = value === s.id;
            return (
              <div
                key={s.id}
                className="flex flex-col items-center gap-2 min-w-0"
              >
                <StakeChip
                  stake={s}
                  active={isActive}
                  disabled={disabled}
                  size="sm"
                  onClick={() => !disabled && onChange(s.id)}
                />
                <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-600 min-w-0">
                  <Icon className="w-3 h-3 shrink-0" style={{ color: s.color }} />
                  <span className="truncate">{t(`stake.${s.id}`)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-4 grid grid-cols-3 gap-2"
        >
          <div className="rounded-xl p-2 md:p-3 border-2 border-emerald-100 bg-emerald-50 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
              {t("preview.exact")}
            </div>
            <div className="font-fifa text-xl md:text-2xl text-emerald-600">+{preview.exact}</div>
          </div>
          <div className="rounded-xl p-2 md:p-3 border-2 border-sky-100 bg-sky-50 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-sky-700 mb-1">
              {t("preview.outcome")}
            </div>
            <div className="font-fifa text-xl md:text-2xl text-sky-600">+{preview.outcome}</div>
          </div>
          <div
            className={`rounded-xl p-2 md:p-3 border-2 text-center ${
              preview.loss < 0
                ? "border-red-100 bg-red-50"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div
              className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                preview.loss < 0 ? "text-red-700" : "text-gray-500"
              }`}
            >
              {preview.loss < 0 ? t("preview.wrong") : t("preview.wrong0")}
            </div>
            <div
              className={`font-fifa text-xl md:text-2xl ${
                preview.loss < 0 ? "text-red-600" : "text-gray-400"
              }`}
            >
              {preview.loss === 0 ? "0" : preview.loss}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-gray-500 mt-3 italic">
        &ldquo;{t(`stake.${selected.id}.tagline`)}&rdquo;
      </p>
    </div>
  );
}
