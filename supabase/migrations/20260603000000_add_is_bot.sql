-- Add bot flag to room_players for Quick Play feature
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
