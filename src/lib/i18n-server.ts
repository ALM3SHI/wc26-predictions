import { cookies } from "next/headers";
import { DICT } from "./i18n-dict";
import type { Lang } from "./i18n-data";

export const LANG_COOKIE = "wc26.lang";

export async function getServerLang(): Promise<Lang> {
  try {
    const store = await cookies();
    const v = store.get(LANG_COOKIE)?.value;
    if (v === "ar" || v === "en") return v;
  } catch {
    // in edge/RSC contexts where cookies() throws — fall through
  }
  return "en";
}

export async function getServerT(): Promise<{
  lang: Lang;
  t: (k: string) => string;
  dir: "ltr" | "rtl";
}> {
  const lang = await getServerLang();
  return {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (k: string) => DICT[lang][k] ?? DICT.en[k] ?? k,
  };
}
