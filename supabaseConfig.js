import { createClient } from '@supabase/supabase-js';

// Production-safe Supabase configuration
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Temporary fallback for production builds until EAS secrets are configured
if (!supabaseUrl || !supabaseAnonKey) {
  if (!__DEV__) {
    // Import production config only in production builds
    const { PRODUCTION_CONFIG } = require('./config/production-temp.js');
    supabaseUrl = PRODUCTION_CONFIG.SUPABASE_URL;
    supabaseAnonKey = PRODUCTION_CONFIG.SUPABASE_ANON_KEY;
  } else {
    throw new Error('Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
}

// Only log in development to avoid production console issues
if (__DEV__) {
  console.log('🔧 Supabase Config Status:');
  console.log('  - URL present:', !!supabaseUrl);
  console.log('  - Key present:', !!supabaseAnonKey);
  if (supabaseUrl) {
    console.log('  - URL starts with:', supabaseUrl.substring(0, 30) + '...');
  }
  console.log('✅ Supabase configuration loaded successfully');
}

// Create Supabase client with production-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
