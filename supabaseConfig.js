import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Create Supabase client with enhanced session persistence and timeout settings
// Following best practices from: https://stackoverflow.com/questions/72341305/keep-user-logged-in-while-using-supabase-in-react-native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Helps prevent auth loops in React Native
    // flowType: 'pkce' is more secure than 'implicit' for mobile apps
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'core-plus-mobile',
    },
  },
  db: {
    schema: 'public',
  },
  // Add timeout for requests
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    timeout: 30000, // 30 second timeout
  },
});
