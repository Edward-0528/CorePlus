-- Migration script for existing users
-- This will create user_profiles entries for all existing users with simplified Free/Pro tiers

-- First, let's see what existing users we have
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
ORDER BY created_at;

-- Create user_profiles entries for all existing users (all start as free)
INSERT INTO user_profiles (user_id, subscription_tier, subscription_status, created_at)
SELECT 
    id as user_id,
    'free' as subscription_tier,
    'inactive' as subscription_status,
    created_at
FROM auth.users
WHERE id NOT IN (
    SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL
);

-- If you had any existing elite users, convert them to pro
UPDATE user_profiles 
SET subscription_tier = 'pro' 
WHERE subscription_tier = 'elite';

-- Verify the migration worked
SELECT 
    u.email,
    u.created_at as user_created,
    up.subscription_tier,
    up.subscription_status,
    up.created_at as profile_created
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at;

-- Show summary of subscription tiers
SELECT 
    subscription_tier,
    subscription_status,
    COUNT(*) as user_count
FROM user_profiles
GROUP BY subscription_tier, subscription_status
ORDER BY subscription_tier, subscription_status;
