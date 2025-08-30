// Debug tracer for micronutrient data flow
export const debugMicronutrients = {
  log: (step, data, details = '') => {
    console.log(`🔍 MICRONUTRIENT DEBUG - ${step}:`);
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          console.log(`  [${index}] ${item.name || 'Unknown'}:`);
          console.log(`    Calcium: ${item.calcium || 0}mg`);
          console.log(`    Iron: ${item.iron || 0}mg`);
          console.log(`    Vitamin C: ${item.vitaminC || item.vitamin_c || 0}mg`);
        });
      } else {
        console.log(`  ${data.name || 'Meal'}:`);
        console.log(`    Calcium: ${data.calcium || 0}mg`);
        console.log(`    Iron: ${data.iron || 0}mg`);
        console.log(`    Vitamin C: ${data.vitaminC || data.vitamin_c || 0}mg`);
      }
    }
    if (details) console.log(`  Details: ${details}`);
    console.log('');
  },

  logAIResponse: (response) => {
    console.log('🤖 AI ANALYSIS RESPONSE:');
    if (response.foods) {
      response.foods.forEach((food, index) => {
        console.log(`  Food ${index + 1}: ${food.name}`);
        console.log(`    Calcium: ${food.nutrition?.calcium || 0}mg`);
        console.log(`    Iron: ${food.nutrition?.iron || 0}mg`);
        console.log(`    Vitamin C: ${food.nutrition?.vitaminC || 0}mg`);
      });
    }
    console.log('');
  },

  logMealService: (mealData) => {
    console.log('💾 MEAL SERVICE INPUT:');
    console.log(`  Meal: ${mealData.name}`);
    console.log(`  Calcium: ${mealData.calcium || 0}mg`);
    console.log(`  Iron: ${mealData.iron || 0}mg`);
    console.log(`  Vitamin C: ${mealData.vitaminC || mealData.vitamin_c || 0}mg`);
    console.log('');
  },

  logDatabaseResult: (result) => {
    console.log('🗄️ DATABASE STORAGE RESULT:');
    if (result.meal) {
      console.log(`  Meal: ${result.meal.meal_name}`);
      console.log(`  Calcium: ${result.meal.calcium || 0}mg`);
      console.log(`  Iron: ${result.meal.iron || 0}mg`);
      console.log(`  Vitamin C: ${result.meal.vitamin_c || 0}mg`);
    }
    console.log('');
  }
};
