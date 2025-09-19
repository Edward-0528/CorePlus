// Database Cleanup Utility for Core+ App
// Run this script to clean up demo/test data from Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeDatabase() {
  console.log('🔍 Analyzing database contents...\n');
  
  try {
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profilesError && profilesError.code !== 'PGRST116') {
      throw profilesError;
    }
    
    console.log(`👤 User Profiles: ${profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      profiles.slice(0, 5).forEach((profile, index) => {
        console.log(`  ${index + 1}. User ID: ${profile.user_id?.substring(0, 8)}...`);
      });
      if (profiles.length > 5) {
        console.log(`  ... and ${profiles.length - 5} more`);
      }
    }
    
    // Check user meals
    const { data: meals, error: mealsError } = await supabase
      .from('user_meals')
      .select('id, user_id, meal_name, date_consumed');
    
    if (mealsError && mealsError.code !== 'PGRST116') {
      throw mealsError;
    }
    
    console.log(`\n🍽️  User Meals: ${meals?.length || 0}`);
    
    // Check water intake
    const { data: water, error: waterError } = await supabase
      .from('water_intake')
      .select('id, user_id, date, total_ml');
    
    if (waterError && waterError.code !== 'PGRST116') {
      throw waterError;
    }
    
    console.log(`💧 Water Intake Records: ${water?.length || 0}`);
    
    // Check meal plans
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('user_meal_plans')
      .select('id, user_id, plan_name, created_at');
    
    if (mealPlansError && mealPlansError.code !== 'PGRST116') {
      throw mealPlansError;
    }
    
    console.log(`📋 Meal Plans: ${mealPlans?.length || 0}`);
    
    return {
      profiles: profiles?.length || 0,
      meals: meals?.length || 0,
      water: water?.length || 0,
      mealPlans: mealPlans?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
    return null;
  }
}

async function cleanUserData() {
  console.log('🧹 Starting database cleanup...\n');
  
  try {
    // Delete water intake
    const { error: waterError } = await supabase
      .from('water_intake')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (waterError) throw waterError;
    console.log('✅ Deleted water intake records');
    
    // Delete user meals
    const { error: mealsError } = await supabase
      .from('user_meals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (mealsError) throw mealsError;
    console.log('✅ Deleted user meals');
    
    // Delete meal plans
    const { error: mealPlansError } = await supabase
      .from('user_meal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (mealPlansError) throw mealPlansError;
    console.log('✅ Deleted meal plans');
    
    // Delete user profiles
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');
    
    if (profilesError) throw profilesError;
    console.log('✅ Deleted user profiles');
    
    console.log('\n🎉 Database cleanup completed!');
    console.log('📝 Note: Auth users still exist. Delete them manually from Supabase Dashboard > Authentication > Users');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'clean') {
    const stats = await analyzeDatabase();
    if (stats && (stats.profiles > 0 || stats.meals > 0 || stats.water > 0 || stats.mealPlans > 0)) {
      console.log('\n⚠️  This will delete ALL user data. Continue? (y/N)');
      process.stdin.resume();
      process.stdin.on('data', async (data) => {
        const input = data.toString().trim().toLowerCase();
        if (input === 'y' || input === 'yes') {
          await cleanUserData();
        } else {
          console.log('Cleanup cancelled.');
        }
        process.exit(0);
      });
    } else {
      console.log('\n✨ Database is already clean!');
    }
  } else {
    // Just analyze
    await analyzeDatabase();
    console.log('\n💡 To clean demo data, run: npm run clean-database clean');
  }
}

main().catch(console.error);
