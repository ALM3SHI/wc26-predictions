"use client";

// ─────────────────────────────────────────────────────────────
// Leagues home — three panels:
//   1. My leagues (linked cards)
//   2. Create a league (name + emoji)
//   3. Join by code (6-char input)
//
// Creation and join both mutate on click and refetch the list.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  LogIn,
  ArrowRight,
  Loader2,
  Trophy,
  Copy,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { localizeNumber } from "@/lib/i18n-data";
import { useToast } from "@/components/ui/Toast";
import {
  createLeague,
  joinLeague,
  type League,
} from "@/lib/leagues";

interface Props {
  userId: string;
  initialLeagues: League[];
}

export default function LeaguesClient({ userId, initialLeagues }: Props) {
  const { t, lang, dir } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [leagues] = useState<League[]>(initialLeagues);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || creating) return;
    setCreateError(null);
    setCreating(true);
    const res = await createLeague(
      supabase,
      name.trim(),
      emoji.trim() || undefined,
    );
    setCreating(false);
    if (res.id) {
      toast.success(t("toast.saved"));
      router.push(`/leagues/${res.id}`);
      return;
    }
    // Surface the exact error so a missing migration / RLS problem
    // stops being an invisible 404.
    const msg = res.error ?? t("toast.saveFail");
    setCreateError(msg);
    toast.error(msg);
  };

  const doJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4 || joining) return;
    setJoinError(null);
    setJoining(true);
    const res = await joinLeague(supabase, code.trim().toUpperCase());
    setJoining(false);
    if (res.id) {
      toast.success(t("toast.saved"));
      router.push(`/leagues/${res.id}`);
    } else {
      const msg = res.error ?? t("leagues.notfound");
      setJoinError(msg);
      toast.error(msg);
    }
  };

  const copyCode = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
      setCopiedCode(c);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6" dir={dir}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow"
              style={{ background: HOST_TRI_GRADIENT }}
            >
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
                {t("leagues.title")}
              </h1>
              <p className="text-gray-500 text-sm mt-2">{t("leagues.sub")}</p>
            </div>
          </div>
        </div>

        {/* My leagues */}
        <section className="mb-8">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {t("leagues.mine")}
          </h2>
          {leagues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              {t("leagues.none")}
            </div>
          ) : (
            <div className="grid gap-3">
              {leagues.map((lg) => (
                <div
                  key={lg.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                    {lg.emoji || "🏆"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {lg.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <span dir="ltr">
                        {localizeNumber(lg.member_count, lang)}
                      </span>{" "}
                      {t("leagues.members")}
                      {lg.owner_id === userId && (
                        <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[9px] font-bold uppercase">
                          {t("leagues.owner")}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCode(lg.code)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-1 active:scale-95"
                    dir="ltr"
                  >
                    {copiedCode === lg.code ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {lg.code}
                  </button>

                  <Link
                    href={`/leagues/${lg.id}`}
                    className="ms-2 inline-flex items-center gap-1 text-xs font-bold text-wc-purple hover:text-wc-purple-light active:scale-95"
                  >
                    <ArrowRight className="w-4 h-4 rtl-flip-auto" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Create */}
          <motion.form
            onSubmit={doCreate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-wc-purple" />
              {t("leagues.create")}
            </h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("leagues.name.ph")}
              maxLength={40}
              className="w-full mb-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
              style={{ textAlign: dir === "rtl" ? "right" : "left" }}
            />
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
              placeholder={t("leagues.emoji.ph")}
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
              style={{ textAlign: dir === "rtl" ? "right" : "left" }}
            />
            {createError && (
              <p className="text-wc-red text-xs mb-2 leading-snug">
                {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={creating || name.trim().length < 2}
              className="w-full inline-flex items-center justify-center gap-2 gradient-purple-cyan text-white font-bold py-2.5 rounded-xl active:scale-95 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("leagues.create.cta")}
            </button>
          </motion.form>

          {/* Join */}
          <motion.form
            onSubmit={doJoin}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-500" />
              {t("leagues.join")}
            </h3>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder={t("leagues.code.ph")}
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none font-fifa text-lg tracking-widest text-gray-900 text-center"
              dir="ltr"
            />
            {joinError && (
              <p className="text-wc-red text-xs mb-2 text-center">
                {joinError}
              </p>
            )}
            <button
              type="submit"
              disabled={joining || code.trim().length < 4}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl active:scale-95 disabled:opacity-60"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {t("leagues.join.cta")}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
