-- ============================================================
-- WC26 Predictions — OPTIONAL Server-Side Gamble Stake
-- ============================================================
-- This migration is NOT applied automatically. Run it manually in the
-- Supabase SQL Editor when you want gambling to affect the GLOBAL
-- leaderboard (not just each user's on-device ledger).
--
-- After running this file, open src/lib/gamble.ts and set:
--     export const SERVER_STAKE_ENABLED = true;
-- and (if you also want the DB to store the stake picked at submit)
-- extend the upsert payload in PredictionForm.tsx to include
-- `stake_multiplier: selectedStake.mult`.
--
-- What this does:
--   1. Adds a `stake_multiplier` column to public.predictions
--      (integer 1|2|3|5, default 1, so existing rows keep working).
--   2. Replaces score_single_prediction() so that on a win the
--      awarded points are multiplied by stake_multiplier, and on a
--      wrong pick the profile loses (stake_multiplier - 1) points.
--   3. Existing predictions and the leaderboard view keep working —
--      old rows default to 1x and behave exactly as before.
--
-- Roll back with:
--   ALTER TABLE public.predictions DROP COLUMN stake_multiplier;
--   -- then re-run the original score_single_prediction from schema.sql
-- ============================================================

BEGIN;

-- 1. Add the column with a safe default so no existing row breaks.
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS stake_multiplier INTEGER NOT NULL DEFAULT 1
    CHECK (stake_multiplier IN (1, 2, 3, 5));

COMMENT ON COLUMN public.predictions.stake_multiplier IS
  'Chip staked at prediction time. 1x safe, 2x bold, 3x legend, 5x all-in.';

-- 2. Replace the scoring function to respect stake_multiplier.
CREATE OR REPLACE FUNCTION public.score_single_prediction(
  p_prediction_id UUID,
  p_actual_home INTEGER,
  p_actual_away INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pred RECORD;
  v_base INTEGER := 0;
  v_points INTEGER := 0;
  v_mult INTEGER := 1;
BEGIN
  SELECT * INTO v_pred
  FROM public.predictions
  WHERE id = p_prediction_id AND scored = false;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_mult := COALESCE(v_pred.stake_multiplier, 1);

  -- Exact score match = 3 base points
  IF v_pred.home_prediction = p_actual_home
     AND v_pred.away_prediction = p_actual_away THEN
    v_base := 3;

  -- Correct outcome (winner or draw) = 1 base point
  ELSIF (
    (v_pred.home_prediction > v_pred.away_prediction AND p_actual_home > p_actual_away) OR
    (v_pred.home_prediction < v_pred.away_prediction AND p_actual_home < p_actual_away) OR
    (v_pred.home_prediction = v_pred.away_prediction AND p_actual_home = p_actual_away)
  ) THEN
    v_base := 1;
  ELSE
    v_base := 0;
  END IF;

  IF v_base > 0 THEN
    v_points := v_base * v_mult;
  ELSE
    -- Wrong pick → lose (mult - 1) points (0 for safe stake)
    v_points := -(v_mult - 1);
  END IF;

  UPDATE public.predictions
  SET points_earned = v_points,
      scored = true,
      updated_at = now()
  WHERE id = p_prediction_id;

  RETURN v_points;
END;
$$;

COMMIT;

-- Verify:
--   SELECT stake_multiplier, COUNT(*) FROM public.predictions GROUP BY 1;
--   -- Should show 1x for every existing row.
