-- Create secure user subscriptions table
-- This table tracks which users have valid subscriptions to prevent unauthorized access

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'expired', 'cancelled')),
    subscription_product_id TEXT,
    product_id TEXT, -- RevenueCat product ID
    original_transaction_id TEXT, -- RevenueCat transaction ID
    revenue_cat_user_id TEXT, -- RevenueCat user ID
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    subscription_expires_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Alternative name for consistency
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    UNIQUE(user_id, subscription_status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_transaction ON user_subscriptions(original_transaction_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (for new purchases)
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for RevenueCat webhooks)
CREATE POLICY "Service role full access" ON user_subscriptions
    FOR ALL USING (current_setting('role') = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Function to check subscription validity
CREATE OR REPLACE FUNCTION is_user_subscription_valid(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = user_uuid
        AND subscription_status = 'active'
        AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_subscription_valid(UUID) TO authenticated;

-- Insert some example data for testing (optional)
-- UNCOMMENT THESE LINES ONLY FOR TESTING
/*
INSERT INTO user_subscriptions (user_id, subscription_tier, subscription_status, subscription_product_id, subscription_expires_at)
VALUES 
    -- Replace with your actual user ID for testing
    ('your-user-id-here', 'pro', 'active', 'coreplus_premium_monthly:corepluselite', NOW() + INTERVAL '1 month');
*/

-- Check if table was created successfully
SELECT 'User subscriptions table created successfully' AS status;
