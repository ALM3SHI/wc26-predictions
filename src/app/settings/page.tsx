"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Loader2,
  Volume2,
  VolumeX,
  Languages,
  Mail,
  RotateCcw,
  Info,
  LogOut,
  Gauge,
  ChevronRight,
} from "lucide-react";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { sfx } from "@/components/ui/SoundFX";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { motion } from "framer-motion";

interface RowProps {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function Row({ icon, title, desc, action, onClick, danger }: RowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 border-t border-gray-100 first:border-t-0 ${
        onClick ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
    >
      <div
        className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
          danger ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-700"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`font-bold ${
            danger ? "text-red-600" : "text-gray-900"
          } truncate`}
        >
          {title}
        </div>
        {desc && (
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">
            {desc}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!on);
      }}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-gray-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const supabase = createClient();

  // Push
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);

  // Email + prefs
  const [emailOn, setEmailOn] = useState(true);
  const [emailLoading, setEmailLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Local prefs
  const [soundOn, setSoundOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resetTs, setResetTs] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSoundOn(window.localStorage.getItem("wc26.sound") !== "false");
    setReducedMotion(window.localStorage.getItem("wc26.motion") === "reduced");

    (async () => {
      if (isPushSupported()) {
        setPushSupported(true);
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          setPushOn(!!sub);
        } catch {
          setPushOn(false);
        }
      }
      setPushLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("email_notifications")
          .eq("id", user.id)
          .single();
        if (data) setEmailOn(data.email_notifications !== false);
      }
      setEmailLoading(false);
    })();
  }, [supabase]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("motion-reduced", reducedMotion);
  }, [reducedMotion]);

  const toggleSound = (v: boolean) => {
    setSoundOn(v);
    try {
      window.localStorage.setItem("wc26.sound", v ? "true" : "false");
    } catch {
      // ignore
    }
    if (v) sfx.chip();
  };

  const toggleMotion = (v: boolean) => {
    setReducedMotion(v);
    try {
      window.localStorage.setItem("wc26.motion", v ? "reduced" : "full");
    } catch {
      // ignore
    }
  };

  const togglePush = async () => {
    if (!pushSupported) return;
    setPushLoading(true);
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        await fetch("/api/push/subscribe", { method: "DELETE" }).catch(
          () => {},
        );
        setPushOn(false);
      } else {
        const sub = await subscribeToPush();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub),
          }).catch(() => {});
          setPushOn(true);
          sfx.chip();
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  const toggleEmail = async (v: boolean) => {
    if (!userId) return;
    setEmailOn(v);
    await supabase
      .from("profiles")
      .update({ email_notifications: v })
      .eq("id", userId);
    if (v) sfx.chip();
  };

  const resetLedger = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm(t("settings.reset.confirm"))) return;
    try {
      window.localStorage.removeItem("wc26.stakes");
    } catch {
      // ignore
    }
    setResetTs(Date.now());
    sfx.chip();
  };

  const setLangAndSound = (l: Lang) => {
    setLang(l);
    sfx.chip();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-6 px-4 sm:px-6 relative">
      <div
        className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] bg-wc-purple/10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <HostSeal size={56} />
          <div>
            <h1 className="font-fifa text-4xl uppercase text-gray-900 leading-none">
              {t("settings.title")}
            </h1>
            <div
              className="tri-underline w-24 mt-2"
              style={{ background: HOST_TRI_GRADIENT }}
            />
          </div>
        </div>

        {/* Language card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <Languages className="w-5 h-5 text-gray-700" />
            <h2 className="font-bold text-gray-900">
              {t("settings.language")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {(["en", "ar"] as Lang[]).map((l) => {
              const active = lang === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLangAndSound(l)}
                  className={`relative rounded-xl p-3 border-2 text-center transition-all ${
                    active
                      ? "border-wc-purple bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {l === "en" ? "🇺🇸" : "🇸🇦"}
                  </div>
                  <div className="font-bold text-sm">
                    {l === "en" ? "English" : "العربية"}
                  </div>
                  {active && (
                    <div className="absolute top-1 end-1 w-2 h-2 rounded-full bg-wc-purple" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <Row
            icon={pushOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            title={t("settings.push")}
            desc={
              pushSupported
                ? t("settings.push.desc")
                : "Not supported on this device."
            }
            action={
              pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Toggle
                  on={pushOn}
                  onChange={togglePush}
                  disabled={!pushSupported}
                />
              )
            }
          />
          <Row
            icon={<Mail className="w-5 h-5" />}
            title={t("settings.email")}
            desc={t("settings.email.desc")}
            action={
              emailLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Toggle
                  on={emailOn}
                  onChange={toggleEmail}
                  disabled={!userId}
                />
              )
            }
          />
        </motion.section>

        {/* Experience */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <Row
            icon={soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            title={t("settings.sound")}
            desc={t("settings.sound.desc")}
            action={<Toggle on={soundOn} onChange={toggleSound} />}
          />
          <Row
            icon={<Gauge className="w-5 h-5" />}
            title={t("settings.motion")}
            desc={t("settings.motion.desc")}
            action={<Toggle on={reducedMotion} onChange={toggleMotion} />}
          />
        </motion.section>

        {/* Danger + account */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <Row
            icon={<RotateCcw className="w-5 h-5" />}
            title={t("settings.reset")}
            desc={
              resetTs > 0
                ? t("settings.reset.done")
                : t("settings.reset.desc")
            }
            onClick={resetLedger}
            action={<ChevronRight className="w-4 h-4 text-gray-400 rtl-flip-auto" />}
          />
          <Row
            icon={<LogOut className="w-5 h-5" />}
            title={t("settings.signout")}
            onClick={signOut}
            danger
            action={<ChevronRight className="w-4 h-4 text-red-400 rtl-flip-auto" />}
          />
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <Row
            icon={<Info className="w-5 h-5" />}
            title={t("settings.about")}
            desc={`${t("settings.version")} 1.1.0 · WC26 Predictions`}
          />
        </motion.section>

        <div className="text-center text-[10px] uppercase tracking-widest text-gray-400 mt-8">
          Built for USA · Canada · Mexico
        </div>
      </div>
    </div>
  );
}
