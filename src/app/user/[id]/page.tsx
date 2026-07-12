import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Pencil } from "lucide-react";
import GambleStats from "./GambleStats";
import { Achievements } from "@/components/ui/Achievements";
import { AvatarFrame } from "@/components/ui/AvatarFrame";
import { Flag } from "@/components/ui/Flag";
import { YouVsTournament } from "@/components/ui/YouVsTournament";
import { HostSeal } from "@/components/ui/HostSeal";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";
import { localizeTeam } from "@/lib/i18n-data";

export const dynamic = "force-dynamic";

export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const userId = params.id;
  const [supabase, i18n] = await Promise.all([createClient(), getServerT()]);
  const { t, lang, dir } = i18n;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Profile + prediction history are independent — batch them.
  const [profileRes, predsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("predictions")
      .select(
        `
        id,
        match_id,
        home_prediction,
        away_prediction,
        points_earned,
        scored,
        stake_multiplier,
        created_at,
        matches (
          id,
          home_team,
          away_team,
          home_team_logo,
          away_team_logo,
          home_score,
          away_score,
          start_time,
          status
        )
      `,
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const { data: profile, error: profileError } = profileRes;
  const predictions = predsRes.data;

  if (profileError || !profile) {
    notFound();
  }

  const finishedPredictions = (predictions || []).map((p: any) => ({
    match_id: p.match_id,
    points_earned: p.points_earned,
    scored: p.scored,
    stake_multiplier: p.stake_multiplier ?? 1,
    created_at: p.created_at,
  }));

  const isSelf = user.id === userId;
  const legacyLabel = t("profile.legacy").replace(
    "{n}",
    String(profile.legacy_points ?? 0),
  );

  return (
    <div
      className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden"
      dir={dir}
    >
      <div className="max-w-4xl mx-auto relative z-10 wc-border-gradient p-1 bg-white rounded-[2rem] shadow-sm">
        <div className="p-6 sm:p-12">
          <div className="flex items-center justify-between mb-12">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
              {t("profile.back")}
            </Link>
            <HostSeal size={56} />
          </div>

          <div className="text-center mb-12 flex flex-col items-center">
            <AvatarFrame
              src={profile.avatar_url}
              tier={(profile as { current_tier?: number }).current_tier ?? 1}
              size={96}
              alt={profile.display_name}
              className="mb-6"
            />
            <h1 className="font-fifa text-5xl sm:text-7xl uppercase text-gray-900 mb-4">
              {profile.display_name}
            </h1>
            {profile.favorite_team && (
              <div className="inline-flex items-center gap-2 mb-4 text-gray-600">
                <Flag
                  team={profile.favorite_team}
                  className="w-5 h-5 rounded-full object-cover shadow-sm"
                />
                <span className="text-sm font-bold">
                  {localizeTeam(profile.favorite_team, lang)}
                </span>
              </div>
            )}
            <div
              className="tri-underline mb-4"
              style={{ width: 180, background: HOST_TRI_GRADIENT }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-wc-cyan/20 bg-wc-cyan/10 text-wc-cyan font-bold text-xl">
                <Trophy className="w-5 h-5" />
                <span dir="ltr">{profile.total_points}</span> {t("profile.pts")}
              </div>
              {profile.legacy_points && profile.legacy_points > 0 ? (
                <p className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {legacyLabel}
                </p>
              ) : null}
              {isSelf && (
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-wc-purple px-3 py-1.5 rounded-full border border-gray-200 bg-white active:scale-95"
                >
                  <Pencil className="w-3 h-3" />
                  {t("profile.edit")}
                </Link>
              )}
            </div>
          </div>

          <GambleStats isSelf={isSelf} predictions={finishedPredictions} />

          {/* You vs the tournament — cloud-derived accuracy + goal
              comparison. Silently hides for other people's profiles. */}
          <YouVsTournament userId={userId} isSelf={isSelf} />

          <Achievements
            isSelf={isSelf}
            predictions={finishedPredictions}
          />

          <div className="space-y-4">
            <h2 className="font-fifa text-3xl text-gray-900 uppercase tracking-widest mb-6">
              {t("profile.history")}
            </h2>

            {!predictions || predictions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                {t("profile.history.empty")}
              </p>
            ) : (
              <div className="grid gap-4">
                {predictions.map((pred: any) => {
                  const match = pred.matches;
                  if (!match) return null;

                  const isFT =
                    match.status === "FT" ||
                    match.status === "AET" ||
                    match.status === "PEN";

                  return (
                    <div
                      key={pred.id}
                      className="bg-gray-50 border border-gray-200 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
                    >
                      <div className="w-full flex-1 flex flex-col sm:flex-row items-center justify-between font-fifa text-xl sm:text-2xl uppercase text-gray-900 gap-1 sm:gap-0">
                        <span className="w-full sm:flex-1 text-center sm:text-end truncate px-2">
                          {localizeTeam(match.home_team, lang)}
                        </span>
                        <div className="px-2 sm:px-6 flex flex-col items-center flex-shrink-0">
                          {isFT ? (
                            <>
                              <span
                                className="text-wc-cyan text-2xl sm:text-3xl"
                                dir="ltr"
                              >
                                {match.home_score} - {match.away_score}
                              </span>
                              <span className="text-gray-400 text-[10px] sm:text-sm tracking-widest mt-1">
                                {t("profile.actual")}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400 text-2xl sm:text-3xl">
                                -
                              </span>
                              <span className="text-gray-400 text-[10px] sm:text-sm tracking-widest mt-1">
                                {match.status === "NS"
                                  ? t("profile.upcoming")
                                  : t("profile.live")}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="w-full sm:flex-1 text-center sm:text-start truncate px-2">
                          {localizeTeam(match.away_team, lang)}
                        </span>
                      </div>

                      <div className="flex flex-col items-center md:items-end min-w-[150px] border-t md:border-t-0 md:border-s border-gray-200 pt-4 md:pt-0 md:ps-6">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                          {t("profile.theirpick")}
                        </div>
                        <div
                          className="font-fifa text-2xl mb-3 text-gray-900"
                          dir="ltr"
                        >
                          {pred.home_prediction} - {pred.away_prediction}
                        </div>

                        {!pred.scored ? (
                          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1 rounded-md text-sm font-bold">
                            {t("profile.pending")}
                          </div>
                        ) : pred.points_earned === 3 ? (
                          <div className="flex items-center gap-1.5 text-wc-green bg-wc-green/10 px-3 py-1 rounded-md text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" />{" "}
                            {t("profile.exact")}
                          </div>
                        ) : pred.points_earned === 1 ? (
                          <div className="flex items-center gap-1.5 text-wc-cyan bg-wc-cyan/10 px-3 py-1 rounded-md text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" />{" "}
                            {t("profile.outcome")}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-wc-red bg-wc-red/10 px-3 py-1 rounded-md text-sm font-bold">
                            <XCircle className="w-4 h-4" /> {t("profile.failed")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
