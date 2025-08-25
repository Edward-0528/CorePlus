import { supabase } from '../supabaseConfig';

export const mealService = {
  // Add a new meal for the current user
  async addMeal(mealData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const now = new Date();
      const mealTime = mealData.time || now.toTimeString().split(' ')[0]; // HH:mm:ss format
      
      const meal = {
        user_id: user.id,
        meal_name: mealData.name,
        calories: parseInt(mealData.calories) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        protein: parseFloat(mealData.protein) || 0,
        fat: parseFloat(mealData.fat) || 0,
        fiber: parseFloat(mealData.fiber) || 0,
        sugar: parseFloat(mealData.sugar) || 0,
        sodium: parseFloat(mealData.sodium) || 0,
        meal_method: mealData.method || 'manual',
        meal_type: mealData.mealType || this.determineMealType(),
        portion_description: mealData.portion || null,
        image_uri: mealData.imageUri || null,
        confidence_score: mealData.confidence || null,
        meal_date: mealData.date || now.toISOString().split('T')[0],
        meal_time: mealTime
      };

      console.log('🕐 Adding meal with timestamp:', mealTime, 'for meal:', mealData.name);

      const { data, error } = await supabase
        .from('meals')
        .insert([meal])
        .select()
        .single();

      if (error) {
        console.error('Error adding meal:', error);
        throw error;
      }

      console.log('✅ Meal added to database:', data);
      return { success: true, meal: data };

    } catch (error) {
      console.error('❌ Failed to add meal:', error);
      return { success: false, error: error.message };
    }
  },

  // Get today's meals for the current user
  async getTodaysMeals(targetDate = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use provided date or default to today
      const today = targetDate || new Date().toISOString().split('T')[0];

      console.log('🔍 Fetching meals for date:', today);

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_date', today)
        .order('meal_time', { ascending: false }); // Show newest meals first

      if (error) {
        console.error('Error fetching today\'s meals:', error);
        throw error;
      }

      return { success: true, meals: data || [] };

    } catch (error) {
      console.error('❌ Failed to fetch today\'s meals:', error);
      return { success: false, error: error.message, meals: [] };
    }
  },

  // Get meals for a specific date
  async getMealsByDate(date) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_date', date)
        .order('meal_time', { ascending: false }); // Show newest meals first

      if (error) {
        console.error('Error fetching meals by date:', error);
        throw error;
      }

      return { success: true, meals: data || [] };

    } catch (error) {
      console.error('❌ Failed to fetch meals by date:', error);
      return { success: false, error: error.message, meals: [] };
    }
  },

  // Get all historical meals (not today)
  async getHistoricalMeals(daysBack = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const today = new Date().toISOString().split('T')[0];
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - daysBack);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      console.log(`🔍 Fetching historical meals from ${pastDateStr} to yesterday (excluding today: ${today})`);

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .lt('meal_date', today) // Less than today (yesterday and before)
        .gte('meal_date', pastDateStr) // Greater than or equal to past date
        .order('meal_date', { ascending: false })
        .order('meal_time', { ascending: false });

      if (error) {
        console.error('Error fetching historical meals:', error);
        throw error;
      }

      console.log(`📊 Found ${data?.length || 0} historical meals`);

      // Group meals by date
      const groupedMeals = {};
      data?.forEach(meal => {
        const date = meal.meal_date;
        if (!groupedMeals[date]) {
          groupedMeals[date] = [];
        }
        groupedMeals[date].push(meal);
      });

      return { success: true, meals: data || [], groupedMeals };

    } catch (error) {
      console.error('❌ Failed to fetch historical meals:', error);
      return { success: false, error: error.message, meals: [], groupedMeals: {} };
    }
  },

  // Delete a meal
  async deleteMeal(mealId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting meal:', error);
        throw error;
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete meal:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper: Determine meal type based on time
  determineMealType() {
    const hour = new Date().getHours();
    
    if (hour < 10) return 'breakfast';
    if (hour < 14) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  }
};
