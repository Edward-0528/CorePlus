import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../supabaseConfig';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

class WorkoutPlanService {
  constructor() {
    // Use API key or fallback for bundling  
    const apiKey = GEMINI_API_KEY || 'fallback-key-for-bundling';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
  }

  async initializeModel() {
    if (!this.model) {
      try {
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash-8b",
          generationConfig: {
            temperature: 0.3,
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 2000,
          },
        });
        console.log('🤖 Gemini model initialized for workout planning');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini model:', error);
        throw error;
      }
    }
    return this.model;
  }

  /**
   * Generate an adaptive workout plan using Gemini AI based on user profile
   */
  async generateAdaptivePlan(userId, userProfile, options = {}) {
    try {
      const { preview = false } = options;
      
      console.log('🏋️ Generating adaptive workout plan for user:', userId);
      console.log('📊 User profile:', userProfile);

      const model = await this.initializeModel();

      // Create detailed prompt for Gemini
      const prompt = this.createWorkoutPrompt(userProfile);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 Gemini workout plan response:', text);

      // Parse the AI response
      const planData = this.parseWorkoutPlan(text, userProfile);

      if (!planData) {
        throw new Error('Failed to parse workout plan from AI response');
      }

      // If preview requested, return without saving
      if (preview) {
        return { 
          success: true, 
          preview: true, 
          plan: planData,
          aiGenerated: true
        };
      }

      // Save to database
      const savedPlan = await this.savePlanToDatabase(userId, planData);
      
      return {
        success: true,
        plan: savedPlan,
        aiGenerated: true
      };

    } catch (error) {
      console.error('❌ Error generating adaptive workout plan:', error);
      return {
        success: false,
        error: error.message,
        plan: null
      };
    }
  }

  /**
   * Create a detailed prompt for Gemini based on user profile
   */
  createWorkoutPrompt(userProfile) {
    const {
      mainGoal,
      activities = [],
      age,
      weight,
      height,
      goalWeight,
      experience = 'beginner',
      daysPerWeek = 3,
      sessionLength = 30,
      equipment = []
    } = userProfile;

    // Map goals to descriptions
    const goalDescriptions = {
      'lose_weight': 'lose weight and burn fat',
      'build_muscle': 'build muscle and gain strength', 
      'keep_fit': 'maintain fitness and stay healthy',
      'gain_muscle': 'build muscle and gain strength',
      'improve_endurance': 'improve cardiovascular endurance',
      'general_fitness': 'improve overall fitness',
      'strength_training': 'build strength and power'
    };

    // Map activities to exercise preferences
    const activityPreferences = activities.map(activity => {
      const activityMap = {
        'fitness_home': 'home workouts',
        'calisthenics': 'bodyweight exercises',
        'walking': 'walking and cardio',
        'running': 'running and cardio',
        'hiit': 'high-intensity interval training',
        'yoga': 'yoga and flexibility',
        'dancing': 'dance fitness',
        'gym': 'gym equipment',
        'fighting': 'martial arts and combat sports'
      };
      return activityMap[activity] || activity;
    }).join(', ');

    return `
You are an expert fitness trainer and exercise physiologist. Create a personalized, adaptive workout plan that rotates muscle groups to prevent strain and overtraining.

User Profile:
- Primary Goal: ${goalDescriptions[mainGoal] || mainGoal}
- Age: ${age || 'Not specified'}
- Current Weight: ${weight} lbs
- Target Weight: ${goalWeight} lbs
- Height: ${height ? `${Math.floor(height/12)}'${height%12}"` : 'Not specified'}
- Experience Level: ${experience}
- Available Days per Week: ${daysPerWeek}
- Session Length: ${sessionLength} minutes
- Preferred Activities: ${activityPreferences || 'General fitness'}
- Available Equipment: ${equipment.length ? equipment.join(', ') : 'Bodyweight/minimal equipment'}

Requirements:
1. Create a ${daysPerWeek}-day per week plan
2. Each workout should be approximately ${sessionLength} minutes
3. Ensure proper muscle group rotation to prevent overtraining
4. Include both strength and cardio elements
5. Scale exercises appropriately for ${experience} level
6. Focus on ${goalDescriptions[mainGoal] || mainGoal}
7. Include warm-up and cool-down periods
8. Provide progression guidelines for each week

Important Safety Guidelines:
- Rotate upper body, lower body, and full body focus across days
- Include at least 24-48 hours rest between training the same muscle groups
- Progress gradually to prevent injury
- Include proper form instructions

Return ONLY a valid JSON object with this exact structure:

{
  "plan_name": "Descriptive plan name",
  "description": "Brief description of the plan approach",
  "duration_weeks": 12,
  "days_per_week": ${daysPerWeek},
  "weekly_schedule": [
    {
      "day": 1,
      "focus": "Upper Body/Lower Body/Full Body/Cardio",
      "workout_name": "Workout name",
      "duration_minutes": ${sessionLength},
      "exercises": [
        {
          "name": "Exercise name",
          "type": "strength/cardio/flexibility",
          "target_muscles": ["list", "of", "muscles"],
          "sets": 3,
          "reps": "8-12 or time/distance",
          "rest_seconds": 60,
          "instructions": "Clear form instructions",
          "beginner_modification": "Easier version if needed",
          "advanced_progression": "Harder version for progression"
        }
      ],
      "warm_up": ["5 minutes light cardio", "Dynamic stretching"],
      "cool_down": ["5 minutes stretching", "Deep breathing"]
    }
  ],
  "weekly_progression": {
    "week_1_2": "Focus and intensity level",
    "week_3_4": "Progression changes",
    "week_5_8": "Mid-plan adjustments",
    "week_9_12": "Advanced progressions"
  },
  "safety_notes": [
    "Important safety reminders",
    "Signs to rest or modify",
    "Injury prevention tips"
  ],
  "nutrition_tips": [
    "Basic nutrition advice for goal",
    "Hydration reminders",
    "Recovery nutrition"
  ]
}

Ensure the plan rotates muscle groups effectively - for example:
- Day 1: Upper body strength
- Day 2: Lower body strength  
- Day 3: Cardio/Full body
- Day 4: Upper body (different focus)
- Day 5: Lower body (different focus)

Return only the JSON object, no additional text.
`;
  }

  /**
   * Parse the AI-generated workout plan
   */
  parseWorkoutPlan(text, userProfile) {
    try {
      // Clean the response to extract JSON
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Find JSON object boundaries
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON object found in response');
      }
      
      const jsonString = cleanedText.slice(jsonStart, jsonEnd);
      const planData = JSON.parse(jsonString);

      // Validate required fields
      if (!planData.plan_name || !planData.weekly_schedule || !Array.isArray(planData.weekly_schedule)) {
        throw new Error('Invalid plan structure from AI');
      }

      // Add metadata
      planData.created_at = new Date().toISOString();
      planData.user_profile = userProfile;
      planData.ai_generated = true;

      return planData;

    } catch (error) {
      console.error('❌ Error parsing workout plan:', error);
      console.log('📝 Raw AI response:', text);
      return null;
    }
  }

  /**
   * Save the workout plan to the database
   */
  async savePlanToDatabase(userId, planData) {
    try {
      // Save main plan
      const { data: savedPlan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: userId,
          name: planData.plan_name,
          description: planData.description,
          start_date: new Date().toISOString(),
          duration_weeks: planData.duration_weeks || 12,
          plan_metadata: {
            ai_generated: true,
            days_per_week: planData.days_per_week,
            weekly_schedule: planData.weekly_schedule,
            weekly_progression: planData.weekly_progression,
            safety_notes: planData.safety_notes,
            nutrition_tips: planData.nutrition_tips,
            user_profile: planData.user_profile
          }
        })
        .select()
        .single();

      if (planError) {
        throw planError;
      }

      // Save individual workouts
      const workoutRows = planData.weekly_schedule.map((workout, index) => ({
        plan_id: savedPlan.id,
        week_number: 1, // Starting week
        day_of_week: workout.day,
        workout_json: {
          workout_name: workout.workout_name,
          focus: workout.focus,
          duration_minutes: workout.duration_minutes,
          exercises: workout.exercises,
          warm_up: workout.warm_up,
          cool_down: workout.cool_down
        }
      }));

      const { error: workoutsError } = await supabase
        .from('plan_workouts')
        .insert(workoutRows);

      if (workoutsError) {
        throw workoutsError;
      }

      console.log('✅ Workout plan saved successfully');
      return { ...savedPlan, workouts: planData.weekly_schedule };

    } catch (error) {
      console.error('❌ Error saving workout plan:', error);
      throw error;
    }
  }

  /**
   * Get user's active workout plan
   */
  async getUserActivePlan(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          plan_workouts (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return {
        success: true,
        plan: data
      };

    } catch (error) {
      console.error('❌ Error fetching user plan:', error);
      return {
        success: false,
        error: error.message,
        plan: null
      };
    }
  }

  /**
   * Get user's fitness profile for plan generation
   */
  async getUserFitnessProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        profile: data
      };

    } catch (error) {
      console.error('❌ Error fetching user fitness profile:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }
}

// Export singleton instance
export const workoutPlanService = new WorkoutPlanService();
