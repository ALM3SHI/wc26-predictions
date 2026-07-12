"use client";

// ─────────────────────────────────────────────────────────────
// League detail — shareable invite code up top, then a member
// leaderboard sorted by total_points. Owner sees Delete; non-
// owners see Leave.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Trophy,
  Copy,
  Check,
  Share2,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeNumber, localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { leaveLeague, type League, type LeagueMemberRow } from "@/lib/leagues";

interface Props {
  userId: string;
  league: League;
  members: LeagueMemberRow[];
}

export default function LeagueDetail({ userId, league, members }: Props) {
  const { t, lang, dir } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isOwner = league.owner_id === userId;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(league.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const share = async () => {
    const text = `${league.name} · ${league.code} — WC26 Predictions`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: league.name,
          text,
          url:
            typeof window !== "undefined"
              ? `${window.location.origin}/leagues?code=${league.code}`
              : undefined,
        });
        return;
      } catch {
        // user dismissed — fall through to copy
      }
    }
    copy();
  };

  const doLeave = async () => {
    if (!window.confirm(t("leagues.leave.confirm"))) return;
    setLeaving(true);
    await leaveLeague(supabase, league.id);
    setLeaving(false);
    router.push("/leagues");
    router.refresh();
  };

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6" dir={dir}>
      <div className="max-w-3xl mx-auto">
        <Link
          href="/leagues"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("leagues.back")}
        </Link>

        {/* League header */}
        <div
          className="rounded-3xl p-5 text-white relative overflow-hidden mb-6"
          style={{ background: HOST_TRI_GRADIENT }}
        >
          <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl shrink-0">
              {league.emoji || "🏆"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-fifa text-2xl md:text-3xl uppercase leading-none truncate">
                {league.name}
              </div>
              <div className="text-xs opacity-90 mt-1 flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span dir="ltr">
                  {localizeNumber(league.member_count, lang)}
                </span>{" "}
                {t("leagues.members")}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 relative z-10">
            <div
              className="flex-1 rounded-xl bg-white/15 backdrop-blur px-3 py-2 font-fifa tracking-[0.35em] text-center text-lg"
              dir="ltr"
            >
              {league.code}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-bold px-3 py-2 rounded-xl active:scale-95"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white font-bold px-3 py-2 rounded-xl active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Standings */}
        <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-gray-700">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-sm">
              {t("leaderboard.title")}
            </span>
          </div>
          <ul>
            {members.map((m, i) => {
              const me = m.user_id === userId;
              return (
                <li
                  key={m.user_id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 ${
                    me ? "bg-purple-50/40" : ""
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-[10px] leading-6 text-center font-bold text-white shrink-0 ${
                      i === 0
                        ? "bg-amber-400"
                        : i === 1
                          ? "bg-gray-400"
                          : i === 2
                            ? "bg-orange-400"
                            : "bg-gray-300"
                    }`}
                    dir="ltr"
                  >
                    {i + 1}
                  </span>
                  <Link
                    href={`/user/${m.user_id}`}
                    className="flex items-center gap-2 flex-1 min-w-0 group"
                  >
                    <img
                      src={m.avatar_url || "/images/default-avatar.png"}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate group-hover:text-wc-purple">
                        {m.display_name}
                        {me && (
                          <span className="ms-2 inline-flex px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold uppercase">
                            {t("leagues.you")}
                          </span>
                        )}
                      </div>
                      {m.favorite_team && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                          <Flag
                            team={m.favorite_team}
                            className="w-3 h-3 rounded-full object-cover"
                          />
                          {localizeTeam(m.favorite_team, lang)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div
                    className="font-fifa text-lg text-gray-900 shrink-0"
                    dir="ltr"
                  >
                    {localizeNumber(m.total_points, lang)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Danger zone */}
        {!isOwner && (
          <div className="mt-6">
            <button
              type="button"
              onClick={doLeave}
              disabled={leaving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 text-red-600 font-bold py-3 hover:bg-red-100 active:scale-[0.98] disabled:opacity-60"
            >
              <LogOut className="w-4 h-4 rtl-flip-auto" />
              {t("leagues.leave")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
