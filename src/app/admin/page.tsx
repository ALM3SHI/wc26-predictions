import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/"); // Not authorized
  }

  // Fetch all matches
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("start_time", { ascending: false });

  // Fetch all users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("total_points", { ascending: false });

  // Fetch all predictions
  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      *,
      matches ( home_team, away_team )
    `)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 text-center">
          <h1 className="font-fifa text-5xl sm:text-7xl tracking-tighter mb-4 uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            SUPER <span className="text-wc-red">ADMIN</span>
          </h1>
          <p className="text-white/60">Manage matches, override scores, create users, and edit predictions.</p>
        </header>

        <AdminClient 
          initialMatches={matches || []} 
          initialUsers={profiles || []}
          initialPredictions={predictions || []}
        />
      </div>
    </div>
  );
}
