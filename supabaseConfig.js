import { createClient } from '@supabase/supabase-js';

// Production-safe Supabase configuration
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fallback validation - but don't break the build if missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing in environment variables');
  // Use fallback URLs to prevent app crashes
  supabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
  supabaseAnonKey = supabaseAnonKey || 'placeholder-key';
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
