import { MatchRichBadges } from "@/components/ui/MatchRichBadges";
import { getMatchByApiId } from "@/lib/football-data";

/**
 * Async server component that fetches rich match context in isolation,
 * behind its own Suspense boundary. If football-data.org / Redis are
 * slow, only THIS panel waits — the score, prediction form, and
 * consensus keep rendering.
 */
export async function RichBadgesLoader({
  apiFixtureId,
}: {
  apiFixtureId: number | null;
}) {
  if (!apiFixtureId) return null;
  const rich = await getMatchByApiId(apiFixtureId);
  return <MatchRichBadges rich={rich} />;
}
