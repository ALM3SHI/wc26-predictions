-- ============================================================
-- WC26 Predictions — Multi-tournament foundation
-- ============================================================
-- Run manually in the Supabase SQL Editor. Sets us up to run
-- follow-up competitions (Champions League, domestic leagues,
-- Euro 2028, etc.) without a rewrite.
--
-- This migration is intentionally minimal:
--   1. public.tournaments — one row per competition.
--   2. matches.tournament_id — nullable FK; existing rows land
--      on the WC26 seed row so nothing breaks.
--   3. meta_predictions.tournament_id — same pattern, so
--      champion / golden-boot picks scope to a competition.
--
-- Everything else (leaderboard views, scoring, xp) stays global
-- to WC26 for now. Later phases can add `WHERE tournament_id = X`
-- filters as needed.
--
-- Roll back with:
--   ALTER TABLE public.meta_predictions DROP COLUMN tournament_id;
--   ALTER TABLE public.matches DROP COLUMN tournament_id;
--   DROP TABLE public.tournaments;
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tournaments IS
  'Competitions the app tracks. WC26 is the default seed row.';

-- Seed WC26 so every existing match backfills cleanly. Insert-or-
-- update pattern so re-running the migration is safe.
INSERT INTO public.tournaments (slug, name, short_name, active, emoji, starts_at, ends_at)
  VALUES ('wc26', 'FIFA World Cup 2026', 'WC26', true, '🏆',
          '2026-06-11T00:00:00Z'::timestamptz,
          '2026-07-19T23:59:59Z'::timestamptz)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        emoji = EXCLUDED.emoji;

-- Attach matches to a tournament (nullable — old rows default to WC26).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id);

UPDATE public.matches
   SET tournament_id = (SELECT id FROM public.tournaments WHERE slug = 'wc26')
 WHERE tournament_id IS NULL;

CREATE INDEX IF NOT EXISTS matches_tournament_idx
  ON public.matches(tournament_id);

-- Meta predictions (champion, golden_boot, groups, bracket) are inherently
-- tournament-scoped — attach them too. Existing rows default to WC26.
ALTER TABLE public.meta_predictions
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id);

UPDATE public.meta_predictions
   SET tournament_id = (SELECT id FROM public.tournaments WHERE slug = 'wc26')
 WHERE tournament_id IS NULL;

-- Broaden the uniqueness constraint so a user can hold one pick per
-- (type, tournament) — enabling future competitions without conflict.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'meta_predictions_user_id_type_key'
  ) THEN
    ALTER TABLE public.meta_predictions
      DROP CONSTRAINT meta_predictions_user_id_type_key;
  END IF;
END $$;

ALTER TABLE public.meta_predictions
  ADD CONSTRAINT meta_predictions_user_type_tournament_uniq
    UNIQUE (user_id, type, tournament_id);

-- RLS on tournaments: public read, admin-only write (via API routes
-- gated on is_admin). No policies needed for anon writes.
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tournaments: public read" ON public.tournaments;
CREATE POLICY "Tournaments: public read"
  ON public.tournaments FOR SELECT
  USING (true);

COMMIT;

-- Verify:
--   SELECT slug, name FROM public.tournaments;
--   SELECT tournament_id, COUNT(*) FROM public.matches GROUP BY 1;
