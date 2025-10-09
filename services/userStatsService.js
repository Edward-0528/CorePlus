import { supabase } from '../supabaseConfig';
import { getLocalDateString } from '../utils/dateUtils';

export const userStatsService = {
  // Calculate days active based on unique dates with meal logs
  async getDaysActive() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all unique dates where the user has logged meals
      const { data, error } = await supabase
        .from('meals')
        .select('meal_date')
        .eq('user_id', user.id)
        .order('meal_date', { ascending: true });

      if (error) {
        console.error('Error fetching meal dates:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { success: true, daysActive: 0, firstActiveDate: null };
      }

      // Get unique dates
      const uniqueDates = [...new Set(data.map(meal => meal.meal_date))];
      const daysActive = uniqueDates.length;
      const firstActiveDate = uniqueDates[0]; // Already sorted ascending

      console.log(`📊 User has been active for ${daysActive} days since ${firstActiveDate}`);

      return { 
        success: true, 
        daysActive, 
        firstActiveDate,
        uniqueDates 
      };

    } catch (error) {
      console.error('❌ Failed to calculate days active:', error);
      return { 
        success: false, 
        error: error.message, 
        daysActive: 0 
      };
    }
  },

  // Get total meals logged count
  async getTotalMealsLogged() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { count, error } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error counting meals:', error);
        throw error;
      }

      return { success: true, totalMeals: count || 0 };

    } catch (error) {
      console.error('❌ Failed to count meals:', error);
      return { success: false, error: error.message, totalMeals: 0 };
    }
  },

  // Get user's account creation date for days since joining
  async getDaysSinceJoining() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const createdAt = new Date(user.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - createdAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return { 
        success: true, 
        daysSinceJoining: diffDays,
        joinDate: user.created_at 
      };

    } catch (error) {
      console.error('❌ Failed to calculate days since joining:', error);
      return { 
        success: false, 
        error: error.message, 
        daysSinceJoining: 0 
      };
    }
  },

  // Get current streak (consecutive days with meal logs)
  async getCurrentStreak() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all unique meal dates in descending order
      const { data, error } = await supabase
        .from('meals')
        .select('meal_date')
        .eq('user_id', user.id)
        .order('meal_date', { ascending: false });

      if (error) {
        console.error('Error fetching meal dates for streak:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { success: true, currentStreak: 0 };
      }

      // Get unique dates in descending order
      const uniqueDates = [...new Set(data.map(meal => meal.meal_date))];
      
      let streak = 0;
      const today = getLocalDateString();
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const currentDate = uniqueDates[i];
        
        if (i === 0) {
          // First date should be today or yesterday to count as current streak
          const daysDiff = this.getDaysDifference(currentDate, today);
          if (daysDiff > 1) {
            // More than 1 day gap, no current streak
            break;
          }
          streak = 1;
        } else {
          // Check if consecutive
          const prevDate = uniqueDates[i - 1];
          const daysDiff = this.getDaysDifference(currentDate, prevDate);
          
          if (daysDiff === 1) {
            streak++;
          } else {
            // Gap found, streak broken
            break;
          }
        }
      }

      return { success: true, currentStreak: streak };

    } catch (error) {
      console.error('❌ Failed to calculate current streak:', error);
      return { success: false, error: error.message, currentStreak: 0 };
    }
  },

  // Helper function to calculate days difference between two date strings
  getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get comprehensive user statistics
  async getUserStats() {
    try {
      const [daysActiveResult, totalMealsResult, daysSinceJoiningResult, streakResult] = await Promise.all([
        this.getDaysActive(),
        this.getTotalMealsLogged(),
        this.getDaysSinceJoining(),
        this.getCurrentStreak()
      ]);

      return {
        success: true,
        stats: {
          daysActive: daysActiveResult.success ? daysActiveResult.daysActive : 0,
          totalMeals: totalMealsResult.success ? totalMealsResult.totalMeals : 0,
          daysSinceJoining: daysSinceJoiningResult.success ? daysSinceJoiningResult.daysSinceJoining : 0,
          currentStreak: streakResult.success ? streakResult.currentStreak : 0,
          firstActiveDate: daysActiveResult.success ? daysActiveResult.firstActiveDate : null,
          joinDate: daysSinceJoiningResult.success ? daysSinceJoiningResult.joinDate : null
        }
      };

    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return {
        success: false,
        error: error.message,
        stats: {
          daysActive: 0,
          totalMeals: 0,
          daysSinceJoining: 0,
          currentStreak: 0
        }
      };
    }
  }
};
