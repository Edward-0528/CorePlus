-- Alternative script if auth.users reference fails
-- This version uses UUID without foreign key constraint

CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Remove the foreign key reference temporarily
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add the foreign key constraint separately if needed
-- ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
