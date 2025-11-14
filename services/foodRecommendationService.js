import { geminiService } from './geminiService';
import { foodAnalysisService } from '../foodAnalysisService';
import usageTrackingService from './usageTrackingService';

/**
 * Food Recommendation Service
 * Provides AI-powered "Should I Eat It?" recommendations based on nutrition and health goals
 */

class FoodRecommendationService {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Analyze food and provide personalized recommendation
   */
  async shouldIEatIt(imageUri, userProfile = {}) {
    try {
      console.log('🤔 Analyzing food for recommendation...');
      
      // First, get nutritional analysis of the food
      const nutritionResult = await foodAnalysisService.analyzeFoodImage(imageUri);
      
      if (!nutritionResult.success || !nutritionResult.predictions || nutritionResult.predictions.length === 0) {
        return {
          success: false,
          error: 'Could not identify the food item'
        };
      }

      // Analyze ALL detected foods for complete meal assessment
      const allFoods = nutritionResult.predictions;
      console.log('📊 Foods identified:', allFoods.map(f => f.name).join(', '));

      // Calculate combined nutritional totals for the entire meal
      const combinedNutrition = this.combineNutritionData(allFoods);
      
      // Create meal object with all foods
      const meal = {
        name: allFoods.length > 1 
          ? `${allFoods.map(f => f.name).join(' + ')}` 
          : allFoods[0].name,
        foods: allFoods,
        ...combinedNutrition,
        confidence: Math.min(...allFoods.map(f => f.confidence || 0.85))
      };

      console.log('🍽️ Complete meal analysis:', meal.name);
      console.log('📊 Total calories:', meal.calories);

      // Generate AI recommendation based on complete meal nutrition
      const recommendation = await this.generateRecommendation(meal, userProfile);
      
      return {
        success: true,
        food: meal,
        recommendation: {
          shouldEat: recommendation.shouldEat,
          score: recommendation.score, // 1-10 health score
          reason: recommendation.reason,
          pros: recommendation.pros,
          cons: recommendation.cons,
          betterAlternatives: recommendation.alternatives,
          portionAdvice: recommendation.portionAdvice
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Food recommendation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Combine nutrition data from multiple food items
   */
  combineNutritionData(foods) {
    return {
      calories: foods.reduce((sum, food) => sum + (food.nutrition?.calories || food.calories || 0), 0),
      protein: foods.reduce((sum, food) => sum + (food.nutrition?.protein || food.protein || 0), 0),
      carbs: foods.reduce((sum, food) => sum + (food.nutrition?.carbs || food.carbs || 0), 0),
      fat: foods.reduce((sum, food) => sum + (food.nutrition?.fat || food.fat || 0), 0),
      fiber: foods.reduce((sum, food) => sum + (food.nutrition?.fiber || food.fiber || 0), 0),
      sugar: foods.reduce((sum, food) => sum + (food.nutrition?.sugar || food.sugar || 0), 0),
      sodium: foods.reduce((sum, food) => sum + (food.nutrition?.sodium || food.sodium || 0), 0)
    };
  }

  /**
   * Generate AI-powered recommendation using Gemini
   */
  async generateRecommendation(food, userProfile) {
    try {
      // Check if this is a combo meal (multiple foods)
      const isComboMeal = food.foods && food.foods.length > 1;
      const foodDetails = isComboMeal 
        ? `COMPLETE MEAL (${food.foods.length} items):\n${food.foods.map(f => `  • ${f.name}: ${f.calories || 'N/A'} cal`).join('\n')}`
        : `SINGLE FOOD ITEM: ${food.name}`;

      const prompt = `
You are a nutrition expert providing personalized food recommendations. Analyze this ${isComboMeal ? 'complete meal' : 'food item'} and provide a recommendation.

${foodDetails}

TOTAL NUTRITION:
- Calories: ${food.calories}
- Protein: ${food.protein}g
- Carbs: ${food.carbs}g
- Fat: ${food.fat}g
- Fiber: ${food.fiber}g
- Sugar: ${food.sugar}g
- Sodium: ${food.sodium}mg

USER PROFILE:
- Goals: ${userProfile.goals || 'General health and wellness'}
- Activity Level: ${userProfile.activityLevel || 'Moderate'}
- Dietary Restrictions: ${userProfile.restrictions || 'None specified'}

${isComboMeal ? `
IMPORTANT: This is a COMBO MEAL with multiple items. Consider:
- The combination of all foods together
- Total caloric load of the entire meal
- Balance (or imbalance) between components
- Whether the combination is healthy even if individual items seem okay
- Example: "Chicken and Waffles" = fried chicken (high fat/sodium) + waffles (refined carbs/sugar) = unhealthy combo despite having some protein
` : ''}

HEALTH SCORING RUBRIC (1-10):

🟢 EXCELLENT (9-10): 
- Whole, minimally processed foods
- High protein (>20g), low sugar (<5g), moderate calories
- Rich in fiber (>8g) and micronutrients
- Examples: Grilled salmon with vegetables, quinoa bowl with chicken

🟢 VERY GOOD (7-8):
- Mostly whole foods with some processing
- Good protein (15-20g), moderate sugar (5-10g)
- Decent fiber (4-8g)
- Examples: Greek yogurt parfait, turkey sandwich on whole grain

🟡 GOOD (5-6):
- Mix of whole and processed foods
- Moderate protein (10-15g), higher sugar (10-20g)
- Some nutritional value but not optimal
- Examples: Pasta with marinara, cheese pizza (1-2 slices)

🟠 POOR (3-4):
- Heavily processed, fried, or high-sugar foods
- Low protein (<10g), high sugar (>20g), high sodium (>800mg)
- Minimal fiber and nutrients
- Examples: Fast food burger, fried chicken, candy bar

🔴 VERY POOR (1-2):
- Ultra-processed junk food
- Extremely high calories (>800), sugar (>40g), or sodium (>1500mg)
- Almost no nutritional value
- Examples: Large milkshake, double cheeseburger meal, fried desserts

⚠️ SCORING GUIDELINES:
- Calories >600 for single item = -2 points
- Sugar >15g = -1 point, >30g = -2 points
- Sodium >800mg = -1 point, >1500mg = -2 points
- Fried foods = -2 points
- Refined carbs without fiber = -1 point
- Protein >20g = +1 point
- Fiber >8g = +1 point
- Whole food/unprocessed = +1 point
${isComboMeal ? `\n- COMBO MEALS: Start at 4/10 baseline, adjust based on ingredients. Fried+sugary combinations should score 2-3/10.` : ''}

Provide a recommendation in this EXACT JSON format:
{
  "shouldEat": true/false,
  "score": 1-10,
  "reason": "Brief explanation with SPECIFIC reference to scoring criteria",
  "pros": ["Positive aspect 1", "Positive aspect 2"],
  "cons": ["Negative aspect 1", "Negative aspect 2"],
  "alternatives": ["Better alternative 1", "Better alternative 2"],
  "portionAdvice": "Specific portion recommendation"
}

CRITICAL: Use the FULL 1-10 scale. Don't default to 5-6. Be honest and specific. Bad foods should get 1-3, excellent foods should get 9-10.
`;

      const response = await geminiService.generateContent(prompt);
      
      if (!response.success) {
        // Fallback to basic analysis if AI fails
        return this.generateBasicRecommendation(food);
      }

      try {
        // Clean and parse the JSON response
        let jsonText = response.text.trim();
        if (jsonText.includes('```json')) {
          jsonText = jsonText.match(/```json\n(.*?)\n```/s)?.[1] || jsonText;
        }
        if (jsonText.includes('```')) {
          jsonText = jsonText.replace(/```/g, '');
        }
        
        const recommendation = JSON.parse(jsonText);
        
        // Validate the response structure
        if (!recommendation.hasOwnProperty('shouldEat') || !recommendation.score) {
          throw new Error('Invalid recommendation format');
        }
        
        return recommendation;
        
      } catch (parseError) {
        console.error('Failed to parse AI recommendation:', parseError);
        return this.generateBasicRecommendation(food);
      }
      
    } catch (error) {
      console.error('AI recommendation failed:', error);
      return this.generateBasicRecommendation(food);
    }
  }

  /**
   * Fallback basic recommendation based on nutritional heuristics
   * Uses the same scoring rubric as AI for consistency
   */
  generateBasicRecommendation(food) {
    const calories = food.calories || 0;
    const protein = food.protein || 0;
    const carbs = food.carbs || 0;
    const fat = food.fat || 0;
    const fiber = food.fiber || 0;
    const sugar = food.sugar || 0;
    const sodium = food.sodium || 0;
    
    // Start with baseline score based on food type detection
    let score = 5;
    let pros = [];
    let cons = [];
    
    // Check if it's a combo meal
    const isComboMeal = food.foods && food.foods.length > 1;
    if (isComboMeal) {
      score = 4; // Combo meals start lower
    }
    
    // POSITIVE FACTORS (can add up to +5 points)
    if (protein >= 20) {
      score += 2;
      pros.push('Excellent protein content (20g+)');
    } else if (protein >= 15) {
      score += 1;
      pros.push('Good protein content (15-20g)');
    } else if (protein >= 10) {
      score += 0.5;
      pros.push('Moderate protein (10-15g)');
    }
    
    if (fiber >= 8) {
      score += 1.5;
      pros.push('Very high in fiber (8g+)');
    } else if (fiber >= 4) {
      score += 1;
      pros.push('Good fiber content (4-8g)');
    }
    
    if (calories < 300 && protein > 15) {
      score += 1;
      pros.push('Nutrient-dense with moderate calories');
    }
    
    // NEGATIVE FACTORS (can subtract up to -8 points)
    if (calories > 800) {
      score -= 3;
      cons.push('Extremely high calories (800+)');
    } else if (calories > 600) {
      score -= 2;
      cons.push('Very high calories (600+)');
    } else if (calories > 400) {
      score -= 1;
      cons.push('High calorie density');
    }
    
    if (sugar > 40) {
      score -= 3;
      cons.push('Extremely high sugar (40g+)');
    } else if (sugar > 30) {
      score -= 2;
      cons.push('Very high sugar (30g+)');
    } else if (sugar > 15) {
      score -= 1.5;
      cons.push('High in sugar (15g+)');
    }
    
    if (sodium > 1500) {
      score -= 2;
      cons.push('Extremely high sodium (1500mg+)');
    } else if (sodium > 800) {
      score -= 1;
      cons.push('High in sodium (800mg+)');
    }
    
    // Detect likely fried foods (high fat with low fiber)
    if (fat > 30 && fiber < 3) {
      score -= 2;
      cons.push('Likely fried or heavily processed (high fat, low fiber)');
    }
    
    // Poor macro balance
    const proteinRatio = protein / (carbs + 1); // Avoid division by zero
    if (proteinRatio < 0.15 && carbs > 40) {
      score -= 1;
      cons.push('Poor protein-to-carb ratio');
    }
    
    // Ensure score is within bounds (1-10)
    score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
    
    const shouldEat = score >= 6;
    
    return {
      shouldEat,
      score,
      reason: shouldEat 
        ? 'This food has decent nutritional value and can be part of a balanced diet'
        : 'This food is high in calories/sugar/sodium - enjoy in moderation',
      pros: pros.length > 0 ? pros : ['Contains some beneficial nutrients'],
      cons: cons.length > 0 ? cons : ['Could be more nutrient-dense'],
      alternatives: [
        'Fresh fruits and vegetables',
        'Lean proteins',
        'Whole grains'
      ],
      portionAdvice: shouldEat ? 'Normal portion size' : 'Small portion or save for special occasions'
    };
  }

  /**
   * Get recommendation color based on score
   */
  getRecommendationColor(score) {
    if (score >= 8) return '#4CAF50'; // Green - Excellent
    if (score >= 6) return '#8BC34A'; // Light Green - Good
    if (score >= 4) return '#FFC107'; // Yellow - Okay
    if (score >= 2) return '#FF9800'; // Orange - Caution
    return '#F44336'; // Red - Avoid
  }

  /**
   * Get recommendation emoji based on score
   */
  getRecommendationEmoji(shouldEat, score) {
    if (!shouldEat) return '❌';
    if (score >= 8) return '✅';
    if (score >= 6) return '👍';
    if (score >= 4) return '🤔';
    return '⚠️';
  }

  /**
   * Get recommendation title based on score
   */
  getRecommendationTitle(shouldEat, score) {
    if (score >= 8) return 'Great Choice!';
    if (score >= 6) return 'Good Option';
    if (score >= 4) return 'Okay in Moderation';
    if (score >= 2) return 'Think Twice';
    return 'Better Avoided';
  }
}

export default new FoodRecommendationService();
