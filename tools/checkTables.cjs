// Check what tables exist in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTables() {
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL, 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('🔍 Checking Supabase tables...\n');
  
  const tables = [
    'user_profiles',
    'user_meals', 
    'meals',
    'profiles',
    'water_intake',
    'meal_plans',
    'user_meal_plans'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      if (!error) {
        console.log(`✅ ${table}: ${count || 0} rows`);
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  console.log('\n📝 If no tables are shown, you may need to:');
  console.log('1. Set up your database schema in Supabase Dashboard');
  console.log('2. Run database migrations');
  console.log('3. Check your environment variables');
}

checkTables().catch(console.error);
