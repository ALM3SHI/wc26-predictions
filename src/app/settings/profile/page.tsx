import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditor from "./ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfileEditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, favorite_team, current_tier")
    .eq("id", user.id)
    .single();

  return (
    <ProfileEditor
      userId={user.id}
      initialName={profile?.display_name ?? ""}
      initialAvatar={profile?.avatar_url ?? null}
      initialTeam={profile?.favorite_team ?? null}
      tier={profile?.current_tier ?? 1}
    />
  );
}
