-- Step-by-step subscription setup for Supabase
-- Run each section separately to identify any issues

-- STEP 1: Check if auth.users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- STEP 2: Clean up existing tables (run only if needed)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS ai_scan_usage CASCADE;
DROP TABLE IF EXISTS daily_usage CASCADE;

-- STEP 3: Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- STEP 4: Create subscription_events table
CREATE TABLE subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 5: Create ai_scan_usage table
CREATE TABLE ai_scan_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 6: Create daily_usage table
CREATE TABLE daily_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name, usage_date)
);

-- STEP 7: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 9: Create policies for subscription_events
CREATE POLICY "Users can view own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscription events" ON subscription_events
    FOR INSERT WITH CHECK (true);

-- STEP 10: Create policies for ai_scan_usage
CREATE POLICY "Users can view own AI scan usage" ON ai_scan_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI scan usage" ON ai_scan_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 11: Create policies for daily_usage
CREATE POLICY "Users can view own daily usage" ON daily_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily usage" ON daily_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily usage" ON daily_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- STEP 12: Create helper functions
CREATE OR REPLACE FUNCTION increment_daily_usage(feature_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage (user_id, feature_name, usage_date, usage_count)
    VALUES (auth.uid(), feature_name, CURRENT_DATE, 1)
    ON CONFLICT (user_id, feature_name, usage_date)
    DO UPDATE SET
        usage_count = daily_usage.usage_count + 1,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_daily_usage_limit(feature_name TEXT, max_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
BEGIN
    SELECT COALESCE(usage_count, 0)
    INTO current_usage
    FROM daily_usage
    WHERE user_id = auth.uid()
        AND feature_name = check_daily_usage_limit.feature_name
        AND usage_date = CURRENT_DATE;
    
    RETURN current_usage < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_usage_user_id_date ON ai_scan_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_feature_date ON daily_usage(user_id, feature_name, usage_date);

-- STEP 14: Verify tables were created successfully
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'subscription_events', 'ai_scan_usage', 'daily_usage')
ORDER BY table_name;
