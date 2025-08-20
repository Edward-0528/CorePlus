-- Create meals table for storing user meal history
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_name VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(8,2) DEFAULT 0,
    fat DECIMAL(8,2) DEFAULT 0,
    meal_method VARCHAR(50) DEFAULT 'manual', -- 'photo', 'search', 'barcode', 'manual'
    meal_type VARCHAR(50) DEFAULT 'meal', -- 'breakfast', 'lunch', 'dinner', 'snack', 'meal'
    portion_description TEXT,
    image_uri TEXT,
    confidence_score DECIMAL(3,2), -- For AI predictions (0.00 to 1.00)
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own meals
CREATE POLICY "Users can view their own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own meals
CREATE POLICY "Users can insert their own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own meals
CREATE POLICY "Users can update their own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own meals
CREATE POLICY "Users can delete their own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_created ON public.meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(meal_date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meals_updated_at 
    BEFORE UPDATE ON public.meals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for daily meal summaries
CREATE OR REPLACE VIEW public.daily_meal_summary AS
SELECT 
    user_id,
    meal_date,
    COUNT(*) as meal_count,
    SUM(calories) as total_calories,
    SUM(carbs) as total_carbs,
    SUM(protein) as total_protein,
    SUM(fat) as total_fat,
    array_agg(meal_name ORDER BY meal_time) as meals
FROM public.meals 
GROUP BY user_id, meal_date
ORDER BY meal_date DESC;
