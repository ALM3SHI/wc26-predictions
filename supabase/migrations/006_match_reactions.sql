-- ============================================================
-- WC26 Predictions — Live Match Reactions (emoji rain)
-- ============================================================
-- Run manually in the Supabase SQL Editor. Adds:
--
--   1. public.match_reactions — append-only stream of emoji sent
--      by users during a live match.
--   2. Realtime publication toggle so Supabase Realtime streams
--      new rows to subscribed clients.
--   3. RLS: anyone signed in can insert their own reaction and
--      read reactions for any match. Reactions are inherently
--      public — think tweets, not DMs.
--   4. A trimming trigger so we don't accumulate millions of
--      rows — keep only the last 500 reactions per match.
--
-- Roll back with:
--   DROP TRIGGER IF EXISTS match_reactions_trim ON public.match_reactions;
--   DROP FUNCTION IF EXISTS public.match_reactions_trim;
--   DROP TABLE public.match_reactions;
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.match_reactions (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (length(emoji) BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_reactions_match_created_idx
  ON public.match_reactions(match_id, created_at DESC);

COMMENT ON TABLE public.match_reactions IS
  'Live emoji reactions during matches. Trimmed to the last 500 rows per match.';

-- Enable Realtime for this table so clients can subscribe.
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_reactions;

-- Row-level security
ALTER TABLE public.match_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions: public read" ON public.match_reactions;
CREATE POLICY "Reactions: public read"
  ON public.match_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Reactions: authed insert" ON public.match_reactions;
CREATE POLICY "Reactions: authed insert"
  ON public.match_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trim old reactions so the table stays bounded per match.
CREATE OR REPLACE FUNCTION public.match_reactions_trim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.match_reactions
   WHERE match_id = NEW.match_id
     AND id NOT IN (
       SELECT id FROM public.match_reactions
        WHERE match_id = NEW.match_id
        ORDER BY id DESC
        LIMIT 500
     );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS match_reactions_trim ON public.match_reactions;
CREATE TRIGGER match_reactions_trim
  AFTER INSERT ON public.match_reactions
  FOR EACH ROW EXECUTE FUNCTION public.match_reactions_trim();

-- Basic rate-limit safety: no more than 20 reactions per user per
-- minute per match. Enforced via a BEFORE INSERT trigger that raises.
CREATE OR REPLACE FUNCTION public.match_reactions_ratelimit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_recent INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent
    FROM public.match_reactions
   WHERE match_id = NEW.match_id
     AND user_id = NEW.user_id
     AND created_at > now() - interval '1 minute';

  IF v_recent >= 20 THEN
    RAISE EXCEPTION 'Slow down' USING ERRCODE = '429';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS match_reactions_ratelimit ON public.match_reactions;
CREATE TRIGGER match_reactions_ratelimit
  BEFORE INSERT ON public.match_reactions
  FOR EACH ROW EXECUTE FUNCTION public.match_reactions_ratelimit();

COMMIT;

-- Verify with:
--   INSERT INTO public.match_reactions (match_id, user_id, emoji)
--     VALUES ('<a-match-id>', auth.uid(), '🔥');
