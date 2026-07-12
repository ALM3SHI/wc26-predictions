"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Languages,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OAuthButtons, OrDivider } from "@/components/ui/OAuthButtons";

function LoginContent() {
  const { t, lang, setLang, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const callbackError = searchParams.get("error");
  const next = searchParams.get("next");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Only follow `next` if it looks like an internal path — never trust an
    // arbitrary URL from the querystring.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/";
    router.push(safeNext);
    router.refresh();
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

      {/* Language toggle — top corner */}
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black tracking-tight">
            <span className="text-gradient gradient-purple-cyan bg-clip-text text-transparent">
              WC26
            </span>
          </h1>
          <p className="text-gray-500 mt-2">{t("auth.login.sub")}</p>
        </div>

        {/* Callback error */}
        {callbackError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-500 text-sm">{t("auth.callbackError")}</p>
          </motion.div>
        )}

        {/* Social sign-in — big-friction reducer, primary path for most
            new signups going forward. */}
        <OAuthButtons next={next} onError={(msg) => setError(msg)} />

        <OrDivider label={t("auth.or")} />

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              required
              autoComplete="username"
              className={`ltr-input w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              required
              autoComplete="current-password"
              className={`ltr-input w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className={`absolute ${eyePos} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center`}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-wc-red text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all gradient-purple-cyan hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t("auth.signIn")}
                <ArrowRight className="w-5 h-5 rtl-flip-auto" />
              </>
            )}
          </button>
        </form>

        {/* Forgot password */}
        <p className="text-center mt-4 text-sm">
          <Link
            href="/forgot-password"
            className="text-gray-500 hover:text-wc-purple transition-colors font-medium"
          >
            {t("auth.forgot")}
          </Link>
        </p>

        {/* Signup Link */}
        <p className="text-center text-gray-500 mt-4 text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href="/signup"
            className="text-wc-purple hover:text-wc-purple-light transition-colors font-medium"
          >
            {t("auth.signUpCta")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-wc-purple" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
