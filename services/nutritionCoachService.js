// AI Nutrition Coach Service
// Provides personalized nutrition insights and recommendations

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseConfig';
import { mealService } from './mealService';

const getGeminiApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const getGeminiApiUrl = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not available');
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
};

export const nutritionCoachService = {
  // Generate weekly nutrition analysis and recommendations
  async generateWeeklyCoachingInsight(user, weeklyNutritionData) {
    try {
      const prompt = `As a certified nutrition coach, analyze this user's 7-day nutrition data and provide personalized insights:

USER PROFILE:
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}
- Activity Level: ${user?.activity_level || 'Moderate'}
- Goals: ${user?.fitness_goals || 'General health'}
- Daily Calorie Goal: ${user?.calorie_goal || 2000}
- Health Conditions: ${user?.health_conditions || 'None specified'}

PAST 7 DAYS NUTRITION DATA:
${weeklyNutritionData.map((day, index) => `
Day ${index + 1} (${day.date}):
- Calories: ${day.calories} / ${user?.calorie_goal || 2000} goal
- Protein: ${day.protein}g 
- Carbs: ${day.carbs}g
- Fat: ${day.fat}g
- Fiber: ${day.fiber}g
- Sugar: ${day.sugar}g
- Sodium: ${day.sodium}mg
- Meals: ${day.mealCount}
`).join('')}

WEEKLY AVERAGES:
- Average Daily Calories: ${weeklyNutritionData.reduce((sum, day) => sum + day.calories, 0) / 7}
- Average Protein: ${weeklyNutritionData.reduce((sum, day) => sum + day.protein, 0) / 7}g
- Average Carbs: ${weeklyNutritionData.reduce((sum, day) => sum + day.carbs, 0) / 7}g
- Average Fat: ${weeklyNutritionData.reduce((sum, day) => sum + day.fat, 0) / 7}g

Provide analysis in JSON format:
{
  "weeklyInsight": "2-3 sentence summary of their week",
  "achievements": ["positive things they did well"],
  "concerns": ["areas that need attention"],
  "recommendations": {
    "calories": "specific calorie guidance",
    "macros": "macro balance recommendations", 
    "nutrients": "micronutrient guidance",
    "behavior": "behavioral/timing recommendations"
  },
  "redFlags": ["urgent health concerns to watch"],
  "encouragement": "motivational message",
  "weeklyScore": 85
}

Focus on:
1. Calorie consistency vs goals
2. Macro balance (protein adequacy, carb quality, healthy fats)
3. Nutritional gaps (fiber, excessive sugar/sodium)
4. Eating patterns and meal frequency
5. Health red flags (excessive calories, very low protein, etc.)

Be supportive but honest. Provide actionable, specific advice.`;

      const result = await this.callGeminiAPI(prompt);
      return this.parseCoachingResponse(result);
      
    } catch (error) {
      console.error('Error generating coaching insight:', error);
      return this.getFallbackInsight(weeklyNutritionData);
    }
  },

  // Get last 7 days of nutrition data
  async getWeeklyNutritionData(userId) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days

      const { data: meals, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .gte('meal_date', startDate.toISOString().split('T')[0])
        .lte('meal_date', endDate.toISOString().split('T')[0])
        .order('meal_date', { ascending: true });

      if (error) throw error;

      // Group by date and calculate daily totals
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayMeals = meals.filter(meal => meal.meal_date === dateStr);
        const dayTotals = dayMeals.reduce((totals, meal) => ({
          calories: totals.calories + (meal.calories || 0),
          protein: totals.protein + (meal.protein || 0),
          carbs: totals.carbs + (meal.carbs || 0),
          fat: totals.fat + (meal.fat || 0),
          fiber: totals.fiber + (meal.fiber || 0),
          sugar: totals.sugar + (meal.sugar || 0),
          sodium: totals.sodium + (meal.sodium || 0),
          mealCount: totals.mealCount + 1
        }), {
          calories: 0, protein: 0, carbs: 0, fat: 0,
          fiber: 0, sugar: 0, sodium: 0, mealCount: 0
        });

        dailyData.push({
          date: dateStr,
          ...dayTotals
        });
      }

      return dailyData;
    } catch (error) {
      console.error('Error fetching weekly nutrition data:', error);
      throw error;
    }
  },

  // Call Gemini API
  async callGeminiAPI(prompt) {
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(getGeminiApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  // Parse AI response
  parseCoachingResponse(responseText) {
    try {
      // Clean up the response text
      const cleanText = responseText
        .replace(/```json|```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.weeklyInsight || !parsed.recommendations) {
        throw new Error('Invalid response structure');
      }
      
      return {
        success: true,
        insight: parsed
      };
    } catch (error) {
      console.error('Error parsing coaching response:', error);
      return this.getFallbackInsight();
    }
  },

  // Fallback insight when AI fails
  getFallbackInsight(weeklyData = []) {
    const avgCalories = weeklyData.length > 0 
      ? Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / weeklyData.length)
      : 0;

    return {
      success: true,
      insight: {
        weeklyInsight: "Keep up the great work with your nutrition tracking! Consistency is key to reaching your goals.",
        achievements: ["Consistent meal logging", "Staying engaged with your health"],
        concerns: avgCalories < 1200 ? ["Low calorie intake detected"] : [],
        recommendations: {
          calories: avgCalories < 1200 ? "Consider increasing calorie intake for better health" : "Maintain your current approach",
          macros: "Focus on balanced meals with protein, healthy carbs, and good fats",
          nutrients: "Ensure adequate fiber and limit processed foods",
          behavior: "Keep up the consistent tracking habits"
        },
        redFlags: avgCalories < 1000 ? ["Very low calorie intake - consider consulting a healthcare provider"] : [],
        encouragement: "You're building excellent nutrition awareness habits!",
        weeklyScore: Math.min(85, Math.max(60, Math.round(avgCalories / 20)))
      }
    };
  },

  // Cache coaching insights to avoid frequent API calls
  async getCachedOrFreshInsight(userId) {
    const cacheKey = `nutrition_coach_${userId}_${new Date().toISOString().split('T')[0]}`;
    
    try {
      // Check cache first (daily cache)
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - parsedCache.timestamp;
        
        // Use cache if less than 6 hours old
        if (cacheAge < 6 * 60 * 60 * 1000) {
          return parsedCache.insight;
        }
      }

      // Get fresh insight
      const weeklyData = await this.getWeeklyNutritionData(userId);
      const { data: user } = await supabase.auth.getUser();
      const result = await this.generateWeeklyCoachingInsight(user.user, weeklyData);

      // Cache the result
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        insight: result,
        timestamp: Date.now()
      }));

      return result;
    } catch (error) {
      console.error('Error getting coaching insight:', error);
      return this.getFallbackInsight();
    }
  }
};
