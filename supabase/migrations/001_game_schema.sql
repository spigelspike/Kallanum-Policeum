-- ============================================================
-- Kallanum Policeum — Full Database Schema
-- Migration: 001_game_schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLE: rooms
-- ────────────────────────────────────────────────────────────
CREATE TABLE rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  host_id       UUID NOT NULL,
  phase         TEXT NOT NULL DEFAULT 'WAITING',
  current_round INT NOT NULL DEFAULT 1,
  total_rounds  INT NOT NULL DEFAULT 3,
  max_players   INT NOT NULL DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

-- ────────────────────────────────────────────────────────────
-- TABLE: room_players
-- ────────────────────────────────────────────────────────────
CREATE TABLE room_players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL,
  username     TEXT NOT NULL,
  score        INT NOT NULL DEFAULT 0,
  is_connected BOOLEAN DEFAULT TRUE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

-- ────────────────────────────────────────────────────────────
-- TABLE: player_roles
-- ────────────────────────────────────────────────────────────
CREATE TABLE player_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL,
  round_number INT NOT NULL,
  role         TEXT NOT NULL,
  role_points  INT NOT NULL DEFAULT 0,
  UNIQUE(room_id, player_id, round_number)
);

-- ────────────────────────────────────────────────────────────
-- TABLE: round_results
-- ────────────────────────────────────────────────────────────
CREATE TABLE round_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_number  INT NOT NULL,
  police_id     UUID NOT NULL,
  thief_id      UUID NOT NULL,
  accused_id    UUID NOT NULL,
  correct_guess BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: rate_limits
-- ────────────────────────────────────────────────────────────
CREATE TABLE rate_limits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL,
  action       TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- RLS: rooms
-- ────────────────────────────────────────────────────────────
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Players can only see rooms they have joined
CREATE POLICY "rooms_select_policy"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = rooms.id
        AND room_players.player_id = auth.uid()
    )
  );

-- Only service role can insert rooms
CREATE POLICY "rooms_insert_policy"
  ON rooms FOR INSERT
  WITH CHECK (false);

-- Only service role can update rooms
CREATE POLICY "rooms_update_policy"
  ON rooms FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ────────────────────────────────────────────────────────────
-- RLS: room_players
-- ────────────────────────────────────────────────────────────
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Players can see all players in rooms they belong to
CREATE POLICY "room_players_select_policy"
  ON room_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players AS rp
      WHERE rp.room_id = room_players.room_id
        AND rp.player_id = auth.uid()
    )
  );

-- Only service role can insert players
CREATE POLICY "room_players_insert_policy"
  ON room_players FOR INSERT
  WITH CHECK (false);

-- Only service role can update players
CREATE POLICY "room_players_update_policy"
  ON room_players FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ────────────────────────────────────────────────────────────
-- RLS: player_roles
-- ────────────────────────────────────────────────────────────
ALTER TABLE player_roles ENABLE ROW LEVEL SECURITY;

-- Players can only read their own role assignments
CREATE POLICY "player_roles_select_policy"
  ON player_roles FOR SELECT
  USING (player_id = auth.uid());

-- Only service role can insert roles
CREATE POLICY "player_roles_insert_policy"
  ON player_roles FOR INSERT
  WITH CHECK (false);

-- ────────────────────────────────────────────────────────────
-- RLS: round_results
-- ────────────────────────────────────────────────────────────
ALTER TABLE round_results ENABLE ROW LEVEL SECURITY;

-- Players can see results for rooms they belong to
CREATE POLICY "round_results_select_policy"
  ON round_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = round_results.room_id
        AND room_players.player_id = auth.uid()
    )
  );

-- Only service role can insert results
CREATE POLICY "round_results_insert_policy"
  ON round_results FOR INSERT
  WITH CHECK (false);

-- ────────────────────────────────────────────────────────────
-- RLS: rate_limits
-- ────────────────────────────────────────────────────────────
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Players can only see their own rate limit entries
CREATE POLICY "rate_limits_select_policy"
  ON rate_limits FOR SELECT
  USING (player_id = auth.uid());

-- Only service role can insert rate limit entries
CREATE POLICY "rate_limits_insert_policy"
  ON rate_limits FOR INSERT
  WITH CHECK (false);


-- ============================================================
-- REALTIME
-- Enable Realtime subscriptions on rooms and room_players
-- so clients receive live updates via Supabase channels.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
