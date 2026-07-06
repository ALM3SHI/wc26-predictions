import Link from "next/link";
import { ArrowRight, UserPlus, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen bg-wc-black relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Shapes mimicking the abstract '26' brand shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-wc-green rounded-full blur-[100px] opacity-20 mix-blend-screen animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-wc-purple rounded-full blur-[100px] opacity-20 mix-blend-screen animate-float" />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-wc-red rounded-full blur-[120px] opacity-20 mix-blend-screen" />
      
      {/* Huge abstract '26' in the background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
        <span className="font-display font-black text-[50vw] leading-none tracking-tighter text-white select-none">
          26
        </span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center mt-[-10vh]">
        <h1 className="font-display font-black text-6xl md:text-8xl lg:text-[140px] tracking-tighter mb-4 uppercase leading-[0.85]">
          <span className="text-white block">We Are</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-wc-purple via-wc-cyan to-wc-green">
            Predicting
          </span>
        </h1>
        
        <p className="font-body text-lg md:text-xl text-white/50 mt-8 mb-12 max-w-md font-medium tracking-wide">
          The ultimate knockout stage prediction experience for the 2026 World Cup.
        </p>

        {user ? (
          <Link
            href="/bracket"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-display font-bold text-white bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all hover:scale-105 hover:border-wc-cyan/50 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] active:scale-95"
          >
            {/* Subtle gradient sweep on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-wc-purple/20 to-wc-cyan/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            
            <span className="relative z-10 tracking-widest uppercase">Enter the Bracket</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-display font-bold text-white bg-gradient-to-r from-wc-purple to-wc-cyan rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] active:scale-95"
            >
              <span className="relative z-10 tracking-widest uppercase">Sign Up</span>
              <UserPlus className="relative z-10 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-display font-bold text-white bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-white/10 active:scale-95"
            >
              <span className="relative z-10 tracking-widest uppercase">Log In</span>
              <LogIn className="relative z-10 w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {/* Footer minimal text */}
      <div className="absolute bottom-8 text-white/20 text-xs font-display font-bold uppercase tracking-[0.3em] text-center w-full">
        North America • 2026
      </div>
    </div>
  );
}
