import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeagueDetail from "./LeagueDetail";
import { getLeague, getLeagueMembers } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/leagues/${params.id}`);

  let league;
  let members;
  try {
    [league, members] = await Promise.all([
      getLeague(supabase, params.id),
      getLeagueMembers(supabase, params.id),
    ]);
  } catch {
    notFound();
  }

  if (!league) notFound();

  return (
    <LeagueDetail
      userId={user.id}
      league={league}
      members={members ?? []}
    />
  );
}
