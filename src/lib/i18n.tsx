"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "wc26.lang";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.bracket": "Bracket",
    "nav.legends": "Legends",
    "nav.leaderboard": "Leaderboard",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "nav.login": "Login",
    "nav.logout": "Logout",
    // Home
    "home.hero.title": "Predict & Gamble",
    "home.hero.sub": "Dial your score, stake a chip, top the world.",
    "home.next": "Next kickoff",
    "home.points": "Your Points",
    "home.rank": "Global Rank",
    "home.legends.title": "Ride 5x. Or fold.",
    "home.legends.sub": "Stake a chip. Nail the score. Land in the Hall of Fame.",
    "home.legends.flag": "Gamble Mode Unlocked",
    "home.quick": "Quick access",
    "home.join.title": "Join the Predictions",
    "home.join.sub": "Log in or create an account to start predicting matches.",
    // Bracket
    "bracket.title": "Knockout Bracket",
    "bracket.live": "Live Now",
    "bracket.upcoming": "Upcoming (Next 24h)",
    "bracket.previous": "Previous (Last 24h)",
    "bracket.predict": "PREDICT",
    "bracket.picked": "PICKED",
    "bracket.locked": "LOCKED",
    "bracket.yourpick": "Your Pick",
    "bracket.fulltime": "FULL TIME",
    "bracket.empty": "Bracket loads soon — sync fixtures in the admin panel",
    // Leaderboard
    "leaderboard.title": "Global Leaderboard",
    "leaderboard.sub": "The best football oracles at WC26. Top 100 rankings, live.",
    "leaderboard.podium": "Podium — Top Predictors",
    "leaderboard.big3": "The Big Three",
    "leaderboard.exact": "Exact Score (3 pts)",
    "leaderboard.outcome": "Correct Outcome (1 pt)",
    "leaderboard.wrong": "Wrong (0 pts)",
    "leaderboard.empty":
      "No predictions have been scored yet. Check back after the first match!",
    // Legends
    "legends.pre": "Hall of Fame",
    "legends.title": "LEGENDARY PICKS",
    "legends.sub":
      "Every exact scoreline nailed at WC26. Ride the gamble chip and stamp your name here.",
    "legends.empty": "No legends yet",
    "legends.emptysub": "Nail an exact scoreline to open the Hall.",
    // Match
    "match.matchday": "MATCH DAY",
    "match.live": "LIVE",
    "match.upcoming": "UPCOMING",
    "match.fulltime": "FULL TIME",
    "match.countdown": "Time until kickoff",
    "match.locked": "This match is locked. Predictions can no longer be edited.",
    "match.dial": "Dial in your scoreline, then pick a stake before kickoff.",
    "match.back": "Back to Bracket",
    "match.saved": "Prediction saved!",
    "match.consensus": "Community consensus",
    "match.consensus.home": "Home win",
    "match.consensus.draw": "Draw",
    "match.consensus.away": "Away win",
    "match.consensus.empty": "No picks yet — be the first oracle.",
    // Buttons / actions
    "cta.lock": "Lock It In",
    "cta.update": "Update & Lock",
    // Gamble
    "gamble.title": "GAMBLE MODE — PICK YOUR STAKE",
    "stake.safe": "Safe",
    "stake.bold": "Bold",
    "stake.legend": "Legend",
    "stake.allin": "All-In",
    "stake.safe.tagline": "No risk. No glory.",
    "stake.bold.tagline": "Double or nothing.",
    "stake.legend.tagline": "Triple the write-up.",
    "stake.allin.tagline": "Hall of Fame or bust.",
    // Preview
    "preview.exact": "Exact score",
    "preview.outcome": "Right outcome",
    "preview.wrong": "If you're wrong",
    "preview.wrong0": "Wrong pick",
    // LockIn
    "lockin.title": "LOCKED IN",
    "lockin.stake": "Stake",
    "lockin.tap": "Tap anywhere to continue",
    "lockin.aria": "Prediction locked",
    // Gamble Result
    "result.title": "Gamble Result",
    "result.pick": "Your pick",
    "result.actual": "Actual",
    "result.pending": "PENDING",
    "result.exact": "Exact-score Legend",
    "result.base": "Base points",
    "result.mult": "Multiplier",
    // Gamble Stats
    "ledger.title": "Your Gamble Ledger",
    "ledger.device": "on-device",
    "ledger.net": "Net gamble",
    "ledger.biggestwin": "Biggest win",
    "ledger.biggestloss": "Biggest loss",
    "ledger.exact": "Exact hits",
    "ledger.foot":
      "Gamble numbers live on this device. Your global points on the leaderboard use base scoring.",
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.sound": "Sound Effects",
    "settings.sound.desc": "Play celebration tones on lock-in and wins",
    "settings.push": "Push Notifications",
    "settings.push.desc": "Get reminded 1h before kickoff",
    "settings.email": "Email Reminders",
    "settings.email.desc": "Nudge if you haven't predicted a match",
    "settings.motion": "Reduce Motion",
    "settings.motion.desc": "Ease off on animations",
    "settings.reset": "Reset Gamble Ledger",
    "settings.reset.desc": "Clears your on-device stakes",
    "settings.reset.confirm":
      "Are you sure? This wipes every stake you've placed on this device.",
    "settings.reset.done": "Ledger reset.",
    "settings.about": "About",
    "settings.version": "Version",
    "settings.signout": "Sign out",
    // Achievements
    "ach.title": "Achievements",
    "ach.locked": "Locked",
    "ach.first.title": "First Blood",
    "ach.first.desc": "Score your first correct outcome",
    "ach.exact.title": "Sharpshooter",
    "ach.exact.desc": "Nail one exact score",
    "ach.trio.title": "Hat-trick",
    "ach.trio.desc": "Land three exact scores",
    "ach.legend.title": "Legend Runner",
    "ach.legend.desc": "Cash a 3x stake",
    "ach.allin.title": "All-In Ace",
    "ach.allin.desc": "Cash a 5x stake",
    "ach.streak.title": "On Fire",
    "ach.streak.desc": "Correct on 3 matches in a row",
    // Empty
    "empty.matches": "No matches within 6h — bracket updates soon",
    "empty.legends": "No matches within 6h — legends are patient",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.bracket": "المباريات",
    "nav.legends": "الأساطير",
    "nav.leaderboard": "الترتيب",
    "nav.settings": "الإعدادات",
    "nav.admin": "المشرف",
    "nav.login": "دخول",
    "nav.logout": "خروج",
    "home.hero.title": "توقّع وقامر",
    "home.hero.sub": "دلدل النتيجة، رمي شيبك، تصدّر العالم.",
    "home.next": "بداية المباراة القادمة",
    "home.points": "نقاطك",
    "home.rank": "ترتيبك عالمياً",
    "home.legends.title": "قامر ٥ أضعاف أو خسّر",
    "home.legends.sub": "ارمي شيبك، ضبّط النتيجة، ادخل قاعة المشاهير.",
    "home.legends.flag": "وضع المقامرة مفتوح",
    "home.quick": "الوصول السريع",
    "home.join.title": "انضم للتوقّعات",
    "home.join.sub": "سجّل دخول أو أنشئ حساب لتبدأ التوقّع.",
    "bracket.title": "خارطة الإقصائيات",
    "bracket.live": "مباشر الآن",
    "bracket.upcoming": "القادمة (٢٤ ساعة)",
    "bracket.previous": "السابقة (٢٤ ساعة)",
    "bracket.predict": "توقّع",
    "bracket.picked": "متوقَّعة",
    "bracket.locked": "مقفلة",
    "bracket.yourpick": "توقّعك",
    "bracket.fulltime": "انتهت",
    "bracket.empty": "المباريات تُحمّل قريباً — زامن من لوحة المشرف",
    "leaderboard.title": "الترتيب العالمي",
    "leaderboard.sub": "أعظم عرّافي كرة القدم في كأس ٢٦. أفضل ١٠٠ مباشر.",
    "leaderboard.podium": "المنصّة — الأوائل",
    "leaderboard.big3": "الثلاثة الكبار",
    "leaderboard.exact": "نتيجة دقيقة (٣ نقاط)",
    "leaderboard.outcome": "توقّع صحيح (١ نقطة)",
    "leaderboard.wrong": "خطأ (٠ نقاط)",
    "leaderboard.empty": "لم تُحسب توقّعات بعد. عُد بعد أوّل مباراة!",
    "legends.pre": "قاعة المشاهير",
    "legends.title": "التوقّعات الأسطورية",
    "legends.sub": "كل نتيجة دقيقة أُصيبت في كأس ٢٦. ارمي شيبك واحفر اسمك هنا.",
    "legends.empty": "لا أساطير حتى الآن",
    "legends.emptysub": "أصب نتيجة دقيقة لتفتح القاعة.",
    "match.matchday": "يوم المباراة",
    "match.live": "مباشر",
    "match.upcoming": "قادمة",
    "match.fulltime": "انتهت",
    "match.countdown": "الوقت حتى انطلاق المباراة",
    "match.locked": "المباراة مقفلة. لا يمكن تعديل التوقّع.",
    "match.dial": "دلدل النتيجة ثم اختر شيبك قبل انطلاق المباراة.",
    "match.back": "رجوع للمباريات",
    "match.saved": "حُفظ التوقّع!",
    "match.consensus": "إجماع المستخدمين",
    "match.consensus.home": "فوز أصحاب الأرض",
    "match.consensus.draw": "تعادل",
    "match.consensus.away": "فوز الضيف",
    "match.consensus.empty": "لا توقّعات بعد — كن أول العرّافين.",
    "cta.lock": "ثبّت التوقّع",
    "cta.update": "حدّث وثبّت",
    "gamble.title": "وضع المقامرة — اختر شيبك",
    "stake.safe": "آمن",
    "stake.bold": "جريء",
    "stake.legend": "أسطوري",
    "stake.allin": "كل شي",
    "stake.safe.tagline": "لا مخاطرة، لا مجد.",
    "stake.bold.tagline": "ضِعف أو صفر.",
    "stake.legend.tagline": "ثلاث أضعاف الحكاية.",
    "stake.allin.tagline": "قاعة المشاهير أو الحفرة.",
    "preview.exact": "نتيجة دقيقة",
    "preview.outcome": "توقّع صحيح",
    "preview.wrong": "إذا غلطت",
    "preview.wrong0": "توقّع خطأ",
    "lockin.title": "مُثبَّتة",
    "lockin.stake": "رهان",
    "lockin.tap": "المس أي مكان للاستمرار",
    "lockin.aria": "التوقّع مثبّت",
    "result.title": "نتيجة المقامرة",
    "result.pick": "توقّعك",
    "result.actual": "الحقيقي",
    "result.pending": "قيد الانتظار",
    "result.exact": "أسطورة النتيجة الدقيقة",
    "result.base": "النقاط الأساسية",
    "result.mult": "المضاعف",
    "ledger.title": "دفتر مقامراتك",
    "ledger.device": "على هذا الجهاز",
    "ledger.net": "صافي المقامرة",
    "ledger.biggestwin": "أكبر فوز",
    "ledger.biggestloss": "أكبر خسارة",
    "ledger.exact": "توقّعات دقيقة",
    "ledger.foot": "أرقام المقامرة تعيش على هذا الجهاز فقط. نقاطك العالمية تحسب أساسي.",
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.sound": "المؤثّرات الصوتية",
    "settings.sound.desc": "تشغيل نغمات الاحتفال عند التثبيت والفوز",
    "settings.push": "الإشعارات الفورية",
    "settings.push.desc": "تذكيرك قبل ساعة من انطلاق المباراة",
    "settings.email": "تذكير بالبريد",
    "settings.email.desc": "نبّهك إن لم تتوقّع مباراة",
    "settings.motion": "تقليل الحركة",
    "settings.motion.desc": "تخفيف حِدّة الأنيميشن",
    "settings.reset": "تصفير دفتر المقامرات",
    "settings.reset.desc": "يمسح رهاناتك المخزّنة على هذا الجهاز",
    "settings.reset.confirm": "متأكد؟ هذا يمسح كل رهاناتك على هذا الجهاز.",
    "settings.reset.done": "تم تصفير الدفتر.",
    "settings.about": "عن التطبيق",
    "settings.version": "الإصدار",
    "settings.signout": "تسجيل الخروج",
    "ach.title": "الإنجازات",
    "ach.locked": "مغلق",
    "ach.first.title": "الدم الأول",
    "ach.first.desc": "أوّل توقّع صحيح",
    "ach.exact.title": "قنّاص",
    "ach.exact.desc": "أصب نتيجة دقيقة واحدة",
    "ach.trio.title": "هاتريك",
    "ach.trio.desc": "أصب ثلاث نتائج دقيقة",
    "ach.legend.title": "راكب الأسطورة",
    "ach.legend.desc": "اقبض رهان ٣ أضعاف",
    "ach.allin.title": "بطل الكل-إن",
    "ach.allin.desc": "اقبض رهان ٥ أضعاف",
    "ach.streak.title": "متّقد",
    "ach.streak.desc": "توقّع صحيح في ٣ مباريات متتالية",
    "empty.matches": "لا مباريات خلال ٦ ساعات — التحديث قريب",
    "empty.legends": "لا مباريات خلال ٦ ساعات — الأساطير صبورة",
  },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ar") {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (k: string) => DICT[lang][k] ?? DICT.en[k] ?? k,
    [lang],
  );

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) {
    // fallback for server-render / outside provider
    return {
      lang: "en",
      setLang: () => {},
      t: (k: string) => DICT.en[k] ?? k,
      dir: "ltr",
    };
  }
  return c;
}
