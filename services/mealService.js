import { supabase } from '../supabaseConfig';

export const mealService = {
  // Add a new meal for the current user
  async addMeal(mealData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const meal = {
        user_id: user.id,
        meal_name: mealData.name,
        calories: parseInt(mealData.calories) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        protein: parseFloat(mealData.protein) || 0,
        fat: parseFloat(mealData.fat) || 0,
        meal_method: mealData.method || 'manual',
        meal_type: mealData.mealType || this.determineMealType(),
        portion_description: mealData.portion || null,
        image_uri: mealData.imageUri || null,
        confidence_score: mealData.confidence || null,
        meal_date: mealData.date || new Date().toISOString().split('T')[0],
        meal_time: mealData.time || new Date().toTimeString().split(' ')[0]
      };

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
  async getTodaysMeals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_date', today)
        .order('meal_time', { ascending: true });

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
        .order('meal_time', { ascending: true });

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

  // Get meal history (last 30 days)
  async getMealHistory(days = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('meal_date', startDateStr)
        .order('meal_date', { ascending: false })
        .order('meal_time', { ascending: false });

      if (error) {
        console.error('Error fetching meal history:', error);
        throw error;
      }

      return { success: true, meals: data || [] };

    } catch (error) {
      console.error('❌ Failed to fetch meal history:', error);
      return { success: false, error: error.message, meals: [] };
    }
  },

  // Get daily summaries
  async getDailySummaries(days = 7) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_meal_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('meal_date', startDateStr)
        .order('meal_date', { ascending: false });

      if (error) {
        console.error('Error fetching daily summaries:', error);
        throw error;
      }

      return { success: true, summaries: data || [] };

    } catch (error) {
      console.error('❌ Failed to fetch daily summaries:', error);
      return { success: false, error: error.message, summaries: [] };
    }
  },

  // Update a meal
  async updateMeal(mealId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating meal:', error);
        throw error;
      }

      return { success: true, meal: data };

    } catch (error) {
      console.error('❌ Failed to update meal:', error);
      return { success: false, error: error.message };
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

  // Get nutrition totals for today
  async getTodaysNutrition() {
    try {
      const result = await this.getTodaysMeals();
      
      if (!result.success) {
        return result;
      }

      const meals = result.meals;
      const totals = meals.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        protein: acc.protein + (meal.protein || 0),
        fat: acc.fat + (meal.fat || 0),
        mealCount: acc.mealCount + 1
      }), { calories: 0, carbs: 0, protein: 0, fat: 0, mealCount: 0 });

      return { success: true, totals, meals };

    } catch (error) {
      console.error('❌ Failed to get today\'s nutrition:', error);
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
  },

  // Sync local meals to database (for migration)
  async syncLocalMeals(localMeals) {
    try {
      const results = [];
      
      for (const meal of localMeals) {
        const result = await this.addMeal({
          name: meal.name,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
          method: meal.method || 'manual',
          time: meal.time
        });
        results.push(result);
      }

      return { success: true, results };

    } catch (error) {
      console.error('❌ Failed to sync local meals:', error);
      return { success: false, error: error.message };
    }
  }
};
