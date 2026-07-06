"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, LayoutGrid, Settings, LogOut, LogIn, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navigation() {
  const pathname = usePathname();
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

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Bracket", href: "/bracket", icon: LayoutGrid },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ label: "Admin", href: "/admin", icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                  isActive ? "text-black" : "text-gray-400 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 mb-1 ${isActive ? "text-black drop-shadow-md" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {!user && (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all text-gray-400 hover:text-gray-900"
            >
              <LogIn className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Login</span>
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Logout</span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Top Nav */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
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
                    isActive ? "text-black" : "text-gray-500 hover:text-black"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors ml-4 pl-4 border-l border-gray-200">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors ml-4 pl-4 border-l border-gray-200">
                <LogIn className="w-4 h-4" />
                Login
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
