// Database types matching the Supabase schema
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  is_admin?: boolean;
  push_subscription: PushSubscriptionJSON | null;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  api_fixture_id: number;
  round: MatchRound;
  home_team: string;
  away_team: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  start_time: string;
  status: MatchStatus;
  venue: string | null;
  scored: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  home_prediction: number;
  away_prediction: number;
  points_earned: number;
  scored: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  total_predictions: number;
  exact_scores: number;
  correct_outcomes: number;
  wrong_predictions: number;
  rank: number;
}

export type MatchRound =
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | '3rd Place'
  | 'Final';

export type MatchStatus =
  | 'TBD'
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'ET'
  | 'BT'
  | 'P'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'PST'
  | 'CANC';

// ---------------------------------------------------------------------------
// API-Football response types (only what we need — score-only fetching)
// ---------------------------------------------------------------------------

export interface APIFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    venue: { name: string; city: string } | null;
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

// ---------------------------------------------------------------------------
// Utility types & constants
// ---------------------------------------------------------------------------

export type MatchWithPrediction = Match & {
  prediction?: Prediction | null;
};

export const MATCH_ROUNDS_ORDER: MatchRound[] = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  '3rd Place',
  'Final',
];

export const FINISHED_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN'];
export const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'BT', 'P'];
export const SCHEDULED_STATUSES: MatchStatus[] = ['TBD', 'NS'];
