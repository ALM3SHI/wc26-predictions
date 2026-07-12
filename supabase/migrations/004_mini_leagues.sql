-- ============================================================
-- WC26 Predictions — Mini-Leagues (private friend leagues)
-- ============================================================
-- Run manually in the Supabase SQL Editor. Adds:
--
--   1. public.leagues         — league metadata + invite code
--   2. public.league_members  — who is in what league
--
-- Standings are computed on-read by joining league_members with
-- profiles.total_points; no denorm table needed at this scale.
--
-- Roll back with:
--   DROP TABLE public.league_members;
--   DROP TABLE public.leagues;
-- ============================================================

BEGIN;

-- 1. Leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,            -- 6-char human-typable invite
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 40),
  emoji TEXT,                           -- optional decorator
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leagues_owner_idx ON public.leagues(owner_id);

COMMENT ON TABLE public.leagues IS
  'Private friend leagues. Anyone with the code can join.';

-- 2. Members
CREATE TABLE IF NOT EXISTS public.league_members (
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (league_id, user_id)
);

CREATE INDEX IF NOT EXISTS league_members_user_idx
  ON public.league_members(user_id);

-- 3. Invite code generator — 6-char base32-like (no confusing chars)
CREATE OR REPLACE FUNCTION public.gen_league_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out TEXT := '';
  i INTEGER;
  attempt INTEGER := 0;
BEGIN
  LOOP
    out := '';
    FOR i IN 1..6 LOOP
      out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    -- Bail if collision — retry up to 10 times, then bubble up so the
    -- API surfaces a real error rather than silently duping.
    IF NOT EXISTS (SELECT 1 FROM public.leagues WHERE code = out) THEN
      RETURN out;
    END IF;
    attempt := attempt + 1;
    IF attempt > 10 THEN
      RAISE EXCEPTION 'Unable to generate a unique league code after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 4. RPC helpers used by the API (SECURITY DEFINER so they can maintain
-- member_count consistently even when RLS would block direct updates).

-- create_league(name, emoji) → { id, code }
CREATE OR REPLACE FUNCTION public.create_league(
  p_name TEXT,
  p_emoji TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'League name too short';
  END IF;

  v_code := public.gen_league_code();

  INSERT INTO public.leagues (code, name, emoji, owner_id, member_count)
    VALUES (v_code, trim(p_name), p_emoji, v_uid, 1)
    RETURNING leagues.id INTO v_id;

  INSERT INTO public.league_members (league_id, user_id)
    VALUES (v_id, v_uid);

  RETURN QUERY SELECT v_id, v_code;
END;
$$;

-- join_league(code) → league_id (idempotent — no error if already a member)
CREATE OR REPLACE FUNCTION public.join_league(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_inserted INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_id FROM public.leagues WHERE code = upper(trim(p_code));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'League not found';
  END IF;

  INSERT INTO public.league_members (league_id, user_id)
    VALUES (v_id, v_uid)
    ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 1 THEN
    UPDATE public.leagues
       SET member_count = member_count + 1,
           updated_at = now()
     WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- leave_league(league_id) — owner cannot leave; they must delete instead.
CREATE OR REPLACE FUNCTION public.leave_league(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_owner UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT owner_id INTO v_owner FROM public.leagues WHERE id = p_league_id;
  IF v_owner IS NULL THEN RETURN false; END IF;
  IF v_owner = v_uid THEN
    RAISE EXCEPTION 'Owner cannot leave; delete the league instead';
  END IF;

  DELETE FROM public.league_members
   WHERE league_id = p_league_id AND user_id = v_uid;

  UPDATE public.leagues
     SET member_count = GREATEST(0, member_count - 1),
         updated_at = now()
   WHERE id = p_league_id;

  RETURN true;
END;
$$;

-- 5. RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

-- Leagues: any member can read; only the owner can update / delete.
DROP POLICY IF EXISTS "Leagues: read for members" ON public.leagues;
CREATE POLICY "Leagues: read for members"
  ON public.leagues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
       WHERE lm.league_id = leagues.id AND lm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Leagues: owner update" ON public.leagues;
CREATE POLICY "Leagues: owner update"
  ON public.leagues FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Leagues: owner delete" ON public.leagues;
CREATE POLICY "Leagues: owner delete"
  ON public.leagues FOR DELETE
  USING (auth.uid() = owner_id);

-- Members: any league member can read the roster; writes go through
-- the RPC functions so we don't need per-row insert policies from
-- the browser.
DROP POLICY IF EXISTS "Members: read for co-members" ON public.league_members;
CREATE POLICY "Members: read for co-members"
  ON public.league_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
       WHERE lm.league_id = league_members.league_id
         AND lm.user_id = auth.uid()
    )
  );

COMMIT;

-- Verify:
--   SELECT * FROM public.leagues;
--   SELECT count(*) FROM public.league_members;
