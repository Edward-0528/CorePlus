import { createClient } from '@supabase/supabase-js';

// Get configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Log configuration status for debugging
console.log('🔧 Supabase Config Status:');
console.log('  - URL present:', !!supabaseUrl);
console.log('  - Key present:', !!supabaseAnonKey);
if (supabaseUrl) {
  console.log('  - URL starts with:', supabaseUrl.substring(0, 20) + '...');
}

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('Please set environment variables before starting Expo:');
  console.error('$env:EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"');
  console.error('$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"');
  console.error('Then run: npx expo start');
} else {
  console.log('✅ Supabase configuration loaded successfully');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
