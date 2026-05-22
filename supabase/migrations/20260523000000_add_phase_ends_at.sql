-- Migration: 002_add_phase_ends_at.sql

ALTER TABLE rooms
ADD COLUMN phase_ends_at TIMESTAMPTZ NULL;
