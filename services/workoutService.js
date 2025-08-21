import { supabase } from '../supabaseConfig';

class WorkoutService {
  // ==================== WORKOUT TEMPLATES ====================
  
  /**
   * Get all available workout templates
   */
  async getWorkoutTemplates() {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_template_exercises (
            *,
            exercises (*)
          )
        `)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        templates: data || []
      };
    } catch (error) {
      console.error('Error fetching workout templates:', error);
      return {
        success: false,
        error: error.message,
        templates: []
      };
    }
  }

  /**
   * Get a specific workout template with exercises
   */
  async getWorkoutTemplate(templateId) {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_template_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return {
        success: true,
        template: data
      };
    } catch (error) {
      console.error('Error fetching workout template:', error);
      return {
        success: false,
        error: error.message,
        template: null
      };
    }
  }

  // ==================== COMPLETED WORKOUTS ====================

  /**
   * Start a new workout session
   */
  async startWorkout(workoutData) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const workoutToInsert = {
        user_id: userData.user.id,
        workout_template_id: workoutData.templateId || null,
        workout_name: workoutData.name,
        workout_date: workoutData.date || new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        completed: false
      };

      const { data, error } = await supabase
        .from('completed_workouts')
        .insert(workoutToInsert)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        workout: data
      };
    } catch (error) {
      console.error('Error starting workout:', error);
      return {
        success: false,
        error: error.message,
        workout: null
      };
    }
  }

  /**
   * Complete a workout session
   */
  async completeWorkout(workoutId, completionData) {
    try {
      const endTime = new Date().toISOString();
      const startTimeResult = await supabase
        .from('completed_workouts')
        .select('start_time')
        .eq('id', workoutId)
        .single();

      let totalDuration = 0;
      if (startTimeResult.data?.start_time) {
        const startTime = new Date(startTimeResult.data.start_time);
        const endTimeObj = new Date(endTime);
        totalDuration = Math.round((endTimeObj - startTime) / 60000); // minutes
      }

      const updateData = {
        end_time: endTime,
        total_duration: completionData.duration || totalDuration,
        calories_burned: completionData.caloriesBurned || 0,
        notes: completionData.notes || '',
        completed: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('completed_workouts')
        .update(updateData)
        .eq('id', workoutId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        workout: data
      };
    } catch (error) {
      console.error('Error completing workout:', error);
      return {
        success: false,
        error: error.message,
        workout: null
      };
    }
  }

  /**
   * Log a quick workout (without template)
   */
  async logQuickWorkout(workoutData) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const workoutToInsert = {
        user_id: userData.user.id,
        workout_name: workoutData.name,
        workout_date: workoutData.date || new Date().toISOString().split('T')[0],
        start_time: workoutData.startTime || new Date().toISOString(),
        end_time: workoutData.endTime || new Date().toISOString(),
        total_duration: workoutData.duration || 0,
        calories_burned: workoutData.caloriesBurned || 0,
        notes: workoutData.notes || '',
        completed: true
      };

      const { data, error } = await supabase
        .from('completed_workouts')
        .insert(workoutToInsert)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        workout: data
      };
    } catch (error) {
      console.error('Error logging quick workout:', error);
      return {
        success: false,
        error: error.message,
        workout: null
      };
    }
  }

  /**
   * Get user's workout history
   */
  async getWorkoutHistory(limit = 50, offset = 0) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('completed_workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (name, muscle_groups)
          )
        `)
        .eq('user_id', userData.user.id)
        .eq('completed', true)
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        workouts: data || []
      };
    } catch (error) {
      console.error('Error fetching workout history:', error);
      return {
        success: false,
        error: error.message,
        workouts: []
      };
    }
  }

  /**
   * Get today's workouts
   */
  async getTodaysWorkouts() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('completed_workouts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('workout_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        workouts: data || []
      };
    } catch (error) {
      console.error('Error fetching today\'s workouts:', error);
      return {
        success: false,
        error: error.message,
        workouts: []
      };
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('completed_workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', userData.user.id);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting workout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== USER WORKOUT STATS ====================

  /**
   * Get user's workout statistics
   */
  async getUserWorkoutStats() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_workout_stats')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // If no stats exist, create initial record
      if (!data) {
        const { data: newStats, error: insertError } = await supabase
          .from('user_workout_stats')
          .insert({
            user_id: userData.user.id,
            current_streak: 0,
            longest_streak: 0,
            total_workouts: 0,
            total_workout_time: 0,
            total_calories_burned: 0,
            weekly_goal: 3
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          success: true,
          stats: newStats
        };
      }

      return {
        success: true,
        stats: data
      };
    } catch (error) {
      console.error('Error fetching user workout stats:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Update user's weekly workout goal
   */
  async updateWeeklyGoal(weeklyGoal) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_workout_stats')
        .upsert({
          user_id: userData.user.id,
          weekly_goal: weeklyGoal,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        stats: data
      };
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // ==================== WORKOUT EXERCISES ====================

  /**
   * Add exercise to workout
   */
  async addExerciseToWorkout(workoutId, exerciseData) {
    try {
      const exerciseToInsert = {
        completed_workout_id: workoutId,
        exercise_id: exerciseData.exerciseId || null,
        exercise_name: exerciseData.name,
        order_index: exerciseData.orderIndex || 0,
        target_sets: exerciseData.sets || 0,
        target_reps: exerciseData.reps || 0,
        target_weight_kg: exerciseData.weight || null,
        target_duration_seconds: exerciseData.duration || null,
        rest_time_seconds: exerciseData.restTime || 60
      };

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(exerciseToInsert)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        exercise: data
      };
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      return {
        success: false,
        error: error.message,
        exercise: null
      };
    }
  }

  /**
   * Update exercise performance
   */
  async updateExercisePerformance(exerciseId, performanceData) {
    try {
      const updateData = {
        sets_completed: performanceData.setsCompleted || 0,
        actual_reps: performanceData.actualReps || [],
        actual_weight_kg: performanceData.actualWeights || [],
        actual_duration_seconds: performanceData.actualDurations || [],
        completed: performanceData.completed || false,
        notes: performanceData.notes || ''
      };

      const { data, error } = await supabase
        .from('workout_exercises')
        .update(updateData)
        .eq('id', exerciseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        exercise: data
      };
    } catch (error) {
      console.error('Error updating exercise performance:', error);
      return {
        success: false,
        error: error.message,
        exercise: null
      };
    }
  }
}

export const workoutService = new WorkoutService();
