"use client";

// ─────────────────────────────────────────────────────────────
// Reset password — landing page for the Supabase recovery link.
// Supabase drops the user in with a temporary session; we just
// call updateUser({ password }) with a matching pair and send
// them home.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { t, lang, setLang, dir } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // The recovery email drops the user in with an active session,
    // but that session only exists on Supabase's side after cookie
    // hydration. Sit tight until getUser() confirms one is present.
    supabase.auth.getUser().then(({ data }) => {
      setSessionReady(!!data.user);
    });
  }, [supabase.auth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t("auth.error.password"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.reset.mismatch"));
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) {
      setError(updErr.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  };

  const iconPos = dir === "rtl" ? "right-3" : "left-3";
  const inputPad = dir === "rtl" ? "pr-11 pl-4" : "pl-11 pr-4";
  const eyePos = dir === "rtl" ? "left-3" : "right-3";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-white relative overflow-hidden"
      dir={dir}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-wc-green/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-wc-purple/5 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2" />

      <button
        type="button"
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        className="absolute top-4 end-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white/80 backdrop-blur hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm"
      >
        <Languages className="w-3.5 h-3.5" />
        {lang === "ar" ? "English" : "العربية"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-black tracking-tight text-gray-900">
            {t("auth.reset.title")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">{t("auth.reset.sub")}</p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 text-emerald-600 py-6">
            <CheckCircle2 className="w-10 h-10" />
            <p className="font-bold">{t("auth.reset.done")}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Lock className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password.new")}
                required
                minLength={6}
                autoComplete="new-password"
                dir="ltr"
                className={`w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
                style={{ textAlign: dir === "rtl" ? "right" : "left" }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
                className={`absolute ${eyePos} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1`}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("auth.reset.confirm")}
                required
                minLength={6}
                autoComplete="new-password"
                dir="ltr"
                className={`w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
                style={{ textAlign: dir === "rtl" ? "right" : "left" }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-wc-red text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all gradient-purple-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t("auth.reset.submit")}
                  <ArrowRight className="w-5 h-5 rtl-flip-auto" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
