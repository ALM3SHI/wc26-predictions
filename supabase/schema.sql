-- ============================================================
-- WC26 PREDICTIONS — COMPLETE SUPABASE SCHEMA
-- ============================================================
-- Run this entire file in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- It creates all tables, indexes, RLS policies, functions, triggers, and views.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- PROFILES — extends Supabase auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  push_subscription JSONB,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles with display name, points, and notification preferences.';

-- MATCHES — World Cup 2026 knockout fixtures
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_fixture_id INTEGER UNIQUE NOT NULL,
  round TEXT NOT NULL,                  -- 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', '3rd Place', 'Final'
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  home_score INTEGER,
  away_score INTEGER,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'NS',    -- NS, 1H, HT, 2H, ET, BT, P, FT, AET, PEN
  venue TEXT,
  scored BOOLEAN NOT NULL DEFAULT false, -- whether predictions have been scored for this match
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.matches IS 'World Cup 2026 knockout stage fixtures synced from API-Football.';
COMMENT ON COLUMN public.matches.status IS 'Match status codes: NS=Not Started, 1H=First Half, HT=Half Time, 2H=Second Half, ET=Extra Time, BT=Break Time, P=Penalties, FT=Full Time, AET=After Extra Time, PEN=After Penalties';
COMMENT ON COLUMN public.matches.scored IS 'True once all predictions for this match have been scored.';

-- PREDICTIONS — user score predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_prediction INTEGER NOT NULL CHECK (home_prediction >= 0 AND home_prediction <= 20),
  away_prediction INTEGER NOT NULL CHECK (away_prediction >= 0 AND away_prediction <= 20),
  points_earned INTEGER NOT NULL DEFAULT 0,
  scored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

COMMENT ON TABLE public.predictions IS 'User predictions for match scores. One prediction per user per match.';
COMMENT ON COLUMN public.predictions.points_earned IS '3 = exact score, 1 = correct outcome (winner/draw), 0 = wrong.';

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_matches_start_time ON public.matches(start_time);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_round ON public.matches(round);
CREATE INDEX idx_matches_scored ON public.matches(scored) WHERE scored = false;
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX idx_predictions_match_user ON public.predictions(match_id, user_id);
CREATE INDEX idx_predictions_unscored ON public.predictions(match_id) WHERE scored = false;
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY (Anti-Cheat)
-- ============================================================

-- ---- PROFILES ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (for leaderboard)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile (display_name, avatar, notification prefs)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- MATCHES ----
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Everyone can read matches
CREATE POLICY "matches_select_all"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert/update/delete matches (via API routes)
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- ---- PREDICTIONS (Core Anti-Cheat Logic) ----
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Users can ALWAYS see their own predictions
CREATE POLICY "predictions_select_own"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can see OTHER users' predictions ONLY after match has started
-- This prevents peeking at predictions before kickoff
CREATE POLICY "predictions_select_after_kickoff"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
      AND now() >= m.start_time
    )
  );

-- Users can INSERT predictions ONLY before the match starts
CREATE POLICY "predictions_insert_before_kickoff"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND now() < m.start_time
    )
  );

-- Users can UPDATE their predictions ONLY before the match starts
CREATE POLICY "predictions_update_before_kickoff"
  ON public.predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
      AND now() < m.start_time
    )
  );

-- No deletes allowed — predictions are permanent
CREATE POLICY "predictions_no_delete"
  ON public.predictions FOR DELETE
  TO authenticated
  USING (false);


-- ============================================================
-- 4. DATABASE FUNCTIONS
-- ============================================================

-- ---- Auto-create profile on signup ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      'Player ' || LEFT(NEW.id::text, 6)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger: fire after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---- Score a single prediction ----
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
  v_points INTEGER := 0;
BEGIN
  SELECT * INTO v_pred
  FROM public.predictions
  WHERE id = p_prediction_id AND scored = false;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Exact score match = 3 points
  IF v_pred.home_prediction = p_actual_home
     AND v_pred.away_prediction = p_actual_away THEN
    v_points := 3;

  -- Correct outcome (winner or draw) = 1 point
  ELSIF (
    (v_pred.home_prediction > v_pred.away_prediction AND p_actual_home > p_actual_away) OR
    (v_pred.home_prediction < v_pred.away_prediction AND p_actual_home < p_actual_away) OR
    (v_pred.home_prediction = v_pred.away_prediction AND p_actual_home = p_actual_away)
  ) THEN
    v_points := 1;
  END IF;

  -- Update the prediction
  UPDATE public.predictions
  SET points_earned = v_points,
      scored = true,
      updated_at = now()
  WHERE id = p_prediction_id;

  RETURN v_points;
END;
$$;

-- ---- Score all predictions for a finished match ----
CREATE OR REPLACE FUNCTION public.score_match_predictions(p_match_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_pred RECORD;
  v_points INTEGER;
  v_total_scored INTEGER := 0;
BEGIN
  -- Get the match
  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;

  -- Only score finished matches
  IF v_match.status NOT IN ('FT', 'AET', 'PEN') THEN
    RAISE EXCEPTION 'Match % is not finished (status: %)', p_match_id, v_match.status;
  END IF;

  -- Skip if already scored
  IF v_match.scored = true THEN
    RETURN 0;
  END IF;

  -- Score each unscored prediction
  FOR v_pred IN
    SELECT * FROM public.predictions
    WHERE match_id = p_match_id AND scored = false
  LOOP
    v_points := public.score_single_prediction(
      v_pred.id,
      v_match.home_score,
      v_match.away_score
    );
    v_total_scored := v_total_scored + 1;
  END LOOP;

  -- Recalculate total_points for all affected users
  UPDATE public.profiles p
  SET total_points = COALESCE(
    (SELECT SUM(pr.points_earned) FROM public.predictions pr WHERE pr.user_id = p.id AND pr.scored = true),
    0
  ),
  updated_at = now()
  WHERE p.id IN (
    SELECT DISTINCT user_id FROM public.predictions WHERE match_id = p_match_id
  );

  -- Mark the match as scored
  UPDATE public.matches
  SET scored = true, updated_at = now()
  WHERE id = p_match_id;

  RETURN v_total_scored;
END;
$$;

-- ---- Auto-score trigger: fires when match status changes to finished ----
CREATE OR REPLACE FUNCTION public.on_match_finished()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status transitions TO a finished state
  IF NEW.status IN ('FT', 'AET', 'PEN')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('FT', 'AET', 'PEN'))
     AND NEW.home_score IS NOT NULL
     AND NEW.away_score IS NOT NULL
     AND NEW.scored = false
  THEN
    PERFORM public.score_match_predictions(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_match_finished
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.on_match_finished();


-- ============================================================
-- 5. LEADERBOARD VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  p.total_points,
  COUNT(pr.id)::INTEGER AS total_predictions,
  COUNT(CASE WHEN pr.points_earned = 3 THEN 1 END)::INTEGER AS exact_scores,
  COUNT(CASE WHEN pr.points_earned = 1 THEN 1 END)::INTEGER AS correct_outcomes,
  COUNT(CASE WHEN pr.scored = true AND pr.points_earned = 0 THEN 1 END)::INTEGER AS wrong_predictions,
  RANK() OVER (ORDER BY p.total_points DESC, COUNT(CASE WHEN pr.points_earned = 3 THEN 1 END) DESC)::INTEGER AS rank
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url, p.total_points
ORDER BY p.total_points DESC,
         COUNT(CASE WHEN pr.points_earned = 3 THEN 1 END) DESC;

-- Grant access to the leaderboard view
GRANT SELECT ON public.leaderboard TO authenticated;

-- ============================================================
-- 6. HELPER: Function to get users missing predictions
--    (Used by the reminder notification system)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_users_without_predictions(p_match_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  push_subscription JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.display_name,
    au.email,
    p.push_subscription
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN public.predictions pr ON pr.user_id = p.id AND pr.match_id = p_match_id
  WHERE pr.id IS NULL
    AND p.email_notifications = true;
END;
$$;


-- ============================================================
-- 7. REALTIME SUBSCRIPTIONS
-- ============================================================

-- Enable realtime for matches (live score updates) and profiles (leaderboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
-- After running this script:
-- 1. Verify tables in Table Editor
-- 2. Verify RLS policies in Authentication > Policies
-- 3. Test by inserting a match and prediction via the SQL Editor
-- ============================================================
