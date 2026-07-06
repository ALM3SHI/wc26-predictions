"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutGrid, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Don't show nav on auth pages or home page (home has its own nav)
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems = [
    { label: "Bracket", href: "/bracket", icon: LayoutGrid },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-wc-surface/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                  isActive ? "text-wc-purple-light bg-wc-purple/10" : "text-white/50 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 mb-1 ${isActive ? "neon-text-purple" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top Nav */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-wc-surface/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/bracket" className="font-display font-black text-xl tracking-tight text-gradient gradient-purple-cyan">
            WC26
          </Link>
          
          <div className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive ? "text-wc-purple-light" : "text-white/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {user && (
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-wc-red transition-colors ml-4 pl-4 border-l border-white/10">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Spacer for desktop nav */}
      <div className="hidden md:block h-16" />
    </>
  );
}
