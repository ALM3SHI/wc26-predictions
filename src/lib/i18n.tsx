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
import { useRouter } from "next/navigation";
import { DICT } from "./i18n-dict";
import type { Lang } from "./i18n-data";

export type { Lang } from "./i18n-data";

const STORAGE_KEY = "wc26.lang";
const COOKIE_KEY = "wc26.lang";

function writeLangCookie(l: Lang) {
  if (typeof document === "undefined") return;
  // 1-year cookie so server components can read the preference on subsequent
  // requests. SameSite=Lax is safe here — nothing sensitive is stored.
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_KEY}=${l}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ar") {
        setLangState(stored);
        writeLangCookie(stored);
        return;
      }
    } catch {
      // ignore
    }
    // No stored preference — persist the default so server pages see it too.
    writeLangCookie("en");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        // ignore
      }
      writeLangCookie(l);
      // Re-render server components so any RSC-rendered copy switches
      // to the new language on the next paint.
      try {
        router.refresh();
      } catch {
        // ignore
      }
    },
    [router],
  );

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
