-- Migration to add phase_ends_at to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS phase_ends_at TIMESTAMPTZ;
