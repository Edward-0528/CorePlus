import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get API key dynamically (ensures availability in production)
const getGeminiApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY;

class FoodSearchService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.RATE_LIMIT_DELAY = 1000; // 1 second between requests
  }

  // Check if API key is available dynamically
  hasApiKey() {
    return !!getGeminiApiKey();
  }

  async initializeModel() {
    if (!this.hasApiKey()) {
      console.log('No Gemini API key available, skipping model initialization');
      return false;
    }
    
    // Initialize GoogleGenerativeAI if not already done
    if (!this.genAI) {
      const apiKey = getGeminiApiKey();
      console.log('✅ Gemini API key found, initializing GoogleGenerativeAI');
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    
    if (!this.model) {
      // Try multiple models in order of preference (only models available with your API key)
      const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🧪 Attempting to initialize ${modelName}...`);
          this.model = this.genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.1,   // Lower for more consistent results
              topK: 1,           // Most focused responses
              topP: 0.9,         // Slightly lower for better accuracy
              maxOutputTokens: 1000, // Increased for more detailed responses
            },
          });
          
          // Test the model with a simple query
          const testResult = await this.model.generateContent("Test");
          
          if (modelName.includes('lite')) {
            console.log(`✅ Gemini model initialized with ${modelName} (speed-optimized)`);
            console.log('⚡ Using Gemini 2.5 Flash Lite for faster manual search responses');
          } else {
            console.log(`✅ Gemini model initialized with ${modelName} (standard mode)`);
            console.log('💰 Using cost-effective model for manual searches');
          }
          break;
        } catch (error) {
          console.warn(`⚠️ Model ${modelName} failed:`, error.message);
          this.model = null; // Reset for next attempt
          continue;
        }
      }
      
      if (!this.model) {
        console.error('❌ All Gemini models failed to initialize');
        throw new Error('No supported Gemini models available');
      }
    }
    return this.model;
  }

  async searchFood(query) {
    try {
      // Check if API key is available
      if (!this.hasApiKey()) {
        console.log('🔍 Gemini API not available, returning fallback food data');
        return this.getFallbackFoodData(query);
      }

      // Rate limiting
      const now = Date.now();
      if (now - this.lastRequestTime < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }
      this.lastRequestTime = Date.now();
      this.requestCount++;

      console.log(`🔍 Searching for food: "${query}" (Request #${this.requestCount})`);
      
      const searchStartTime = Date.now();
      const model = await this.initializeModel();
      if (!model) {
        return this.getFallbackFoodData(query);
      }

      const prompt = `
You are a USDA nutrition database expert. Analyze this food query and provide precise nutritional data.

Food Query: "${query}"

CRITICAL INSTRUCTIONS:
1. DETECT QUANTITIES: Look for numbers indicating quantity (e.g., "2 apples", "6 slices", "3 cups")
2. MULTIPLY NUTRITION: If quantity is specified, multiply ALL nutrition values by that quantity
3. USE REALISTIC PORTIONS: Base on USDA standards for single servings
4. SPECIFY PREPARATION: Include cooking method (raw, cooked, fried, grilled, etc.)

QUANTITY DETECTION EXAMPLES:
- "6 slices of pepperoni pizza" → Calculate for 6 slices (1 slice ≈ 300 cal → 6 slices ≈ 1800 cal)
- "2 eggs" → Calculate for 2 eggs (1 egg ≈ 70 cal → 2 eggs ≈ 140 cal)
- "3 bananas" → Calculate for 3 bananas (1 banana ≈ 105 cal → 3 bananas ≈ 315 cal)
- "slice of pizza" → Calculate for 1 slice only (≈ 300 cal)
- "pizza" → Assume 1 slice if no quantity specified (≈ 300 cal)

PORTION SIZE STANDARDS (per single serving):
- Pizza slice (regular crust, 1/8 of 14"): 285-350 calories depending on toppings
  * Cheese: ~285 cal
  * Pepperoni: ~300-330 cal
  * Supreme: ~350 cal
- Egg (large): 70 calories
- Banana (medium, 120g): 105 calories
- Apple (medium, 180g): 95 calories
- Chicken breast (100g cooked): 165 calories
- Rice (1/2 cup cooked): 100 calories

Return ONLY valid JSON:

{
  "name": "Food name with TOTAL quantity",
  "calories": number (TOTAL for all items),
  "carbs": number (TOTAL grams),
  "protein": number (TOTAL grams),
  "fat": number (TOTAL grams),
  "fiber": number (TOTAL grams),
  "sugar": number (TOTAL grams),
  "sodium": number (TOTAL mg),
  "confidence": number (0.8+ for common foods),
  "serving_size": "Total quantity description",
  "notes": "Single serving details and multiplication"
}

CRITICAL EXAMPLES:
Query: "6 slices of pepperoni pizza"
Response: {
  "name": "6 slices of pepperoni pizza",
  "calories": 1980,
  "carbs": 216,
  "protein": 72,
  "fat": 84,
  "notes": "1 slice = 330 cal × 6 slices"
}

Query: "slice of pepperoni pizza"
Response: {
  "name": "1 slice of pepperoni pizza",
  "calories": 330,
  "carbs": 36,
  "protein": 12,
  "fat": 14,
  "notes": "1 slice, regular crust, 1/8 of 14-inch pizza"
}

Return only JSON with TOTAL nutrition for the COMPLETE quantity specified.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 Gemini raw response:', text);

      // Clean and parse the response
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanedText = cleanedText.replace(/```/g, '');
      
      // Try to extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const foodData = JSON.parse(cleanedText);

      // Validate required fields (basic nutrition)
      const requiredFields = ['name', 'calories', 'carbs', 'protein', 'fat'];
      for (const field of requiredFields) {
        if (!(field in foodData) || typeof foodData[field] !== 'number' && field !== 'name') {
          throw new Error(`Missing or invalid field: ${field}`);
        }
      }

      // Validate optional extended nutrition fields
      const extendedFields = ['fiber', 'sugar', 'sodium'];
      for (const field of extendedFields) {
        if (field in foodData && typeof foodData[field] !== 'number') {
          console.warn(`Invalid ${field} field, setting to 0`);
          foodData[field] = 0;
        } else if (!(field in foodData)) {
          console.warn(`Missing ${field} field, setting to 0`);
          foodData[field] = 0;
        }
      }

      // Ensure reasonable bounds
      if (foodData.calories < 0 || foodData.calories > 2000) {
        throw new Error('Unrealistic calorie count');
      }

      // Add search metadata
      foodData.searchQuery = query;
      foodData.searchTimestamp = new Date().toISOString();
      foodData.method = 'search';

      console.log('✅ Parsed food data:', foodData);

      return {
        success: true,
        food: foodData
      };

    } catch (error) {
      console.error('❌ Food search error:', error);

      // Provide fallback nutrition data
      const fallbackFood = this.createFallbackFood(query);
      
      return {
        success: false,
        error: error.message,
        fallback: fallbackFood,
        food: fallbackFood // Include fallback as food for UI consistency
      };
    }
  }

  createFallbackFood(query) {
    const queryLower = query.toLowerCase();
    
    // Enhanced food database with realistic portions and nutrition
    const foodDatabase = {
      // Fruits (per medium piece)
      'apple': { calories: 95, carbs: 25, protein: 0.5, fat: 0.3, portion: 'medium apple (180g)' },
      'banana': { calories: 105, carbs: 27, protein: 1.3, fat: 0.4, portion: 'medium banana (120g)' },
      'orange': { calories: 62, carbs: 15, protein: 1.2, fat: 0.2, portion: 'medium orange (130g)' },
      
      // Proteins (per 100g cooked)
      'chicken': { calories: 165, carbs: 0, protein: 31, fat: 3.6, portion: '100g grilled chicken breast' },
      'fish': { calories: 206, carbs: 0, protein: 22, fat: 12, portion: '100g cooked fish fillet' },
      'beef': { calories: 250, carbs: 0, protein: 26, fat: 15, portion: '100g lean beef' },
      
      // Carbs (per standard serving)
      'rice': { calories: 205, carbs: 45, protein: 4.3, fat: 0.4, portion: '1 cup cooked white rice' },
      'pasta': { calories: 220, carbs: 44, protein: 8, fat: 1.1, portion: '1 cup cooked pasta' },
      'bread': { calories: 79, carbs: 14, protein: 2.7, fat: 1.1, portion: '1 slice whole grain bread' },
      
      // High calorie foods
      'pizza': { calories: 285, carbs: 36, protein: 12, fat: 10, portion: '1 slice cheese pizza' },
      'burger': { calories: 540, carbs: 40, protein: 25, fat: 31, portion: '1 medium hamburger' },
      'fries': { calories: 365, carbs: 63, protein: 4, fat: 17, portion: 'medium fries (115g)' },
    };
    
    // Find matching food or estimate
    let foodData = null;
    
    for (const [key, data] of Object.entries(foodDatabase)) {
      if (queryLower.includes(key)) {
        foodData = { ...data };
        break;
      }
    }
    
    // Default fallback if no match
    if (!foodData) {
      foodData = {
        calories: 200,
        carbs: 25,
        protein: 8,
        fat: 6,
        portion: 'estimated serving'
      };
    }

    return {
      name: `${query} (${foodData.portion})`,
      calories: foodData.calories,
      carbs: foodData.carbs,
      protein: foodData.protein,
      fat: foodData.fat,
      fiber: 3,
      sugar: Math.round(foodData.carbs * 0.2), // Estimate 20% of carbs as sugar
      sodium: 150,
      confidence: 0.4,
      serving_size: foodData.portion,
      notes: "Nutritional information estimated due to API error",
      searchQuery: query,
      searchTimestamp: new Date().toISOString(),
      method: 'search'
    };
  }

  // Search multiple food suggestions
  async searchFoodSuggestions(query) {
    try {
      // If no API key, return estimated fallback only
      if (!this.hasApiKey()) {
        console.log('🔎 No Gemini API key - using estimated fallback only');
        const fallback = this.createFallbackFood(query);
        fallback.serving_size = fallback.serving_size || 'estimated portion';
        return { success: true, foods: [fallback], fallback: true };
      }

      const model = await this.initializeModel();

      const prompt = `
You are a nutrition expert. Given a food query, provide 3 different interpretations with nutritional information.

Food Query: "${query}"

Provide 3 different reasonable interpretations of this food query with different serving sizes or preparations.

Return ONLY a valid JSON array with this exact structure:

[
  {
    "name": "Properly formatted food name with serving size",
    "calories": number,
    "carbs": number (in grams),
    "protein": number (in grams), 
    "fat": number (in grams),
    "fiber": number (in grams),
    "sugar": number (in grams),
    "sodium": number (in mg),
    "confidence": number (0.0-1.0),
    "serving_size": "description",
    "notes": "preparation method or context"
  },
  // ... 2 more similar objects
]

Example for "chicken":
[
  {"name": "Grilled Chicken Breast (100g)", "calories": 165, "carbs": 0, "protein": 31, "fat": 3.6, "fiber": 0, "sugar": 0, "sodium": 74, "confidence": 0.9, "serving_size": "100g", "notes": "Skinless, grilled"},
  {"name": "Fried Chicken Thigh (1 piece)", "calories": 280, "carbs": 8, "protein": 18, "fat": 18, "fiber": 0, "sugar": 1, "sodium": 435, "confidence": 0.8, "serving_size": "1 medium piece", "notes": "Breaded and fried"},
  {"name": "Chicken Salad (1 cup)", "calories": 350, "carbs": 6, "protein": 25, "fat": 25, "fiber": 1, "sugar": 3, "sodium": 680, "confidence": 0.7, "serving_size": "1 cup", "notes": "With mayonnaise"}
]

Return only the JSON array, no additional text.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      let foods = JSON.parse(cleanedText);

      if (!Array.isArray(foods) || foods.length === 0) {
        throw new Error('Invalid response format');
      }

      // Add metadata to each food
      foods.forEach(food => {
        // Validate extended nutrition fields
        const extendedFields = ['fiber', 'sugar', 'sodium'];
        for (const field of extendedFields) {
          if (field in food && typeof food[field] !== 'number') {
            console.warn(`Invalid ${field} field in suggestion, setting to 0`);
            food[field] = 0;
          } else if (!(field in food)) {
            console.warn(`Missing ${field} field in suggestion, setting to 0`);
            food[field] = 0;
          }
        }

        food.searchQuery = query;
        food.searchTimestamp = new Date().toISOString();
        food.method = 'search';
        if (!food.serving_size) food.serving_size = 'per serving';
      });

      // Note: Removed OpenFoodFacts augmentation to prevent result skewing
      // Gemini Flash Lite provides more accurate, consistent results

      return {
        success: true,
        foods
      };

    } catch (error) {
      console.error('❌ Food suggestions error:', error);
      // Return estimated fallback only for clean, consistent results
      const fallback = this.createFallbackFood(query);
      return { success: true, foods: [fallback], fallback: true };
    }
  }

  getFallbackFoodData(query) {
    console.log(`📦 Using fallback data for: "${query}"`);
    
    // Create a basic food item with reasonable defaults
    const fallback = this.createFallbackFood(query);
    
    return {
      success: true,
      foods: [fallback],
      fallback: true
    };
  }
}

export const foodSearchService = new FoodSearchService();
