// ─────────────────────────────────────────────────────────────
// Shared i18n data (safe on both server and client)
//  - Team name translations
//  - Round / stage translations
//  - Locale-aware date/time formatters
// ─────────────────────────────────────────────────────────────

export type Lang = "en" | "ar";

// ── Team names ────────────────────────────────────────────────
// English name (as stored in DB) → Arabic display name
const TEAMS_AR: Record<string, string> = {
  TBD: "غير محدد",
  Argentina: "الأرجنتين",
  Brazil: "البرازيل",
  France: "فرنسا",
  England: "إنجلترا",
  Spain: "إسبانيا",
  Portugal: "البرتغال",
  Germany: "ألمانيا",
  Italy: "إيطاليا",
  Netherlands: "هولندا",
  Belgium: "بلجيكا",
  Croatia: "كرواتيا",
  Uruguay: "أوروغواي",
  Colombia: "كولومبيا",
  USA: "الولايات المتحدة",
  "United States": "الولايات المتحدة",
  Mexico: "المكسيك",
  Canada: "كندا",
  Senegal: "السنغال",
  Morocco: "المغرب",
  Japan: "اليابان",
  "South Korea": "كوريا الجنوبية",
  "Korea Republic": "كوريا الجنوبية",
  "Saudi Arabia": "السعودية",
  Iran: "إيران",
  "IR Iran": "إيران",
  Australia: "أستراليا",
  Switzerland: "سويسرا",
  Denmark: "الدنمارك",
  Serbia: "صربيا",
  Ecuador: "الإكوادور",
  Peru: "بيرو",
  Chile: "تشيلي",
  Sweden: "السويد",
  Poland: "بولندا",
  Wales: "ويلز",
  Ukraine: "أوكرانيا",
  Nigeria: "نيجيريا",
  Egypt: "مصر",
  Algeria: "الجزائر",
  "Ivory Coast": "ساحل العاج",
  "Côte d'Ivoire": "ساحل العاج",
  Cameroon: "الكاميرون",
  Ghana: "غانا",
  Mali: "مالي",
  Qatar: "قطر",
  UAE: "الإمارات",
  "United Arab Emirates": "الإمارات",
  Iraq: "العراق",
  Oman: "عُمان",
  Uzbekistan: "أوزبكستان",
  China: "الصين",
  "New Zealand": "نيوزيلندا",
  Jamaica: "جامايكا",
  "Costa Rica": "كوستاريكا",
  Panama: "بنما",
  Honduras: "هندوراس",
  "El Salvador": "السلفادور",
  Venezuela: "فنزويلا",
  Paraguay: "باراغواي",
  Bolivia: "بوليفيا",
  Turkey: "تركيا",
  Türkiye: "تركيا",
  Norway: "النرويج",
  Scotland: "اسكتلندا",
  Ireland: "أيرلندا",
  "Republic of Ireland": "أيرلندا",
  Greece: "اليونان",
  "Czech Republic": "التشيك",
  Czechia: "التشيك",
  Austria: "النمسا",
  Hungary: "المجر",
  Russia: "روسيا",
  Tunisia: "تونس",
  Slovakia: "سلوفاكيا",
  Romania: "رومانيا",
  Slovenia: "سلوفينيا",
  Georgia: "جورجيا",
  Finland: "فنلندا",
  Iceland: "أيسلندا",
  Albania: "ألبانيا",
  Bosnia: "البوسنة",
  "Bosnia and Herzegovina": "البوسنة والهرسك",
  Kosovo: "كوسوفو",
  Montenegro: "الجبل الأسود",
  "DR Congo": "الكونغو الديمقراطية",
  "Cape Verde": "الرأس الأخضر",
  Gabon: "الغابون",
  Angola: "أنغولا",
  Zambia: "زامبيا",
  Kenya: "كينيا",
  Uganda: "أوغندا",
  Tanzania: "تنزانيا",
  "South Africa": "جنوب أفريقيا",
  Burkina: "بوركينا فاسو",
  "Burkina Faso": "بوركينا فاسو",
  Guinea: "غينيا",
};

export function localizeTeam(name: string | null | undefined, lang: Lang): string {
  if (!name) return "";
  if (lang === "ar") return TEAMS_AR[name] ?? name;
  // Normalize a couple of aliases in English too
  if (name === "IR Iran") return "Iran";
  if (name === "United States") return "USA";
  return name;
}

// ── Tournament round / stage names ────────────────────────────
// Handles many forms: "Round of 16", "Round of 32", "Quarter-finals",
// "Semi-finals", "Final", "3rd place", "Group A"..."Group H", "GROUP_STAGE"
export function localizeRound(round: string | null | undefined, lang: Lang): string {
  if (!round) return "";
  const raw = round.trim();
  const key = raw.toLowerCase().replace(/[_\s-]+/g, " ").replace(/s$/, "");

  const map: Record<string, { en: string; ar: string }> = {
    "round of 32": { en: "Round of 32", ar: "دور الـ32" },
    "round of 16": { en: "Round of 16", ar: "دور الـ16" },
    "last 16": { en: "Round of 16", ar: "دور الـ16" },
    "quarter final": { en: "Quarter-finals", ar: "ربع النهائي" },
    "quarterfinal": { en: "Quarter-finals", ar: "ربع النهائي" },
    "quarter": { en: "Quarter-finals", ar: "ربع النهائي" },
    "semi final": { en: "Semi-finals", ar: "نصف النهائي" },
    "semifinal": { en: "Semi-finals", ar: "نصف النهائي" },
    "semi": { en: "Semi-finals", ar: "نصف النهائي" },
    "final": { en: "Final", ar: "النهائي" },
    "3rd place": { en: "3rd Place", ar: "المركز الثالث" },
    "third place": { en: "3rd Place", ar: "المركز الثالث" },
    "group stage": { en: "Group Stage", ar: "دور المجموعات" },
    "group": { en: "Group Stage", ar: "دور المجموعات" },
    "knockout": { en: "Knockout", ar: "دور خروج المغلوب" },
    "playoff": { en: "Play-off", ar: "الملحق" },
    "play off": { en: "Play-off", ar: "الملحق" },
  };

  if (map[key]) return lang === "ar" ? map[key].ar : map[key].en;

  // "Group A" / "Group H"
  const gm = raw.match(/^group\s+([a-h])$/i);
  if (gm) {
    const letter = gm[1].toUpperCase();
    return lang === "ar" ? `المجموعة ${letter}` : `Group ${letter}`;
  }

  return raw;
}

// ── Dates / times ─────────────────────────────────────────────
// Force the Gregorian calendar so Arabic renders "12 يوليو" not the Umm-al-Qura hijri.
const AR_LOCALE = "ar-EG-u-ca-gregory";

export function localeTag(lang: Lang): string {
  return lang === "ar" ? AR_LOCALE : "en-US";
}

export function formatMatchDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return d.toLocaleDateString(localeTag(lang), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatMatchDateShort(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return d.toLocaleString(localeTag(lang), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMatchTimeShort(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return d.toLocaleString(localeTag(lang), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Convert an integer to Arabic-Indic digits when Arabic is active.
// Leaves numbers alone in English mode.
export function localizeNumber(n: number | string, lang: Lang): string {
  const s = String(n);
  if (lang !== "ar") return s;
  const map: Record<string, string> = {
    "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
    "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
  };
  return s.replace(/[0-9]/g, (d) => map[d] ?? d);
}
