import Link from "next/link";
import Image from "next/image";
import {
  User,
  Trophy,
  Settings,
  Shield,
  Info,
  LayoutGrid,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Ticker } from "@/components/ui/Ticker";
import { HostSeal } from "@/components/ui/HostSeal";
import { CountdownDigits } from "@/components/ui/CountdownDigits";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";
import { localizeTeam } from "@/lib/i18n-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [supabase, i18n] = await Promise.all([createClient(), getServerT()]);
  const { t, lang, dir } = i18n;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();
  const sixHoursAgoIso = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  // Fire every remaining query in parallel — profile, next kickoff, and the
  // ticker window don't depend on each other. Cuts ~3 sequential round trips
  // to 1 concurrent burst.
  const [profileRes, nextMatchRes, tickerRes] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("total_points, display_name, avatar_url, is_admin")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("matches")
      .select(
        "id,home_team,away_team,home_score,away_score,start_time,status,round,venue",
      )
      .gt("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(1),
    supabase
      .from("matches")
      .select("id,home_team,away_team,home_score,away_score,start_time,status")
      .gte("start_time", sixHoursAgoIso)
      .order("start_time", { ascending: true })
      .limit(20),
  ]);

  const userProfile = profileRes.data;
  let userRank = 0;
  if (user && userProfile) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("total_points", userProfile.total_points || 0);
    userRank = (count || 0) + 1;
  }

  const nextMatch = nextMatchRes.data?.[0] ?? null;
  const tickerMatches = tickerRes.data;

  const quickAccess = [
    {
      label: t("home.qa.matches"),
      icon: LayoutGrid,
      image: "/images/qa-matches.jpg",
      color: "bg-blue-500",
      href: "/bracket",
    },
    {
      label: t("home.qa.legends"),
      icon: Sparkles,
      image: "/images/qa-info.jpg",
      color: "bg-red-500",
      href: "/legends",
    },
    {
      label: t("home.qa.insights"),
      icon: TrendingUp,
      image: "/images/qa-leaderboard.jpg",
      color: "bg-blue-800",
      href: "/insights",
    },
    {
      label: t("home.qa.leaderboard"),
      icon: Trophy,
      image: "/images/qa-leaderboard.jpg",
      color: "bg-yellow-500",
      href: "/leaderboard",
    },
    {
      label: t("home.qa.profile"),
      icon: User,
      image: "/images/qa-profile.jpg",
      color: "bg-pink-500",
      href: user ? `/user/${user.id}` : "/login",
    },
    {
      label: t("home.qa.settings"),
      icon: Settings,
      image: "/images/qa-settings.jpg",
      color: "bg-gray-700",
      href: "/settings",
    },
    ...(userProfile?.is_admin
      ? [
          {
            label: t("home.qa.admin"),
            icon: Shield,
            image: "/images/qa-admin.jpg",
            color: "bg-red-500",
            href: "/admin",
          },
        ]
      : []),
    {
      label: t("home.qa.howtoplay"),
      icon: Info,
      image: "/images/qa-info.jpg",
      color: "bg-teal-400",
      href: "#",
    },
  ];

  const nextMatchup = nextMatch
    ? `${localizeTeam(nextMatch.home_team, lang)} ${lang === "ar" ? "×" : "vs"} ${localizeTeam(nextMatch.away_team, lang)}`
    : "";

  return (
    <div className="min-h-screen pb-6" dir={dir}>
      {/* Top Header — avatar (start) + WC26 seal (end), clutter-free */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur border-b border-gray-100">
        <Link
          href={user ? "/user/" + user.id : "/login"}
          className="relative w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 overflow-hidden transition-transform duration-150 active:scale-90"
          aria-label={t("home.qa.profile")}
        >
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : user ? (
            <Image
              src="/images/default-avatar.png"
              alt="Profile"
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </Link>
        <HostSeal size={44} />
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-6">
        {/* Ticker */}
        <Ticker matches={tickerMatches || []} emptyText={t("empty.matches")} />

        {/* Predictions Hero */}
        <Link
          href="/bracket"
          className="block relative w-full h-[280px] md:h-[380px] bg-gray-900 rounded-[2rem] overflow-hidden shadow-md hover:scale-[1.01] transition-transform"
        >
          <Image
            src="/images/home-banner.jpg"
            alt="Home Banner"
            fill
            priority
            className="object-cover opacity-70"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

          {/* Tri-color diagonal accent */}
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: HOST_TRI_GRADIENT }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{ background: HOST_TRI_GRADIENT }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/10 font-fifa text-[10rem] leading-none">
              WC26
            </span>
          </div>

          <div className="absolute bottom-6 inset-x-6 z-10 text-white flex justify-between items-end gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-fifa text-2xl sm:text-3xl md:text-5xl mb-2 drop-shadow-lg uppercase leading-none whitespace-nowrap truncate">
                {t("home.hero.title")}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                {t("home.hero.sub")}
              </p>
            </div>
            {nextMatch && (
              <div className="hidden md:block text-end shrink-0">
                <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1">
                  {t("home.next")}
                </div>
                <div className="rounded-lg bg-black/40 backdrop-blur px-3 py-2 border border-white/20">
                  <CountdownDigits
                    target={nextMatch.start_time}
                    accentColor="#22D3EE"
                    compact
                  />
                </div>
                <div
                  className="text-xs text-white/80 mt-1 font-bold uppercase tracking-widest truncate max-w-[220px]"
                  dir="auto"
                >
                  {nextMatchup}
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Mobile next-kickoff */}
        {nextMatch && (
          <div className="md:hidden rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {t("home.next")}
              </div>
              <div
                className="text-xs font-bold text-gray-800 mt-1 truncate"
                dir="auto"
              >
                {nextMatchup}
              </div>
            </div>
            <div className="shrink-0" dir="ltr">
              <CountdownDigits
                target={nextMatch.start_time}
                accentColor="#C8102E"
                compact
              />
            </div>
          </div>
        )}

        {/* User Dashboard Stats */}
        {user && userProfile && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: HOST_TRI_GRADIENT }}
              />
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t("home.points")}
              </span>
              <span className="font-fifa text-4xl text-gray-900" dir="ltr">
                {userProfile.total_points || 0}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: HOST_TRI_GRADIENT }}
              />
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t("home.rank")}
              </span>
              <span className="font-fifa text-4xl text-blue-600" dir="ltr">
                #{userRank}
              </span>
            </div>
          </div>
        )}

        {/* Legends CTA */}
        <Link
          href="/legends"
          className="block rounded-2xl p-5 relative overflow-hidden shadow-md text-white group"
          style={{
            background: "linear-gradient(135deg, #C8102E, #002868 60%, #006847)",
          }}
        >
          <div className="absolute -end-6 -top-6 opacity-30 host-seal">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/80 mb-1">
                <Flame className="w-3 h-3" /> {t("home.legends.flag")}
              </div>
              <h3 className="font-fifa text-2xl md:text-3xl uppercase leading-tight">
                {t("home.legends.title")}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {t("home.legends.sub")}
              </p>
            </div>
            <div
              className="font-fifa text-3xl md:text-4xl bg-white/15 backdrop-blur px-4 py-2 rounded-xl shrink-0"
              dir="ltr"
            >
              5x
            </div>
          </div>
        </Link>

        {/* Quick Access */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-4">
            {t("home.quick")}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col gap-2"
              >
                <div
                  className={`aspect-square rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm hover:scale-[1.03] transition-transform relative overflow-hidden group`}
                >
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity"
                    sizes="(max-width: 768px) 33vw, 250px"
                  />
                  <item.icon className="w-8 h-8 md:w-12 md:h-12 relative z-10 drop-shadow-md" />
                  <div className="absolute bottom-0 inset-x-0 h-2 host-gradient z-10" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Auth CTA if not logged in */}
        {!user && (
          <div className="mt-8 bg-white p-6 rounded-[2rem] text-center border border-gray-100 shadow-sm">
            <h2 className="font-bold text-xl mb-2 text-gray-900">
              {t("home.join.title")}
            </h2>
            <p className="text-gray-500 text-sm mb-4">{t("home.join.sub")}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-2 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200"
              >
                {t("home.login")}
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-wc-purple text-white font-bold rounded-xl hover:bg-wc-purple-light"
              >
                {t("home.signup")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
