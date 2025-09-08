-- User profiles table to store subscription data
-- Drop existing table if it exists without proper structure
DROP TABLE IF EXISTS user_profiles CASCADE;

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

-- Subscription events table for analytics
DROP TABLE IF EXISTS subscription_events CASCADE;

CREATE TABLE subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'purchased', 'expired', 'cancelled', etc.
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI scan usage tracking for free users
DROP TABLE IF EXISTS ai_scan_usage CASCADE;

CREATE TABLE ai_scan_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily usage tracking (generic table for various features)
DROP TABLE IF EXISTS daily_usage CASCADE;

CREATE TABLE daily_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name, usage_date)
);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for subscription_events
CREATE POLICY "Users can view own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscription events" ON subscription_events
    FOR INSERT WITH CHECK (true); -- Allow system to insert events

-- Policies for ai_scan_usage
CREATE POLICY "Users can view own AI scan usage" ON ai_scan_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI scan usage" ON ai_scan_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for daily_usage
CREATE POLICY "Users can view own daily usage" ON daily_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily usage" ON daily_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily usage" ON daily_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions to help with usage tracking
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

-- Function to check daily usage limit
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_usage_user_id_date ON ai_scan_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_feature_date ON daily_usage(user_id, feature_name, usage_date);
