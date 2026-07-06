"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const callbackError = searchParams.get("error");

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

    router.push("/");
    router.refresh();
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-wc-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-wc-green/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-wc-purple/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 max-w-md w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black tracking-tight">
            <span className="text-gradient gradient-purple-cyan bg-clip-text text-transparent">
              WC26
            </span>
          </h1>
          <p className="text-white/50 mt-2">Sign in to your account</p>
        </div>

        {/* Callback error */}
        {callbackError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-wc-red/10 border border-wc-red/20 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-wc-red shrink-0" />
            <p className="text-wc-red text-sm">
              Authentication failed. Please try again.
            </p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="username"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-wc-surface/50 border border-white/10 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-white/30 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-wc-surface/50 border border-white/10 focus:border-wc-purple focus:outline-none focus:ring-1 focus:ring-wc-purple/50 placeholder:text-white/30 transition-colors"
            />
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
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-white/40 mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-wc-purple-light hover:text-wc-purple transition-colors font-medium"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-wc-black">
        <Loader2 className="w-8 h-8 animate-spin text-wc-purple" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
