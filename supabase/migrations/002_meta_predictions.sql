-- ============================================================
-- WC26 Predictions — Meta Predictions + Favorite Team
-- ============================================================
-- Run manually in the Supabase SQL Editor. Adds three things:
--
--   1. profiles.favorite_team          — onboarding choice
--   2. profiles.onboarding_completed   — first-run flag
--   3. public.meta_predictions         — tournament-wide picks:
--        - champion       (winner of WC26)
--        - golden_boot    (top scorer, player id + name)
--        - group_standings (12 groups × 4-team ordering)
--        - bracket        (R32/R16/QF/SF/F winner picks)
--
-- All meta types share one table with a discriminated `type` column
-- and a JSONB `payload`. Keeps the schema small; app-side logic
-- handles per-type shape and scoring.
--
-- Scoring is deferred to app-side / a future scoring migration —
-- we only need the storage now so the UI can save picks.
--
-- Roll back with:
--   DROP TABLE public.meta_predictions;
--   ALTER TABLE public.profiles
--     DROP COLUMN favorite_team,
--     DROP COLUMN onboarding_completed;
-- ============================================================

BEGIN;

-- 1. Profile fields for onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_team TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.favorite_team IS
  'Team name (matches TEAMS_AR keys in i18n-data.ts). Nullable — user may skip.';
COMMENT ON COLUMN public.profiles.onboarding_completed IS
  'True once the user has finished the first-run flow (team pick + tutorial).';

-- 2. Meta predictions table
CREATE TABLE IF NOT EXISTS public.meta_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('champion', 'golden_boot', 'group_standings', 'bracket')),
  -- Shape depends on `type`:
  --   champion:        { team: "Argentina" }
  --   golden_boot:     { player_id: 44, player_name: "Kylian Mbappé", team: "France" }
  --   group_standings: { A: ["Mexico","Canada","USA","..."] , B: [...] , ... }
  --   bracket:         { r16: {match_id: winner_team}, qf: {...}, sf: {...}, final: winner_team }
  payload JSONB NOT NULL,
  -- Points awarded once the tournament resolves this pick. Nullable
  -- until scoring runs.
  points_earned INTEGER,
  scored BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Each user may hold at most one active pick per type.
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS meta_predictions_user_idx
  ON public.meta_predictions(user_id);
CREATE INDEX IF NOT EXISTS meta_predictions_type_idx
  ON public.meta_predictions(type);

COMMENT ON TABLE public.meta_predictions IS
  'Tournament-wide picks: champion, golden boot, group standings, bracket.';

-- 3. RLS — same policy shape as predictions: users read/write their own,
-- everyone can read published tallies once we build them.
ALTER TABLE public.meta_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meta preds: read own" ON public.meta_predictions;
CREATE POLICY "Meta preds: read own"
  ON public.meta_predictions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Meta preds: insert own" ON public.meta_predictions;
CREATE POLICY "Meta preds: insert own"
  ON public.meta_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Meta preds: update own" ON public.meta_predictions;
CREATE POLICY "Meta preds: update own"
  ON public.meta_predictions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Meta preds: delete own" ON public.meta_predictions;
CREATE POLICY "Meta preds: delete own"
  ON public.meta_predictions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Touch trigger to keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION public.touch_meta_predictions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meta_predictions_touch ON public.meta_predictions;
CREATE TRIGGER meta_predictions_touch
  BEFORE UPDATE ON public.meta_predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_meta_predictions_updated_at();

COMMIT;

-- Verify:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'profiles' AND column_name IN
--      ('favorite_team','onboarding_completed');
--   SELECT COUNT(*) FROM public.meta_predictions;
