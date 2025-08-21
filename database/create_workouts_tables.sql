-- Workout tracking tables for Core+ app

-- 1. Workout Templates/Plans table
CREATE TABLE workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'strength', 'cardio', 'flexibility', 'hiit', etc.
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  estimated_duration INTEGER, -- in minutes
  calories_per_minute DECIMAL(4,2), -- estimated calories burned per minute
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Exercise library table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  muscle_groups TEXT[], -- array of muscle groups: ['chest', 'shoulders', 'triceps']
  equipment VARCHAR(255), -- 'bodyweight', 'dumbbells', 'barbell', etc.
  difficulty_level VARCHAR(50),
  instructions TEXT,
  video_url VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Workout template exercises (junction table)
CREATE TABLE workout_template_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER, -- for time-based exercises
  rest_seconds INTEGER,
  weight_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User completed workouts
CREATE TABLE completed_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES workout_templates(id),
  workout_name VARCHAR(255) NOT NULL,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in minutes
  calories_burned INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Individual exercise performances within a workout
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  completed_workout_id UUID REFERENCES completed_workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight_kg DECIMAL(5,2),
  target_duration_seconds INTEGER,
  actual_reps INTEGER[],  -- array of reps per set: [12, 10, 8]
  actual_weight_kg DECIMAL(5,2)[],  -- array of weights per set
  actual_duration_seconds INTEGER[],  -- array of durations per set
  rest_time_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User workout streaks and stats
CREATE TABLE user_workout_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_workout_time INTEGER DEFAULT 0, -- in minutes
  total_calories_burned INTEGER DEFAULT 0,
  favorite_workout_type VARCHAR(100),
  last_workout_date DATE,
  weekly_goal INTEGER DEFAULT 3, -- workouts per week
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Workout templates - public read, admin write
CREATE POLICY "Public workout templates are viewable by everyone" ON workout_templates
    FOR SELECT USING (true);

-- Exercises - public read, admin write  
CREATE POLICY "Public exercises are viewable by everyone" ON exercises
    FOR SELECT USING (true);

-- Workout template exercises - public read, admin write
CREATE POLICY "Public workout template exercises are viewable by everyone" ON workout_template_exercises
    FOR SELECT USING (true);

-- Completed workouts - users can only see their own
CREATE POLICY "Users can view own completed workouts" ON completed_workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed workouts" ON completed_workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completed workouts" ON completed_workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed workouts" ON completed_workouts
    FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises - users can only see their own
CREATE POLICY "Users can view own workout exercises" ON workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM completed_workouts 
            WHERE completed_workouts.id = workout_exercises.completed_workout_id 
            AND completed_workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own workout exercises" ON workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM completed_workouts 
            WHERE completed_workouts.id = workout_exercises.completed_workout_id 
            AND completed_workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own workout exercises" ON workout_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM completed_workouts 
            WHERE completed_workouts.id = workout_exercises.completed_workout_id 
            AND completed_workouts.user_id = auth.uid()
        )
    );

-- User workout stats - users can only see their own
CREATE POLICY "Users can view own workout stats" ON user_workout_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout stats" ON user_workout_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout stats" ON user_workout_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_completed_workouts_user_date ON completed_workouts(user_id, workout_date DESC);
CREATE INDEX idx_completed_workouts_user_id ON completed_workouts(user_id);
CREATE INDEX idx_workout_exercises_completed_workout ON workout_exercises(completed_workout_id);
CREATE INDEX idx_workout_template_exercises_template ON workout_template_exercises(workout_template_id);

-- Functions to update user stats automatically
CREATE OR REPLACE FUNCTION update_user_workout_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats when a workout is completed
    IF NEW.completed = true THEN
        INSERT INTO user_workout_stats (user_id, total_workouts, total_workout_time, total_calories_burned, last_workout_date)
        VALUES (NEW.user_id, 1, COALESCE(NEW.total_duration, 0), COALESCE(NEW.calories_burned, 0), NEW.workout_date)
        ON CONFLICT (user_id) DO UPDATE SET
            total_workouts = user_workout_stats.total_workouts + 1,
            total_workout_time = user_workout_stats.total_workout_time + COALESCE(NEW.total_duration, 0),
            total_calories_burned = user_workout_stats.total_calories_burned + COALESCE(NEW.calories_burned, 0),
            last_workout_date = NEW.workout_date,
            updated_at = NOW();
            
        -- Update streak logic would go here (simplified for now)
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats
CREATE TRIGGER update_workout_stats_trigger
    AFTER INSERT OR UPDATE ON completed_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_workout_stats();

-- Sample data insertion (optional)
INSERT INTO workout_templates (name, description, category, difficulty_level, estimated_duration, calories_per_minute) VALUES
('Push Day', 'Upper body pushing muscles workout', 'strength', 'intermediate', 45, 8.5),
('Pull Day', 'Upper body pulling muscles workout', 'strength', 'intermediate', 45, 8.5),
('Leg Day', 'Lower body strength training', 'strength', 'intermediate', 60, 9.0),
('HIIT Cardio', 'High intensity interval training', 'cardio', 'advanced', 30, 12.0),
('Yoga Flow', 'Flexibility and mindfulness', 'flexibility', 'beginner', 30, 3.5);

INSERT INTO exercises (name, description, muscle_groups, equipment, difficulty_level) VALUES
('Push-ups', 'Classic bodyweight chest exercise', ARRAY['chest', 'shoulders', 'triceps'], 'bodyweight', 'beginner'),
('Pull-ups', 'Upper body pulling exercise', ARRAY['back', 'biceps'], 'pull-up bar', 'intermediate'),
('Squats', 'Lower body compound movement', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'bodyweight', 'beginner'),
('Deadlifts', 'Full body compound movement', ARRAY['hamstrings', 'glutes', 'back'], 'barbell', 'intermediate'),
('Plank', 'Core stability exercise', ARRAY['core', 'shoulders'], 'bodyweight', 'beginner');
