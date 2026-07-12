import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

  // Fetch all users — profiles first, then hydrate with auth emails
  // via the service-role client (auth.users is not RLS-friendly).
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("total_points", { ascending: false });

  let profilesWithEmail = profiles ?? [];
  try {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: authList } = await svc.auth.admin.listUsers({
      perPage: 200,
    });
    const emailById = new Map<string, string>();
    for (const u of authList?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
    profilesWithEmail = profilesWithEmail.map((p) => ({
      ...p,
      email: emailById.get(p.id) ?? null,
    }));
  } catch {
    // Service-role key not configured — just fall back to no emails.
  }

  // Fetch all predictions
  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      *,
      matches ( home_team, away_team )
    `)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">


        <AdminClient
          initialMatches={matches || []}
          initialUsers={profilesWithEmail}
          initialPredictions={predictions || []}
        />
      </div>
    </div>
  );
}
