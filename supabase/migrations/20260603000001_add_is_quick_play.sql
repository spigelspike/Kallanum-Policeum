-- Add is_quick_play flag to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_quick_play BOOLEAN DEFAULT FALSE;
