import Link from "next/link";
import { User, MessageSquare, Wallet, MapPin, Grid, Ticket, Gamepad2, Coffee, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const quickAccess = [
    { label: "Stadiums", icon: MapPin, color: "bg-orange-500", href: "#" },
    { label: "Cities", icon: MapPin, color: "bg-pink-500", href: "#" },
    { label: "Tournament", icon: LayoutGrid, color: "bg-blue-500", href: "/bracket" },
    { label: "Tickets", icon: Ticket, color: "bg-indigo-500", href: "#" },
    { label: "Play Zone", icon: Gamepad2, color: "bg-teal-400", href: "#" },
    { label: "Hospitality", icon: Coffee, color: "bg-purple-500", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Link href={user ? "/user/" + user.id : "/login"} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200">
          <User className="w-5 h-5" />
        </Link>
        <div className="font-display font-black text-2xl tracking-tighter">
          26
        </div>
        <div className="flex gap-3 text-gray-600">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <Wallet className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-6">
        
        {/* Teams Banner */}
        <div className="relative w-full h-[250px] md:h-[350px] bg-gray-900 rounded-[2rem] overflow-hidden shadow-md">
          {/* A gradient placeholder representing the players background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-800 to-black opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/10 font-fifa text-8xl">26</span>
          </div>
          <div className="absolute bottom-6 left-6 z-10 text-white">
            <h2 className="font-bold text-3xl mb-1 drop-shadow-md">Teams</h2>
            <p className="text-white/80 text-sm font-medium">News, latest scores and more for every team.</p>
          </div>
        </div>

        {/* City Selector */}
        <button className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-blue-600 font-bold">
            <MapPin className="w-5 h-5" />
            <span className="text-gray-900">Select your city</span>
          </div>
          <span className="text-gray-400 font-bold">&gt;</span>
        </button>

        {/* Quick Access */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-4">Quick access</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map((item) => (
              <Link key={item.label} href={item.href} className="flex flex-col gap-2">
                <div className={`aspect-square rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform relative overflow-hidden`}>
                  <item.icon className="w-8 h-8 md:w-12 md:h-12 relative z-10" />
                  {/* Subtle color bar at bottom matching the screenshot */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-wc-purple via-wc-red to-wc-green" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Auth CTA if not logged in */}
        {!user && (
          <div className="mt-8 bg-white p-6 rounded-[2rem] text-center border border-gray-100 shadow-sm">
            <h2 className="font-bold text-xl mb-2 text-gray-900">Join the Predictions</h2>
            <p className="text-gray-500 text-sm mb-4">Log in or create an account to start predicting matches.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/login" className="px-6 py-2 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200">
                Log In
              </Link>
              <Link href="/signup" className="px-6 py-2 bg-wc-purple text-white font-bold rounded-xl hover:bg-wc-purple-light">
                Sign Up
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
