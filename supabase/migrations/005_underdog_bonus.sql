-- ============================================================
-- WC26 Predictions — Underdog Bonus
-- ============================================================
-- Run manually in the Supabase SQL Editor. Modifies scoring so
-- that predictions matching the correct outcome AGAINST at least
-- 70% consensus get their base points doubled BEFORE the stake
-- multiplier is applied. This creates strategic depth: going with
-- the crowd is safe, going against is high-risk high-reward.
--
-- Also credits +20 XP under source 'underdog' for the first
-- underdog win per prediction.
--
-- Roll back with: re-apply the score_single_prediction from 001.
-- ============================================================

BEGIN;

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
  v_actual_outcome TEXT;
  v_total_preds INTEGER := 0;
  v_agree_preds INTEGER := 0;
  v_underdog BOOLEAN := false;
BEGIN
  SELECT * INTO v_pred
  FROM public.predictions
  WHERE id = p_prediction_id AND scored = false;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_mult := COALESCE(v_pred.stake_multiplier, 1);

  -- Determine the actual outcome for the match — used for consensus.
  IF p_actual_home > p_actual_away THEN v_actual_outcome := 'home';
  ELSIF p_actual_home < p_actual_away THEN v_actual_outcome := 'away';
  ELSE v_actual_outcome := 'draw';
  END IF;

  -- Correct outcome check (1 base point OR 3 for exact).
  IF v_pred.home_prediction = p_actual_home
     AND v_pred.away_prediction = p_actual_away THEN
    v_base := 3;
  ELSIF (
    (v_pred.home_prediction > v_pred.away_prediction AND p_actual_home > p_actual_away) OR
    (v_pred.home_prediction < v_pred.away_prediction AND p_actual_home < p_actual_away) OR
    (v_pred.home_prediction = v_pred.away_prediction AND p_actual_home = p_actual_away)
  ) THEN
    v_base := 1;
  ELSE
    v_base := 0;
  END IF;

  -- Underdog bonus: if the user was correct AND at least 70% of the
  -- other predictions went the OTHER way, double the base.
  IF v_base > 0 THEN
    SELECT COUNT(*),
           COUNT(*) FILTER (
             WHERE (
               (v_actual_outcome = 'home' AND home_prediction > away_prediction) OR
               (v_actual_outcome = 'away' AND home_prediction < away_prediction) OR
               (v_actual_outcome = 'draw' AND home_prediction = away_prediction)
             )
           )
      INTO v_total_preds, v_agree_preds
      FROM public.predictions
     WHERE match_id = v_pred.match_id
       AND id <> v_pred.id;

    -- Only consider the bonus when we have enough peers to define a
    -- consensus (>= 5 other predictions). Small samples are noisy.
    IF v_total_preds >= 5
       AND v_agree_preds::float / v_total_preds <= 0.30 THEN
      v_underdog := true;
      v_base := v_base * 2;
    END IF;
  END IF;

  IF v_base > 0 THEN
    v_points := v_base * v_mult;
  ELSE
    v_points := -(v_mult - 1);
  END IF;

  UPDATE public.predictions
     SET points_earned = v_points,
         scored = true,
         updated_at = now()
   WHERE id = p_prediction_id;

  -- +20 XP for the underdog moment (award_xp is idempotent by ref).
  IF v_underdog THEN
    PERFORM public.award_xp(
      v_pred.user_id, 20, 'underdog', p_prediction_id::text, NULL
    );
  END IF;

  RETURN v_points;
END;
$$;

COMMIT;

-- Verify with a match that already scored:
--   SELECT id, home_prediction, away_prediction, points_earned,
--          stake_multiplier
--     FROM public.predictions
--    WHERE match_id = '<a-finished-match-id>'
--    ORDER BY points_earned DESC;
