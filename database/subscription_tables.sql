-- Core+ Subscription Management Tables

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
    subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired', 'trial')),
    subscription_product_id TEXT,
    subscription_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Daily feature usage tracking
CREATE TABLE IF NOT EXISTS daily_feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, feature_name, usage_date)
);

-- Subscription events log (for analytics and debugging)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'purchased', 'cancelled', 'renewed', 'expired', 'trial_started'
    previous_tier TEXT,
    new_tier TEXT,
    product_id TEXT,
    revenue_cat_customer_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature access attempts (for monitoring and preventing abuse)
CREATE TABLE IF NOT EXISTS feature_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    access_granted BOOLEAN NOT NULL,
    reason TEXT, -- 'within_limit', 'premium_required', 'limit_exceeded', etc.
    user_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_feature_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_feature_date ON daily_feature_usage(feature_name, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access_logs(user_id);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own usage data
CREATE POLICY "Users can view own usage" ON daily_feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON daily_feature_usage
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own subscription events
CREATE POLICY "Users can view own events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert events
CREATE POLICY "Service can insert events" ON subscription_events
    FOR INSERT WITH CHECK (true);

-- Users can view their own access logs
CREATE POLICY "Users can view own access logs" ON feature_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert access logs
CREATE POLICY "Service can insert access logs" ON feature_access_logs
    FOR INSERT WITH CHECK (true);

-- Function to increment daily usage atomically
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_user_id UUID,
    p_feature_name TEXT,
    p_usage_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO daily_feature_usage (user_id, feature_name, usage_date, usage_count)
    VALUES (p_user_id, p_feature_name, p_usage_date, 1)
    ON CONFLICT (user_id, feature_name, usage_date)
    DO UPDATE SET 
        usage_count = daily_feature_usage.usage_count + 1,
        updated_at = NOW()
    RETURNING usage_count INTO new_count;
    
    RETURN new_count;
END;
$$;

-- Function to get user's current subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(p_user_id UUID)
RETURNS TABLE (
    subscription_tier TEXT,
    subscription_status TEXT,
    expires_at TIMESTAMPTZ,
    is_trial BOOLEAN,
    days_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.subscription_tier,
        us.subscription_status,
        us.subscription_expires_at,
        (us.trial_ends_at > NOW()) as is_trial,
        CASE 
            WHEN us.subscription_expires_at IS NULL THEN NULL
            ELSE GREATEST(0, EXTRACT(days FROM us.subscription_expires_at - NOW())::INTEGER)
        END as days_remaining
    FROM user_subscriptions us
    WHERE us.user_id = p_user_id;
END;
$$;

-- Function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(
    p_user_id UUID,
    p_feature_name TEXT,
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
    can_access BOOLEAN,
    reason TEXT,
    usage_count INTEGER,
    limit_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    user_tier TEXT;
    current_usage INTEGER := 0;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    -- Default to free tier if no subscription found
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;
    
    -- If no daily limit specified, just check tier access
    IF p_daily_limit IS NULL THEN
        RETURN QUERY SELECT 
            CASE 
                WHEN user_tier = 'free' THEN FALSE
                ELSE TRUE 
            END,
            CASE 
                WHEN user_tier = 'free' THEN 'Premium subscription required'
                ELSE 'Access granted'
            END,
            0::INTEGER,
            0::INTEGER;
        RETURN;
    END IF;
    
    -- Check daily usage for features with limits
    SELECT COALESCE(usage_count, 0) INTO current_usage
    FROM daily_feature_usage
    WHERE user_id = p_user_id 
      AND feature_name = p_feature_name 
      AND usage_date = CURRENT_DATE;
    
    RETURN QUERY SELECT 
        (current_usage < p_daily_limit) as can_access,
        CASE 
            WHEN current_usage >= p_daily_limit THEN 'Daily limit exceeded'
            ELSE 'Within daily limit'
        END as reason,
        current_usage,
        GREATEST(0, p_daily_limit - current_usage) as limit_remaining;
END;
$$;
