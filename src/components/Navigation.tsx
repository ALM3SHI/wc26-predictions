"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, LayoutGrid, Settings, LogOut, LogIn, ShieldAlert, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useI18n } from "@/lib/i18n";

const TRI_GRADIENT =
  "linear-gradient(90deg, #C8102E 0%, #C8102E 33%, #002868 33%, #002868 66%, #006847 66%, #006847 100%)";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navigation() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("profiles").select("is_admin").eq("id", data.user.id).single()
          .then(({ data: profile }) => {
            setIsAdmin(!!profile?.is_admin);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()
          .then(({ data: profile }) => {
            setIsAdmin(!!profile?.is_admin);
          });
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Don't show nav on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems: NavItem[] = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.bracket"), href: "/bracket", icon: LayoutGrid },
    { label: t("nav.legends"), href: "/legends", icon: Sparkles },
    { label: t("nav.leaderboard"), href: "/leaderboard", icon: Trophy },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ label: t("nav.admin"), href: "/admin", icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-stretch justify-around p-2 gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex flex-col items-center justify-center flex-1 h-14 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  active
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1 transition-transform duration-150 ${
                    active
                      ? "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                      : "group-active:scale-110"
                  }`}
                />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
                {active && (
                  <span
                    className="absolute -top-0.5 h-1 w-8 rounded-full"
                    style={{ background: TRI_GRADIENT }}
                  />
                )}
              </Link>
            );
          })}

          {!user && (
            <Link
              href="/login"
              className="group flex flex-col items-center justify-center flex-1 h-14 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 active:scale-90 transition-all duration-150 select-none"
            >
              <LogIn className="w-5 h-5 mb-1 transition-transform duration-150 group-active:scale-110" />
              <span className="text-[10px] font-medium leading-none">
                {t("nav.login")}
              </span>
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="group flex flex-col items-center justify-center flex-1 h-14 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 active:scale-90 transition-all duration-150 select-none"
              aria-label={t("nav.logout")}
            >
              <LogOut className="w-5 h-5 mb-1 transition-transform duration-150 group-active:scale-110 rtl-flip-auto" />
              <span className="text-[10px] font-medium leading-none">
                {t("nav.logout")}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Top Nav */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/bracket"
            className="font-fifa font-black text-2xl tracking-tight host-text-gradient transition-transform duration-150 active:scale-95"
          >
            WC26
          </Link>

          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 ${
                    active
                      ? "text-black bg-gray-100"
                      : "text-gray-500 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {active && (
                    <span
                      className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: TRI_GRADIENT }}
                    />
                  )}
                </Link>
              );
            })}

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-all duration-150 active:scale-95 ms-4 ps-4 border-s border-gray-200"
              >
                <LogOut className="w-4 h-4 rtl-flip-auto" />
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-all duration-150 active:scale-95 ms-4 ps-4 border-s border-gray-200"
              >
                <LogIn className="w-4 h-4" />
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for desktop nav */}
      <div className="hidden md:block h-16" />
    </>
  );
}
