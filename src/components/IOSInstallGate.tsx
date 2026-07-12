"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Share, PlusSquare, Home, ArrowDown, AlertCircle } from "lucide-react";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

// ── Detection helpers ────────────────────────────────────────
// iPhone/iPad/iPod (skip Windows Phone false-positive via !MSStream)
function isIOSDevice(): boolean {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  // iPadOS reports as Macintosh but has touch — detect that too.
  const iPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
  const winMSStream = (window as unknown as { MSStream?: unknown }).MSStream;
  return (/iPhone|iPad|iPod/.test(ua) && !winMSStream) || iPadOS;
}

// True when the app is launched from the Home Screen (PWA / standalone).
function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  if (navStandalone === true) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

// iOS Safari (excludes Chrome/Firefox/Edge on iOS which can't Add to Home Screen).
function isRealSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
}

type Verdict = "unknown" | "allow" | "block-safari" | "block-nonsafari";

export function IOSInstallGate({ children }: { children: React.ReactNode }) {
  const { t, dir } = useI18n();
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

    // If the user installs and re-launches in the same session, the media
    // query flips — react to that so the block lifts without a refresh.
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => decide();
    try {
      mq.addEventListener("change", onChange);
    } catch {
      // older Safari
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

  // While we decide (SSR / first paint), render children so the app doesn't
  // flash-block for users on desktop or already-installed PWAs.
  if (verdict === "unknown" || verdict === "allow") {
    return <>{children}</>;
  }

  return (
    <>
      {/* Keep the app mounted underneath so state doesn't reset the moment
          the user installs — but block interaction with an overlay. */}
      <div aria-hidden className="pointer-events-none select-none opacity-0">
        {children}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("ios.title")}
        dir={dir}
        className="fixed inset-0 z-[10000] overflow-y-auto"
        style={{
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

        <div className="min-h-full flex flex-col items-center justify-start px-6 py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)] text-white">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
          >
            <HostSeal size={80} />
          </motion.div>

          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="font-fifa text-3xl sm:text-4xl uppercase text-center leading-tight mt-5"
          >
            {t("ios.title")}
          </motion.h1>

          <div
            className="mt-3 tri-underline"
            style={{ width: 140, background: HOST_TRI_GRADIENT }}
          />

          <p className="text-white/80 text-center text-sm max-w-md mt-4">
            {t("ios.sub")}
          </p>

          {verdict === "block-nonsafari" ? (
            <div className="mt-6 max-w-md w-full rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-100 leading-snug">
                {t("ios.notsafari")}
              </p>
            </div>
          ) : (
            <Steps />
          )}

          <div className="mt-8 text-[10px] uppercase tracking-[0.3em] text-white/50 text-center">
            {t("ios.hint")}
          </div>
        </div>
      </div>
    </>
  );
}

function Steps() {
  const { t } = useI18n();

  return (
    <div className="mt-8 w-full max-w-md space-y-4">
      <Step
        index={1}
        title={t("ios.step1")}
        sub={t("ios.step1sub")}
        icon={<Share className="w-6 h-6" />}
        accent="#22D3EE"
        highlight={
          <motion.div
            initial={{ y: -4, opacity: 0.6 }}
            animate={{ y: [-4, 4, -4], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-cyan-300"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        }
      />
      <Step
        index={2}
        title={t("ios.step2")}
        sub={t("ios.step2sub")}
        icon={<PlusSquare className="w-6 h-6" />}
        accent="#F59E0B"
      />
      <Step
        index={3}
        title={t("ios.step3")}
        sub={t("ios.step3sub")}
        icon={<Home className="w-6 h-6" />}
        accent="#10B981"
      />
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur px-4 py-3 flex items-center gap-3"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
          boxShadow: `0 8px 24px ${accent}55`,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white leading-tight">
          <span className="text-white/50 me-1">{index}.</span>
          {title}
        </div>
        <div className="text-[11px] text-white/60 mt-0.5">{sub}</div>
      </div>
      {highlight}
    </motion.div>
  );
}
