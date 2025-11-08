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

      // Get the highest confidence food item from predictions
      const food = nutritionResult.predictions[0];
      console.log('📊 Food identified:', food.name);

      // Generate AI recommendation based on nutrition and user goals
      const recommendation = await this.generateRecommendation(food, userProfile);
      
      return {
        success: true,
        food: {
          name: food.name,
          calories: food.nutrition?.calories || food.calories,
          protein: food.nutrition?.protein || food.protein,
          carbs: food.nutrition?.carbs || food.carbs,
          fat: food.nutrition?.fat || food.fat,
          fiber: food.nutrition?.fiber || food.fiber,
          sugar: food.nutrition?.sugar || food.sugar,
          sodium: food.nutrition?.sodium || food.sodium,
          confidence: food.confidence
        },
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
   * Generate AI-powered recommendation using Gemini
   */
  async generateRecommendation(food, userProfile) {
    try {
      const prompt = `
You are a nutrition expert providing personalized food recommendations. Analyze this food item and provide a recommendation.

FOOD ITEM:
- Name: ${food.name}
- Calories: ${food.nutrition?.calories || food.calories}
- Protein: ${food.nutrition?.protein || food.protein}g
- Carbs: ${food.nutrition?.carbs || food.carbs}g
- Fat: ${food.nutrition?.fat || food.fat}g
- Fiber: ${food.nutrition?.fiber || food.fiber}g
- Sugar: ${food.nutrition?.sugar || food.sugar}g
- Sodium: ${food.nutrition?.sodium || food.sodium}mg

USER PROFILE:
- Goals: ${userProfile.goals || 'General health and wellness'}
- Activity Level: ${userProfile.activityLevel || 'Moderate'}
- Dietary Restrictions: ${userProfile.restrictions || 'None specified'}

Provide a recommendation in this EXACT JSON format:
{
  "shouldEat": true/false,
  "score": 1-10,
  "reason": "Brief explanation of recommendation",
  "pros": ["Positive aspect 1", "Positive aspect 2"],
  "cons": ["Negative aspect 1", "Negative aspect 2"],
  "alternatives": ["Better alternative 1", "Better alternative 2"],
  "portionAdvice": "Specific portion recommendation"
}

Consider:
- Nutritional density and balance
- Processing level (whole vs processed foods)
- Sugar and sodium content
- Protein quality
- Micronutrient value
- Satiety factor
- Impact on energy levels
- Alignment with health goals

Be encouraging but honest. Focus on moderation and balance rather than strict restrictions.
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
   */
  generateBasicRecommendation(food) {
    const calories = food.calories || 0;
    const protein = food.protein || 0;
    const fiber = food.fiber || 0;
    const sugar = food.sugar || 0;
    const sodium = food.sodium || 0;
    
    let score = 5; // Start neutral
    let pros = [];
    let cons = [];
    
    // Positive factors
    if (protein > 10) {
      score += 1;
      pros.push('Good protein content');
    }
    if (fiber > 3) {
      score += 1;
      pros.push('High in fiber');
    }
    if (calories < 200) {
      score += 0.5;
      pros.push('Moderate calorie content');
    }
    
    // Negative factors
    if (sugar > 15) {
      score -= 1.5;
      cons.push('High in sugar');
    }
    if (sodium > 600) {
      score -= 1;
      cons.push('High in sodium');
    }
    if (calories > 400) {
      score -= 0.5;
      cons.push('High calorie density');
    }
    
    // Ensure score is within bounds
    score = Math.max(1, Math.min(10, Math.round(score)));
    
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
