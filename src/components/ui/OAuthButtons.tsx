"use client";

// ─────────────────────────────────────────────────────────────
// OAuth provider buttons (Apple + Google) — used on both the
// login and signup screens. Delegates to Supabase's OAuth flow,
// bouncing users through the /api/auth/callback route we already
// have wired up for the email confirmation flow.
//
// Requires the corresponding providers to be enabled in the
// Supabase dashboard (Authentication → Providers → Apple, Google).
// Without dashboard configuration the buttons still render but
// Supabase returns an "OAuth provider not enabled" error which we
// surface via the parent's error state.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface Props {
  next?: string | null;
  onError?: (msg: string) => void;
}

type Provider = "apple" | "google";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.365 1.43c0 1.14-.417 2.15-1.25 3.03-.99 1.05-2.19 1.63-3.5 1.53-.02-1.14.43-2.18 1.26-3.02.9-.92 2.16-1.5 3.49-1.54zm3.35 16.53c-.5 1.15-.73 1.66-1.37 2.68-.9 1.42-2.17 3.19-3.74 3.2-1.4.02-1.76-.91-3.66-.9-1.9.01-2.3.92-3.7.9-1.57-.01-2.77-1.6-3.67-3.02C.31 16.6-.68 11.28 1.35 7.55c1.44-2.65 3.72-4.2 5.85-4.2 2.16 0 3.52 1.19 5.31 1.19 1.73 0 2.78-1.19 5.28-1.19 1.89 0 3.89 1.03 5.3 2.82-4.66 2.55-3.9 9.2 2.63 12.02z" />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function OAuthButtons({ next, onError }: Props) {
  const { t } = useI18n();
  const supabase = createClient();
  const [busy, setBusy] = useState<Provider | null>(null);

  const start = async (provider: Provider) => {
    setBusy(provider);
    // Ask Supabase to redirect back to our callback route with the
    // sanitized `next` path so users land where they were headed.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      onError?.(t("auth.oauthError"));
      setBusy(null);
    }
    // Success case redirects the browser — no state cleanup needed.
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => start("apple")}
        disabled={busy !== null}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy === "apple" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <AppleLogo className="w-4 h-4" />
        )}
        <span className="text-sm">{t("auth.continueApple")}</span>
      </button>

      <button
        type="button"
        onClick={() => start("google")}
        disabled={busy !== null}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy === "google" ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        ) : (
          <GoogleLogo className="w-4 h-4" />
        )}
        <span className="text-sm">{t("auth.continueGoogle")}</span>
      </button>
    </div>
  );
}

// Small divider used between OAuth buttons and the email/password form.
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4" aria-hidden>
      <div className="h-px bg-gray-200 flex-1" />
      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
        {label}
      </span>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  );
}
