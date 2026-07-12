"use client";

// ─────────────────────────────────────────────────────────────
// Profile editor
//
// Lets the user rename themselves, change their favorite team,
// and pick from a small set of preset avatars. Upload-your-own
// requires a Supabase Storage bucket and is out of scope here
// — the presets keep the flow snappy and moderation-free.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Check,
  Search,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AvatarFrame } from "@/components/ui/AvatarFrame";
import { Flag } from "@/components/ui/Flag";
import { WC26_TEAMS } from "@/lib/wc26-teams";
import { localizeTeam } from "@/lib/i18n-data";

interface Props {
  userId: string;
  initialName: string;
  initialAvatar: string | null;
  initialTeam: string | null;
  tier: number;
}

const PRESET_AVATARS = [
  "/images/avatars/preset-1.svg",
  "/images/avatars/preset-2.svg",
  "/images/avatars/preset-3.svg",
  "/images/avatars/preset-4.svg",
  "/images/avatars/preset-5.svg",
  "/images/avatars/preset-6.svg",
  "/images/default-avatar.png",
];

export default function ProfileEditor({
  userId,
  initialName,
  initialAvatar,
  initialTeam,
  tier,
}: Props) {
  const { t, lang, dir } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [team, setTeam] = useState<string | null>(initialTeam);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WC26_TEAMS;
    return WC26_TEAMS.filter((tm) => {
      const en = tm.name.toLowerCase();
      const ar = localizeTeam(tm.name, "ar").toLowerCase();
      return en.includes(q) || ar.includes(q);
    });
  }, [query]);

  const save = async () => {
    setErr(null);
    if (name.trim().length < 2 || name.trim().length > 30) {
      setErr(t("pe.err.name"));
      return;
    }
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        display_name: name.trim(),
        avatar_url: avatar,
        favorite_team: team,
      })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
    router.refresh();
  };

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6" dir={dir}>
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/user/${userId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("profile.back")}
        </Link>

        <div className="mb-6">
          <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
            {t("pe.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{t("pe.sub")}</p>
        </div>

        {/* Live preview */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 flex items-center gap-4 mb-6">
          <AvatarFrame src={avatar} tier={tier} size={72} />
          <div className="flex-1 min-w-0">
            <div className="font-fifa text-xl text-gray-900 uppercase truncate">
              {name || "..."}
            </div>
            {team && (
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-600">
                <Flag
                  team={team}
                  className="w-4 h-4 rounded-full object-cover"
                />
                {localizeTeam(team, lang)}
              </div>
            )}
          </div>
        </div>

        {/* Display name */}
        <section className="rounded-3xl border border-gray-200 bg-white p-5 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            {t("pe.name")}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900"
            style={{ textAlign: dir === "rtl" ? "right" : "left" }}
          />
        </section>

        {/* Avatar presets */}
        <section className="rounded-3xl border border-gray-200 bg-white p-5 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
            {t("pe.avatar")}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AVATARS.map((src) => {
              const isSel = avatar === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setAvatar(src)}
                  className={`relative rounded-2xl border-2 p-2 flex items-center justify-center transition-all active:scale-95 ${
                    isSel
                      ? "border-wc-purple bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <AvatarFrame src={src} size={54} />
                  {isSel && (
                    <div className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-wc-purple text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Favorite team */}
        <section className="rounded-3xl border border-gray-200 bg-white p-5 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
            {t("pe.team")}
          </div>
          <div className="relative mb-3">
            <Search
              className={`absolute ${
                dir === "rtl" ? "right-3" : "left-3"
              } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ob.team.search")}
              className={`w-full ${
                dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
              } py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900`}
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
            {filteredTeams.map((tm) => {
              const isSel = team === tm.name;
              return (
                <button
                  key={tm.name}
                  type="button"
                  onClick={() => setTeam(isSel ? null : tm.name)}
                  className={`relative rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                    isSel
                      ? "border-wc-purple bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Flag
                    team={tm.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="text-[9px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
                    {localizeTeam(tm.name, lang)}
                  </div>
                  {isSel && (
                    <div className="absolute top-0.5 end-0.5 w-3.5 h-3.5 rounded-full bg-wc-purple text-white flex items-center justify-center">
                      <Check className="w-2 h-2" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {err && (
          <p className="text-wc-red text-sm text-center mb-3">{err}</p>
        )}

        <motion.button
          type="button"
          onClick={save}
          disabled={saving}
          whileTap={{ scale: 0.98 }}
          className="w-full inline-flex items-center justify-center gap-2 gradient-purple-cyan text-white font-bold py-3 rounded-2xl disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {t("pe.saved")}
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {t("pe.save")}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
