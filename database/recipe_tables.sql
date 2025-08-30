-- Recipe-related tables for the Core+ nutrition app

-- User favorite recipes
CREATE TABLE IF NOT EXISTS user_favorite_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    recipe_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- User recipe history (recently viewed recipes)
CREATE TABLE IF NOT EXISTS user_recipe_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    recipe_data JSONB NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- User available ingredients (pantry/fridge contents)
CREATE TABLE IF NOT EXISTS user_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ingredients ENABLE ROW LEVEL SECURITY;

-- Policies for user_favorite_recipes
CREATE POLICY "Users can view their own favorite recipes" ON user_favorite_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite recipes" ON user_favorite_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite recipes" ON user_favorite_recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite recipes" ON user_favorite_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_recipe_history
CREATE POLICY "Users can view their own recipe history" ON user_recipe_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipe history" ON user_recipe_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipe history" ON user_recipe_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipe history" ON user_recipe_history
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_ingredients
CREATE POLICY "Users can view their own ingredients" ON user_ingredients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients" ON user_ingredients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients" ON user_ingredients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients" ON user_ingredients
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_user_id ON user_favorite_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_created_at ON user_favorite_recipes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_recipe_history_user_id ON user_recipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_history_viewed_at ON user_recipe_history(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_ingredients_user_id ON user_ingredients(user_id);

-- Function to automatically update viewed_at timestamp for recipe history
CREATE OR REPLACE FUNCTION update_recipe_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.viewed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp update
CREATE TRIGGER trigger_update_recipe_history_timestamp
    BEFORE UPDATE ON user_recipe_history
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_history_timestamp();
