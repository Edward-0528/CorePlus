-- Stores individual workouts for a plan (week/day granularity)

CREATE TABLE IF NOT EXISTS plan_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  day_of_week integer NOT NULL,
  workout_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_workouts_plan_id ON plan_workouts (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_workouts_plan_week_day ON plan_workouts (plan_id, week_number, day_of_week);
