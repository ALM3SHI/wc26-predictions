"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Languages,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OAuthButtons, OrDivider } from "@/components/ui/OAuthButtons";

export default function SignupPage() {
  const { t, lang, setLang, dir } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (displayName.trim().length < 2) {
      setError(t("auth.error.displayName"));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("auth.error.password"));
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      // Auto signed in (email confirmation is off in Supabase)
      router.push("/");
      router.refresh();
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const iconPos = dir === "rtl" ? "right-3" : "left-3";
  const inputPad = dir === "rtl" ? "pr-11 pl-4" : "pl-11 pr-4";
  const eyePos = dir === "rtl" ? "left-3" : "right-3";

  if (success) {
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
            {t("auth.check.title")}
          </h2>
          <p className="text-gray-500">
            {t("auth.check.sub")}{" "}
            <span className="text-wc-purple font-semibold" dir="ltr">
              {email}
            </span>
            {t("auth.check.suffix")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-white relative overflow-hidden"
      dir={dir}
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-wc-purple/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-wc-cyan/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />

      {/* Language toggle */}
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
              {t("auth.signup.title")}
            </span>
          </h1>
          <p className="text-gray-500 mt-2">{t("auth.signup.sub")}</p>
        </div>

        {/* Social sign-up — most new users land here through this path. */}
        <OAuthButtons onError={(msg) => setError(msg)} />

        <OrDivider label={t("auth.or")} />

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Display Name */}
          <div className="relative">
            <User className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("auth.displayName")}
              required
              minLength={2}
              maxLength={30}
              className={`w-full ${inputPad} py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-gray-400 transition-colors text-gray-900`}
              style={{ textAlign: dir === "rtl" ? "right" : "left" }}
            />
          </div>

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
              placeholder={t("auth.password.new")}
              required
              minLength={6}
              autoComplete="new-password"
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
                {t("auth.createAccount")}
                <ArrowRight className="w-5 h-5 rtl-flip-auto" />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-wc-purple hover:text-wc-purple-light transition-colors font-medium"
          >
            {t("auth.signInCta")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
