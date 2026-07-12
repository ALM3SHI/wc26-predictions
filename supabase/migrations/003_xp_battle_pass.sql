-- ============================================================
-- WC26 Predictions — XP + Battle Pass
-- ============================================================
-- Run manually in the Supabase SQL Editor. Adds:
--
--   1. public.xp_events                — append-only ledger of every
--                                        XP grant, deduped by
--                                        (user_id, source, source_ref).
--   2. profiles.xp_total               — denormalized running total.
--   3. profiles.current_tier           — cached tier (1-20).
--   4. award_xp(uid, amount, source,   — safe, idempotent grant helper.
--                source_ref, meta)
--   5. Trigger on predictions          — awards XP when a prediction
--      is scored: +5 for the pick, +10 for correct outcome, +25 for
--      exact score, +50 / +100 streak bonuses (server-computed).
--
-- Roll back with:
--   DROP TRIGGER  IF EXISTS predictions_xp_hook ON public.predictions;
--   DROP FUNCTION IF EXISTS public.predictions_xp_hook;
--   DROP FUNCTION IF EXISTS public.award_xp;
--   DROP TABLE    IF EXISTS public.xp_events;
--   ALTER TABLE public.profiles
--     DROP COLUMN xp_total,
--     DROP COLUMN current_tier;
-- ============================================================

BEGIN;

-- 1. XP ledger — every grant is a row. Never mutated once written.
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL, -- 'prediction' | 'exact' | 'outcome' | 'streak_5' | 'streak_10' | 'daily' | 'underdog' | 'meta_champion' | 'meta_gb'
  source_ref TEXT NOT NULL, -- prediction.id, YYYY-MM-DD for daily, etc.
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One event per (source, source_ref) per user. Makes award_xp safe
  -- to call repeatedly without double-crediting.
  UNIQUE (user_id, source, source_ref)
);

CREATE INDEX IF NOT EXISTS xp_events_user_idx
  ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS xp_events_created_idx
  ON public.xp_events(created_at DESC);

COMMENT ON TABLE public.xp_events IS
  'Append-only XP ledger. Deduped by (user_id, source, source_ref).';

-- 2. Profile denormalization — cheap reads on home + battle pass.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_tier INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.profiles.xp_total IS
  'Running XP total. Kept in sync by award_xp().';
COMMENT ON COLUMN public.profiles.current_tier IS
  'Battle Pass tier 1-20 the user has reached. Bumped by award_xp().';

-- 3. Tier thresholds — mirrored in TypeScript for the UI to render
-- future tiers, but the DB is the source of truth for eligibility.
CREATE OR REPLACE FUNCTION public.tier_for_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  -- Thresholds tuned for a ~5-week WC26: casuals reach ~T10,
  -- committed players reach T20 with sustained play + accuracy.
  SELECT CASE
    WHEN p_xp >= 1600 THEN 20
    WHEN p_xp >= 1400 THEN 19
    WHEN p_xp >= 1220 THEN 18
    WHEN p_xp >= 1060 THEN 17
    WHEN p_xp >= 920  THEN 16
    WHEN p_xp >= 800  THEN 15
    WHEN p_xp >= 700  THEN 14
    WHEN p_xp >= 610  THEN 13
    WHEN p_xp >= 530  THEN 12
    WHEN p_xp >= 460  THEN 11
    WHEN p_xp >= 400  THEN 10
    WHEN p_xp >= 340  THEN 9
    WHEN p_xp >= 285  THEN 8
    WHEN p_xp >= 235  THEN 7
    WHEN p_xp >= 190  THEN 6
    WHEN p_xp >= 150  THEN 5
    WHEN p_xp >= 115  THEN 4
    WHEN p_xp >= 80   THEN 3
    WHEN p_xp >= 45   THEN 2
    ELSE 1
  END;
$$;

-- 4. award_xp — idempotent grant that keeps profile totals in sync.
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_ref TEXT,
  p_meta JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_new_total INTEGER;
  v_new_tier INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- Idempotent: dedup on (user_id, source, source_ref).
  INSERT INTO public.xp_events (user_id, amount, source, source_ref, meta)
    VALUES (p_user_id, p_amount, p_source, p_source_ref, p_meta)
    ON CONFLICT (user_id, source, source_ref) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.profiles
     SET xp_total = xp_total + p_amount,
         current_tier = public.tier_for_xp(xp_total + p_amount),
         updated_at = now()
   WHERE id = p_user_id
   RETURNING xp_total, current_tier
    INTO v_new_total, v_new_tier;

  RETURN p_amount;
END;
$$;

COMMENT ON FUNCTION public.award_xp IS
  'Insert an XP event and update the denormalized total + tier. No-op if the (source, source_ref) pair already exists for the user.';

-- 5. Trigger on predictions — grants XP when a prediction transitions
-- from unscored to scored. Amounts:
--   +5   for making the pick   (source: 'prediction', ref: prediction.id)
--   +10  for correct outcome   (source: 'outcome',    ref: prediction.id)
--   +25  for exact score       (source: 'exact',      ref: prediction.id)
CREATE OR REPLACE FUNCTION public.predictions_xp_hook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when scored just flipped to true.
  IF NEW.scored IS TRUE AND (OLD.scored IS DISTINCT FROM TRUE) THEN
    -- Base: participation
    PERFORM public.award_xp(
      NEW.user_id, 5, 'prediction', NEW.id::text, NULL
    );

    -- Correct outcome (any non-zero base points_earned)
    IF NEW.points_earned > 0 THEN
      PERFORM public.award_xp(
        NEW.user_id, 10, 'outcome', NEW.id::text, NULL
      );
    END IF;

    -- Exact score bonus. score_single_prediction sets points_earned
    -- to 3 * stake_multiplier for exacts; check against >= 3 to catch
    -- any multiplier variant.
    IF NEW.points_earned >= 3 AND EXISTS (
      SELECT 1 FROM public.predictions
       WHERE id = NEW.id
         AND home_prediction = (SELECT home_score FROM public.matches WHERE id = NEW.match_id)
         AND away_prediction = (SELECT away_score FROM public.matches WHERE id = NEW.match_id)
    ) THEN
      PERFORM public.award_xp(
        NEW.user_id, 25, 'exact', NEW.id::text, NULL
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS predictions_xp_hook ON public.predictions;
CREATE TRIGGER predictions_xp_hook
  AFTER UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.predictions_xp_hook();

-- 6. RLS — users read only their own ledger. Writes go through the
-- SECURITY DEFINER function above, never through direct INSERTs.
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp: read own" ON public.xp_events;
CREATE POLICY "xp: read own"
  ON public.xp_events
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Backfill: recompute xp_total for any existing scored predictions
-- so early users don't start at zero when the migration lands.
DO $$
DECLARE
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT id, user_id, points_earned
      FROM public.predictions
     WHERE scored = true
  LOOP
    PERFORM public.award_xp(v_row.user_id, 5, 'prediction', v_row.id::text, NULL);
    IF v_row.points_earned > 0 THEN
      PERFORM public.award_xp(v_row.user_id, 10, 'outcome', v_row.id::text, NULL);
    END IF;
    IF v_row.points_earned >= 3 THEN
      PERFORM public.award_xp(v_row.user_id, 25, 'exact', v_row.id::text, NULL);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Verify:
--   SELECT id, xp_total, current_tier FROM public.profiles ORDER BY xp_total DESC LIMIT 20;
--   SELECT source, SUM(amount) FROM public.xp_events GROUP BY 1;
