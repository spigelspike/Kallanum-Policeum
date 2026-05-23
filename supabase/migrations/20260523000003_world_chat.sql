-- Migration: World Chat tables & policies

-- 1. world_chat
CREATE TABLE world_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick loading of recent messages
CREATE INDEX world_chat_created_at_idx ON world_chat(created_at DESC);

-- RLS
ALTER TABLE world_chat ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "world_chat_select_policy"
  ON world_chat FOR SELECT
  USING (true);

-- Explicitly deny INSERT/UPDATE/DELETE from frontend. 
-- Only edge functions using service_role can write.

-- 2. world_chat_reports
CREATE TABLE world_chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES world_chat(id) ON DELETE CASCADE,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reporter_id, message_id) -- Prevent duplicate reports from same person
);

ALTER TABLE world_chat_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own report
CREATE POLICY "world_chat_reports_insert_policy"
  ON world_chat_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- 3. world_chat_blocked
CREATE TABLE world_chat_blocked (
  player_id UUID PRIMARY KEY,
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE world_chat_blocked ENABLE ROW LEVEL SECURITY;
-- No frontend access needed, only Edge Functions read/write this.


-- Cleanup pg_cron job: Delete messages older than 1 hour
-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run every 15 minutes
SELECT cron.schedule(
  'cleanup_world_chat',
  '*/15 * * * *',
  $$
    DELETE FROM world_chat WHERE created_at < NOW() - INTERVAL '1 hour';
  $$
);
