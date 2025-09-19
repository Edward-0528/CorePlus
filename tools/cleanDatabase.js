/**
 * Database Cleanup Script
 * This script will help you clean up demo accounts and prepare for production
 */
import { supabase } from '../supabaseConfig.js';

const cleanDatabase = async () => {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Get current user count
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    
    console.log(`📊 Found ${users.users.length} users in auth.users`);
    
    // Get user profiles count
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
    if (profilesError) throw profilesError;
    
    console.log(`👤 Found ${profiles.length} profiles in user_profiles`);
    
    // Get meals count
    const { data: meals, error: mealsError } = await supabase
      .from('user_meals')
      .select('*');
    if (mealsError) throw mealsError;
    
    console.log(`🍽️ Found ${meals.length} meals in user_meals`);
    
    // Get water intake count
    const { data: water, error: waterError } = await supabase
      .from('water_intake')
      .select('*');
    if (waterError) throw waterError;
    
    console.log(`💧 Found ${water.length} water intake records`);
    
    // Get meal plans count
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('user_meal_plans')
      .select('*');
    if (mealPlansError) throw mealPlansError;
    
    console.log(`📋 Found ${mealPlans.length} meal plans`);
    
    console.log('\n⚠️  To clean up demo data, you have several options:');
    console.log('1. Clean specific user data');
    console.log('2. Clean all user data (keep auth users)'); 
    console.log('3. Delete ALL data including auth users (DESTRUCTIVE)');
    
    return {
      users: users.users.length,
      profiles: profiles.length,
      meals: meals.length,
      water: water.length,
      mealPlans: mealPlans.length
    };
    
  } catch (error) {
    console.error('❌ Error during database analysis:', error);
    throw error;
  }
};

const cleanUserData = async (keepAuth = true) => {
  console.log('🧹 Cleaning user data...');
  
  try {
    // Delete water intake
    const { error: waterError } = await supabase
      .from('water_intake')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (waterError) throw waterError;
    console.log('✅ Deleted water intake records');
    
    // Delete user meals
    const { error: mealsError } = await supabase
      .from('user_meals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (mealsError) throw mealsError;
    console.log('✅ Deleted user meals');
    
    // Delete meal plans
    const { error: mealPlansError } = await supabase
      .from('user_meal_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (mealPlansError) throw mealPlansError;
    console.log('✅ Deleted meal plans');
    
    // Delete user profiles
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (profilesError) throw profilesError;
    console.log('✅ Deleted user profiles');
    
    if (!keepAuth) {
      console.log('⚠️  Note: To delete auth users, you need to use Supabase Dashboard Admin panel');
      console.log('   Go to Authentication > Users and delete them manually');
    }
    
    console.log('🎉 Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

// Export functions for use
export { cleanDatabase, cleanUserData };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanDatabase().then(stats => {
    console.log('\n📊 Database Statistics:', stats);
    console.log('\nRun with --clean flag to actually clean data');
    
    if (process.argv.includes('--clean')) {
      return cleanUserData(true);
    }
  }).catch(console.error);
}
