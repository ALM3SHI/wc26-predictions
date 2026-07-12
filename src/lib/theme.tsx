"use client";

// ─────────────────────────────────────────────────────────────
// Theme system — light / dark / auto (system).
//
// One React context, one `data-theme` attribute on the <html>
// element, one localStorage key. Auto mode subscribes to the
// `prefers-color-scheme` media query so the app follows the OS
// without a reload. The picker in Settings persists a user
// override that wins over the system preference.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "wc26.theme";

interface Ctx {
  pref: ThemePref;
  resolved: ResolvedTheme;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<Ctx | null>(null);

function readSystem(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
  // Update the mobile browser chrome color to match.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#0B1220" : "#F9FAFB");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("auto");
  const [systemDark, setSystemDark] = useState(false);

  // Hydrate from localStorage + subscribe to system changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let stored: ThemePref = "auto";
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "auto") stored = raw;
    } catch {
      // ignore
    }
    setPrefState(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    setSystemDark(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const resolved: ResolvedTheme = useMemo(() => {
    if (pref === "auto") return systemDark ? "dark" : "light";
    return pref;
  }, [pref, systemDark]);

  useEffect(() => {
    apply(resolved);
  }, [resolved]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ pref, resolved, setPref }), [
    pref,
    resolved,
    setPref,
  ]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const c = useContext(ThemeContext);
  return (
    c ?? {
      pref: "auto",
      resolved: readSystem(),
      setPref: () => {},
    }
  );
}

// SSR-safe flash prevention — inline snippet added to <head>.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(t==='light'||t==='dark')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`;
