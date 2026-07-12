"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Share, PlusSquare, Home, ArrowDown, AlertCircle, Languages } from "lucide-react";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

// ── Detection helpers ────────────────────────────────────────
function isIOSDevice(): boolean {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const iPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
  const winMSStream = (window as unknown as { MSStream?: unknown }).MSStream;
  return (/iPhone|iPad|iPod/.test(ua) && !winMSStream) || iPadOS;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  if (navStandalone === true) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

function isRealSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
}

type Verdict = "unknown" | "allow" | "block-safari" | "block-nonsafari";

export function IOSInstallGate({ children }: { children: React.ReactNode }) {
  const { t, dir, lang, setLang } = useI18n();
  const [verdict, setVerdict] = useState<Verdict>("unknown");

  useEffect(() => {
    const decide = () => {
      if (!isIOSDevice()) {
        setVerdict("allow");
        return;
      }
      if (isStandaloneMode()) {
        setVerdict("allow");
        return;
      }
      setVerdict(isRealSafari() ? "block-safari" : "block-nonsafari");
    };

    decide();

    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => decide();
    try {
      mq.addEventListener("change", onChange);
    } catch {
      mq.addListener(onChange);
    }
    return () => {
      try {
        mq.removeEventListener("change", onChange);
      } catch {
        mq.removeListener(onChange);
      }
    };
  }, []);

  // Render the app when we haven't decided yet (SSR + first paint) or when
  // the user isn't gated. Otherwise render ONLY the gate — no children —
  // so Safari's password manager has no login form to react to.
  if (verdict === "unknown" || verdict === "allow") {
    return <>{children}</>;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("ios.title")}
      dir={dir}
      className="fixed inset-0 z-[10000] overflow-hidden flex flex-col items-center justify-between text-white"
      style={{
        // 100dvh accounts for Safari's disappearing browser chrome so the
        // content always fills exactly one viewport with no scroll.
        height: "100dvh",
        maxHeight: "100dvh",
        paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        background:
          "radial-gradient(circle at 30% 20%, #C8102E22, transparent 45%), radial-gradient(circle at 70% 60%, #00286822, transparent 50%), radial-gradient(circle at 40% 90%, #00684722, transparent 55%), #0A0A0F",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      {/* Top bar — language toggle */}
      <div className="w-full max-w-md flex items-center justify-end z-10">
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
          aria-label={t("ios.toggle")}
        >
          <Languages className="w-3.5 h-3.5" />
          {t("ios.toggle")}
        </button>
      </div>

      {/* Middle — brand + copy + steps (single scroll-free column) */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md flex-1 min-h-0 justify-center gap-3">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
        >
          <HostSeal size={56} />
        </motion.div>

        <motion.h1
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="font-fifa text-2xl sm:text-3xl uppercase text-center leading-[1.1] px-2"
        >
          {t("ios.title")}
        </motion.h1>

        <div
          className="tri-underline"
          style={{ width: 112, height: 2, background: HOST_TRI_GRADIENT }}
        />

        <p className="text-white/75 text-center text-[13px] leading-snug max-w-sm px-2">
          {t("ios.sub")}
        </p>

        {verdict === "block-nonsafari" ? (
          <div className="mt-1 w-full rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-100 leading-snug">
              {t("ios.notsafari")}
            </p>
          </div>
        ) : (
          <div className="mt-1 w-full space-y-2">
            <Step
              index={1}
              title={t("ios.step1")}
              sub={t("ios.step1sub")}
              icon={<Share className="w-5 h-5" />}
              accent="#22D3EE"
              highlight={
                <motion.div
                  initial={{ y: -3, opacity: 0.6 }}
                  animate={{ y: [-3, 3, -3], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-cyan-300"
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.div>
              }
            />
            <Step
              index={2}
              title={t("ios.step2")}
              sub={t("ios.step2sub")}
              icon={<PlusSquare className="w-5 h-5" />}
              accent="#F59E0B"
            />
            <Step
              index={3}
              title={t("ios.step3")}
              sub={t("ios.step3sub")}
              icon={<Home className="w-5 h-5" />}
              accent="#10B981"
            />
          </div>
        )}
      </div>

      {/* Footer hint — gentle pulse so users don't miss it. */}
      <motion.div
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 text-[12px] uppercase tracking-[0.18em] text-white/70 text-center px-4"
      >
        {t("ios.hint")}
      </motion.div>
    </div>
  );
}

function Step({
  index,
  title,
  sub,
  icon,
  accent,
  highlight,
}: {
  index: number;
  title: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  highlight?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className="rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur px-3 py-2.5 flex items-center gap-2.5"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
          boxShadow: `0 6px 18px ${accent}55`,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-white leading-tight">
          <span className="text-white/50 me-1">{index}.</span>
          {title}
        </div>
        <div className="text-[10.5px] text-white/60 mt-0.5 leading-snug">
          {sub}
        </div>
      </div>
      {highlight}
    </motion.div>
  );
}
