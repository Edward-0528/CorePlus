-- Affiliate System Tables for Core+
-- Run this SQL in your Supabase SQL Editor

-- 1. Create influencers/affiliates table
CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Influencer details
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL,
    
    -- Commission settings
    commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% default commission
    commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    fixed_commission_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status and preferences
    is_active BOOLEAN DEFAULT true,
    payment_email TEXT,
    payment_method TEXT DEFAULT 'paypal' CHECK (payment_method IN ('paypal', 'stripe', 'bank_transfer')),
    
    -- Social media links (optional)
    instagram_handle TEXT,
    youtube_channel TEXT,
    tiktok_handle TEXT,
    website_url TEXT,
    
    -- Stats tracking
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    
    -- Notes for admin
    notes TEXT
);

-- 2. Create affiliate code usage tracking table
CREATE TABLE IF NOT EXISTS public.affiliate_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relationships
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    influencer_id UUID REFERENCES public.influencers(id) ON DELETE SET NULL,
    affiliate_code TEXT NOT NULL,
    
    -- Usage tracking
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    signup_completed BOOLEAN DEFAULT false,
    subscription_started BOOLEAN DEFAULT false,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    
    -- Commission tracking
    commission_eligible BOOLEAN DEFAULT false,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_paid BOOLEAN DEFAULT false,
    commission_paid_date TIMESTAMP WITH TIME ZONE,
    
    -- Subscription details for commission calculation
    subscription_plan TEXT,
    subscription_amount DECIMAL(10,2),
    
    -- Additional tracking
    referral_source TEXT DEFAULT 'signup', -- 'signup', 'renewal', 'upgrade'
    
    UNIQUE(user_id, affiliate_code) -- Prevent duplicate usage by same user
);

-- 3. Create commission payouts tracking table
CREATE TABLE IF NOT EXISTS public.commission_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relationships
    influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE NOT NULL,
    
    -- Payout details
    payout_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Payment method and reference
    payment_method TEXT NOT NULL,
    payment_reference TEXT, -- PayPal transaction ID, Stripe payment ID, etc.
    
    -- Period covered
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Related affiliate usage records
    affiliate_usage_ids UUID[], -- Array of affiliate_usage.id records included in this payout
    
    -- Notes
    notes TEXT
);

-- 4. Add Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- Influencers table policies
CREATE POLICY "Influencers can view their own data" ON public.influencers
    FOR SELECT USING (auth.uid()::text = email); -- Assuming influencer signs up with same email

CREATE POLICY "Only admins can manage influencers" ON public.influencers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Affiliate usage policies  
CREATE POLICY "Users can view their own affiliate usage" ON public.affiliate_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert affiliate usage during signup" ON public.affiliate_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate usage" ON public.affiliate_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Commission payouts policies
CREATE POLICY "Influencers can view their own payouts" ON public.commission_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.influencers 
            WHERE influencers.id = influencer_id 
            AND influencers.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Only admins can manage payouts" ON public.commission_payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 5. Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_influencers_affiliate_code ON public.influencers(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_influencers_email ON public.influencers(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_usage_user_id ON public.affiliate_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_usage_influencer_id ON public.affiliate_usage(influencer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_usage_affiliate_code ON public.affiliate_usage(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_usage_created_at ON public.affiliate_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_influencer_id ON public.commission_payouts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_payout_date ON public.commission_payouts(payout_date);

-- 6. Create helpful functions

-- Function to validate affiliate code exists and is active
CREATE OR REPLACE FUNCTION public.validate_affiliate_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.influencers 
        WHERE affiliate_code = UPPER(code) 
        AND is_active = true
    );
END;
$$;

-- Function to get influencer by affiliate code
CREATE OR REPLACE FUNCTION public.get_influencer_by_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    influencer_uuid UUID;
BEGIN
    SELECT id INTO influencer_uuid
    FROM public.influencers 
    WHERE affiliate_code = UPPER(code) 
    AND is_active = true;
    
    RETURN influencer_uuid;
END;
$$;

-- 7. Insert some sample influencer data (optional - remove in production)
INSERT INTO public.influencers (name, email, affiliate_code, commission_rate, instagram_handle) VALUES
('Fitness Mike', 'mike@fitnessmike.com', 'FITNESSMIKE', 0.15, '@fitnessmike'),
('Healthy Hannah', 'hannah@healthyhannah.com', 'HEALTHYHANNAH', 0.12, '@healthyhannah'),
('Strong Sarah', 'sarah@strongsarah.com', 'STRONGSARAH', 0.10, '@strongsarah')
ON CONFLICT (affiliate_code) DO NOTHING;

-- 8. Create trigger to update influencer stats when affiliate usage changes
CREATE OR REPLACE FUNCTION public.update_influencer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update total referrals and earnings for the influencer
    UPDATE public.influencers 
    SET 
        total_referrals = (
            SELECT COUNT(*) 
            FROM public.affiliate_usage 
            WHERE influencer_id = NEW.influencer_id
        ),
        total_earnings = (
            SELECT COALESCE(SUM(commission_amount), 0) 
            FROM public.affiliate_usage 
            WHERE influencer_id = NEW.influencer_id 
            AND commission_eligible = true
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.influencer_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_influencer_stats
    AFTER INSERT OR UPDATE ON public.affiliate_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_influencer_stats();

-- 9. Grant necessary permissions
GRANT SELECT ON public.influencers TO anon, authenticated;
GRANT INSERT, SELECT ON public.affiliate_usage TO anon, authenticated;
GRANT SELECT ON public.commission_payouts TO authenticated;

-- Allow public access to validation functions
GRANT EXECUTE ON FUNCTION public.validate_affiliate_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_influencer_by_code(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.influencers IS 'Stores influencer/affiliate partner information';
COMMENT ON TABLE public.affiliate_usage IS 'Tracks when users use affiliate codes and associated commissions';
COMMENT ON TABLE public.commission_payouts IS 'Records commission payments made to influencers';
