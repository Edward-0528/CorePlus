// Debug script to test micronutrient data flow
// Run this with: node debug_micronutrients.js

import { supabase } from './supabaseConfig.js';

async function debugMicronutrients() {
  console.log('🔍 Debugging micronutrient data flow...');
  
  try {
    // 1. Check if the columns exist in the database
    console.log('\n1. Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'meals')
      .in('column_name', ['calcium', 'iron', 'vitamin_c']);
    
    if (schemaError) {
      console.error('Schema check failed:', schemaError);
    } else {
      console.log('Found columns:', columns);
    }
    
    // 2. Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log('\n2. User authenticated:', user.email);
    
    // 3. Get recent meals and check micronutrient values
    console.log('\n3. Checking recent meals...');
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('meal_name, calcium, iron, vitamin_c, fiber, sugar, sodium, calories')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (mealsError) {
      console.error('Failed to fetch meals:', mealsError);
    } else {
      console.log('Recent meals with micronutrients:');
      meals.forEach((meal, index) => {
        console.log(`${index + 1}. ${meal.meal_name}:`);
        console.log(`   Calories: ${meal.calories}`);
        console.log(`   Fiber: ${meal.fiber}, Sugar: ${meal.sugar}, Sodium: ${meal.sodium}`);
        console.log(`   Calcium: ${meal.calcium}, Iron: ${meal.iron}, Vitamin C: ${meal.vitamin_c}`);
        console.log('');
      });
    }
    
    // 4. Test inserting a meal with micronutrients
    console.log('\n4. Testing meal insertion with micronutrients...');
    const testMeal = {
      user_id: user.id,
      meal_name: 'Test Micronutrient Meal',
      calories: 250,
      carbs: 30,
      protein: 20,
      fat: 8,
      fiber: 5,
      sugar: 3,
      sodium: 150,
      calcium: 120,  // Test calcium
      iron: 2.5,     // Test iron
      vitamin_c: 15, // Test vitamin C
      meal_method: 'debug',
      meal_type: 'test',
      meal_date: new Date().toISOString().split('T')[0],
      meal_time: new Date().toTimeString().split(' ')[0]
    };
    
    const { data: insertedMeal, error: insertError } = await supabase
      .from('meals')
      .insert([testMeal])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to insert test meal:', insertError);
      
      // Check if the error is about missing columns
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n🚨 ISSUE FOUND: Database columns are missing!');
        console.log('You need to run the migration script to add calcium, iron, and vitamin_c columns.');
        console.log('Run the SQL migration script in your Supabase dashboard.');
      }
    } else {
      console.log('✅ Test meal inserted successfully:', insertedMeal);
      console.log(`   Calcium stored: ${insertedMeal.calcium}`);
      console.log(`   Iron stored: ${insertedMeal.iron}`);
      console.log(`   Vitamin C stored: ${insertedMeal.vitamin_c}`);
      
      // Clean up test meal
      await supabase.from('meals').delete().eq('id', insertedMeal.id);
      console.log('🧹 Test meal cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug function
debugMicronutrients();
