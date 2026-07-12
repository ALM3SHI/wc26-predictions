"use client";

// ─────────────────────────────────────────────────────────────
// Forgot password — sends a Supabase recovery email that lands on
// /reset-password with a session token. We deliberately show the
// "check your email" confirmation regardless of whether the email
// exists so we don't leak account presence.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft, Languages } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t, lang, setLang, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Intentionally ignore the error — same UX either way to avoid
    // account enumeration.
    setSent(true);
    setLoading(false);
  };

  const iconPos = dir === "rtl" ? "right-3" : "left-3";
  const inputPad = dir === "rtl" ? "pr-11 pl-4" : "pl-11 pr-4";

  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-white"
        dir={dir}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <Mail className="w-8 h-8 text-wc-green" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3 text-gray-900">
            {t("auth.forgot.sent.title")}
          </h2>
          <p className="text-gray-500 mb-6">{t("auth.forgot.sent.sub")}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-wc-purple hover:text-wc-purple-light transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
            {t("auth.forgot.back")}
          </Link>
        </motion.div>
      </div>
    );
  }

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
            {t("auth.forgot.title")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">{t("auth.forgot.sub")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              required
              autoComplete="username"
              dir="ltr"
              className={`w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
              style={{ textAlign: dir === "rtl" ? "right" : "left" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all gradient-purple-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t("auth.forgot.send")}
                <ArrowRight className="w-5 h-5 rtl-flip-auto" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-wc-purple transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl-flip-auto" />
            {t("auth.forgot.back")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
