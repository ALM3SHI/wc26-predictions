import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeaguesClient from "./LeaguesClient";
import { myLeagues } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/leagues");

  let leagues: Awaited<ReturnType<typeof myLeagues>> = [];
  try {
    leagues = await myLeagues(supabase, user.id);
  } catch {
    leagues = [];
  }

  return <LeaguesClient userId={user.id} initialLeagues={leagues} />;
}
