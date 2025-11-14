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
  // Generate concise suggestion for banner display
  async generateConciseSuggestion(user, weeklyNutritionData) {
    try {
      // Check if user has any nutrition data
      const totalMeals = weeklyNutritionData.reduce((sum, day) => sum + day.mealCount, 0);
      
      if (totalMeals === 0) {
        return {
          success: true,
          insight: {
            suggestion: "Start by logging your next meal to get personalized nutrition tips!"
          }
        };
      }

      // Calculate averages and trends
      const avgCalories = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.calories, 0) / 7);
      const avgProtein = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.protein, 0) / 7);
      const avgCarbs = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.carbs, 0) / 7);
      const avgFat = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.fat, 0) / 7);
      const avgSugar = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.sugar, 0) / 7);
      const avgSodium = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.sodium, 0) / 7);
      
      const calorieGoal = user?.calorie_goal || 2000;
      const daysOverGoal = weeklyNutritionData.filter(day => day.calories > calorieGoal).length;
      const daysWayOver = weeklyNutritionData.filter(day => day.calories > calorieGoal * 1.2).length;
      const daysTracked = weeklyNutritionData.filter(day => day.mealCount > 0).length;
      
      // Calculate macro percentages
      const totalCaloriesFromMacros = (avgProtein * 4) + (avgCarbs * 4) + (avgFat * 9);
      const proteinPercent = Math.round((avgProtein * 4 / totalCaloriesFromMacros) * 100);
      const carbsPercent = Math.round((avgCarbs * 4 / totalCaloriesFromMacros) * 100);
      const fatPercent = Math.round((avgFat * 9 / totalCaloriesFromMacros) * 100);

      const prompt = `As a nutrition coach, analyze this 7-day nutrition data and provide ONE concise, specific suggestion:

WEEKLY SUMMARY:
- Days tracked: ${daysTracked}/7
- Days over calorie goal: ${daysOverGoal}/7
- Days significantly over (>20%): ${daysWayOver}/7

DAILY AVERAGES:
- Calories: ${avgCalories} (goal: ${calorieGoal}, ${avgCalories > calorieGoal ? 'OVER by ' + (avgCalories - calorieGoal) : 'under by ' + (calorieGoal - avgCalories)})
- Protein: ${avgProtein}g (${proteinPercent}% of calories)
- Carbs: ${avgCarbs}g (${carbsPercent}% of calories)
- Fat: ${avgFat}g (${fatPercent}% of calories)
- Sugar: ${avgSugar}g/day
- Sodium: ${avgSodium}mg/day

ANALYSIS PRIORITIES:
1. If consistently over calories (${daysOverGoal}+ days): Address calorie intake
2. If protein is low (<20% of calories): Suggest high-protein foods
3. If carbs are very high (>50% of calories): Suggest better balance
4. If fat is excessive (>35% of calories): Suggest lighter alternatives
5. If sugar is high (>50g/day): Suggest low-sugar swaps
6. If sodium is high (>2500mg/day): Suggest low-sodium options
7. If tracking is inconsistent (<5 days): Encourage consistency

Provide ONE specific, actionable suggestion in JSON:
{
  "suggestion": "Specific food advice addressing the #1 priority (max 30 words)"
}

Be direct about issues but constructive. Examples:
"You're averaging ${avgCalories - calorieGoal}cal over your goal daily. Try smaller portions or replace snacks with vegetables."
"Boost protein to 25%+ of calories with Greek yogurt, chicken, or eggs at each meal."
"Cut sugar from ${avgSugar}g to <40g by swapping soda for sparkling water and fruit for dessert."`;

      const result = await this.callGeminiAPI(prompt);
      return this.parseCoachingResponse(result);
      
    } catch (error) {
      console.error('Error generating concise suggestion:', error);
      return this.getFallbackInsight(weeklyNutritionData);
    }
  },

  // Generate detailed but concise analysis for expanded view
  async generateWeeklyCoachingInsight(user, weeklyNutritionData) {
    try {
      // Check if user has any nutrition data
      const totalMeals = weeklyNutritionData.reduce((sum, day) => sum + day.mealCount, 0);
      
      if (totalMeals === 0) {
        return {
          success: true,
          insight: {
            weeklyInsight: "Start tracking your meals to unlock personalized insights!",
            achievements: ["Signed up for Core+"],
            concerns: [],
            recommendations: {
              calories: "Begin by logging your meals to see calorie patterns",
              macros: "Track protein, carbs, and fats for balanced nutrition"
            },
            redFlags: [],
            weeklyScore: 75
          }
        };
      }

      const avgCalories = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.calories, 0) / 7);
      const avgProtein = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.protein, 0) / 7);
      const avgCarbs = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.carbs, 0) / 7);
      const avgFat = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.fat, 0) / 7);
      const avgSugar = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.sugar, 0) / 7);
      const avgSodium = Math.round(weeklyNutritionData.reduce((sum, day) => sum + day.sodium, 0) / 7);

      const calorieGoal = user?.calorie_goal || 2000;
      const prompt = `As a nutrition coach, provide a concise weekly analysis in JSON format:

WEEKLY AVERAGES:
- Calories: ${avgCalories} (goal: ${calorieGoal})
- Protein: ${avgProtein}g, Carbs: ${avgCarbs}g, Fat: ${avgFat}g
- Sugar: ${avgSugar}g, Sodium: ${avgSodium}mg

{
  "weeklyInsight": "One sentence summary (max 20 words)",
  "achievements": ["One positive thing they did well (max 15 words)"],
  "concerns": ["One area needing attention (max 15 words)" or leave empty if none],
  "recommendations": {
    "calories": "Specific calorie advice (max 15 words)",
    "macros": "Macro balance tip (max 15 words)"
  },
  "redFlags": ["Health concern if calories<1200 or >3000" or leave empty],
  "weeklyScore": 85
}

Be concise, actionable, and supportive.`;

      const result = await this.callGeminiAPI(prompt);
      return this.parseDetailedCoachingResponse(result);
      
    } catch (error) {
      console.error('Error generating weekly insight:', error);
      return this.getDetailedFallbackInsight(weeklyNutritionData);
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

  // Parse AI response for concise suggestion
  parseCoachingResponse(responseText) {
    try {
      // Clean up the response text
      const cleanText = responseText
        .replace(/```json|```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields for new format
      if (!parsed.suggestion) {
        throw new Error('Invalid response structure - missing suggestion');
      }
      
      return {
        success: true,
        insight: {
          suggestion: parsed.suggestion
        }
      };
    } catch (error) {
      console.error('Error parsing coaching response:', error);
      return this.getFallbackInsight();
    }
  },

  // Parse AI response for detailed analysis
  parseDetailedCoachingResponse(responseText) {
    try {
      // Clean up the response text
      const cleanText = responseText
        .replace(/```json|```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.weeklyInsight) {
        throw new Error('Invalid detailed response structure');
      }
      
      return {
        success: true,
        insight: parsed
      };
    } catch (error) {
      console.error('Error parsing detailed coaching response:', error);
      return this.getDetailedFallbackInsight();
    }
  },

  // Fallback insight when AI fails (concise)
  getFallbackInsight(weeklyData = []) {
    const totalMeals = weeklyData.reduce((sum, day) => sum + (day.mealCount || 0), 0);
    
    if (totalMeals === 0) {
      // Onboarding suggestions for new users
      const onboardingSuggestions = [
        "Start by logging your next meal to get personalized nutrition tips!",
        "Track your breakfast to begin building healthy habits!",
        "Log a meal using the camera or search to get started!",
        "Add your first meal to unlock personalized coaching insights!"
      ];
      const randomOnboarding = onboardingSuggestions[Math.floor(Math.random() * onboardingSuggestions.length)];
      
      return {
        success: true,
        insight: {
          suggestion: randomOnboarding
        }
      };
    }

    // Regular suggestions for users with some data
    const suggestions = [
      "Add more vegetables to your meals for better nutrition.",
      "Try lean protein sources like chicken, fish, or tofu.",
      "Stay hydrated with water throughout the day.",
      "Include whole grains for sustained energy.",
      "Balance your meals with healthy fats from nuts or avocado."
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    return {
      success: true,
      insight: {
        suggestion: randomSuggestion
      }
    };
  },

  // Detailed fallback insight when AI fails
  getDetailedFallbackInsight(weeklyData = []) {
    const totalMeals = weeklyData.reduce((sum, day) => sum + (day.mealCount || 0), 0);
    
    if (totalMeals === 0) {
      return {
        success: true,
        insight: {
          weeklyInsight: "Start tracking meals for personalized insights!",
          achievements: ["Joined Core+ for better health"],
          concerns: [],
          recommendations: {
            calories: "Log meals to see your calorie patterns",
            macros: "Track protein, carbs, and fats daily"
          },
          redFlags: [],
          weeklyScore: 75
        }
      };
    }

    const avgCalories = Math.round(weeklyData.reduce((sum, day) => sum + (day.calories || 0), 0) / weeklyData.length);
    
    return {
      success: true,
      insight: {
        weeklyInsight: "Keep up the consistent meal tracking!",
        achievements: ["Maintaining regular meal logging"],
        concerns: avgCalories < 1200 ? ["Low calorie intake detected"] : [],
        recommendations: {
          calories: avgCalories < 1200 ? "Consider increasing healthy calories" : "Maintain current calorie approach",
          macros: "Focus on balanced meals with all macros"
        },
        redFlags: avgCalories < 1000 ? ["Very low calories - consult healthcare provider"] : [],
        weeklyScore: Math.min(90, Math.max(60, Math.round((avgCalories / 2000) * 100)))
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
