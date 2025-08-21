-- Creates a table to store workout plans per user
-- Run this in your Supabase SQL editor or psql connected to the database

CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  duration_weeks integer NOT NULL DEFAULT 12,
  plan_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans (user_id);
