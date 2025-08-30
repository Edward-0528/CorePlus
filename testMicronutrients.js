// Simple database test for micronutrients
import { supabase } from './supabaseConfig.js';

async function testMicronutrients() {
  console.log('🔍 Testing micronutrients database integration...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No user authenticated');
      return;
    }
    
    console.log('✅ User:', user.email);
    
    // 1. Check recent meals for micronutrient values
    console.log('\n📊 Checking recent meals...');
    const { data: recentMeals, error: mealsError } = await supabase
      .from('meals')
      .select('meal_name, calcium, iron, vitamin_c, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (mealsError) {
      console.log('❌ Error fetching meals:', mealsError.message);
    } else {
      console.log('Recent meals:');
      recentMeals.forEach((meal, i) => {
        console.log(`${i+1}. ${meal.meal_name}`);
        console.log(`   Calcium: ${meal.calcium || 0}mg`);
        console.log(`   Iron: ${meal.iron || 0}mg`);
        console.log(`   Vitamin C: ${meal.vitamin_c || 0}mg`);
        console.log(`   Created: ${meal.created_at}`);
        console.log('');
      });
    }
    
    // 2. Test insertion with micronutrients
    console.log('\n🧪 Testing new meal insertion...');
    const testMeal = {
      user_id: user.id,
      meal_name: 'Micronutrient Test Meal',
      calories: 200,
      carbs: 20,
      protein: 15,
      fat: 8,
      fiber: 5,
      sugar: 3,
      sodium: 100,
      calcium: 150,     // Test calcium
      iron: 3,          // Test iron
      vitamin_c: 25,    // Test vitamin C
      meal_method: 'test',
      meal_type: 'test',
      meal_date: new Date().toISOString().split('T')[0],
      meal_time: new Date().toTimeString().split(' ')[0]
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('meals')
      .insert([testMeal])
      .select('meal_name, calcium, iron, vitamin_c')
      .single();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      
      // Check if it's a column error
      if (insertError.message.includes('column') && 
          (insertError.message.includes('calcium') || 
           insertError.message.includes('iron') || 
           insertError.message.includes('vitamin_c'))) {
        console.log('\n🚨 DATABASE ISSUE: Columns do not exist!');
        console.log('The migration script was not applied successfully.');
        console.log('Please run the migration script in Supabase SQL editor again.');
      }
    } else {
      console.log('✅ Test meal inserted successfully:');
      console.log(`   Calcium: ${insertResult.calcium}mg`);
      console.log(`   Iron: ${insertResult.iron}mg`);
      console.log(`   Vitamin C: ${insertResult.vitamin_c}mg`);
      
      // Clean up test meal
      await supabase.from('meals').delete().eq('meal_name', 'Micronutrient Test Meal');
      console.log('🧹 Test meal cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

export { testMicronutrients };
