import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProductByText } from './barcodeService';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

class FoodSearchService {
  constructor() {
    // Check if API key is available, but don't crash if missing
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not configured. Food search features will be limited.');
      this.genAI = null;
      this.model = null;
      this.hasApiKey = false;
    } else {
      console.log('✅ Gemini API key configured for food search');
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      this.model = null;
      this.hasApiKey = true;
    }
    
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.RATE_LIMIT_DELAY = 1000; // 1 second between requests
  }

  async initializeModel() {
    if (!this.hasApiKey) {
      console.log('No Gemini API key available, skipping model initialization');
      return false;
    }
    
    if (!this.model) {
      // Try multiple models in order of preference (most cost-effective first)
      const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-pro'];
      
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
          console.log(`✅ Gemini model initialized for food search with ${modelName} (cost-optimized)`);
          console.log('💰 Using most cost-effective model available');
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
      if (!this.hasApiKey) {
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

      const model = await this.initializeModel();
      if (!model) {
        return this.getFallbackFoodData(query);
      }

      const prompt = `
You are a USDA nutrition database expert. Analyze this food query and provide precise nutritional data based on standard serving sizes.

Food Query: "${query}"

CRITICAL REQUIREMENTS:
1. Use realistic, commonly consumed portion sizes (not restaurant portions)
2. Base nutritional values on USDA nutrition database standards
3. Be specific about preparation method (raw, cooked, fried, etc.)
4. Account for actual weight/volume of the serving

PORTION SIZE GUIDELINES:
- Fruits: 1 medium piece (apple=180g, banana=120g, orange=130g)
- Vegetables: 1 cup raw or 1/2 cup cooked
- Proteins: 100g cooked portion (palm-sized)
- Grains: 1/2 cup cooked (rice, pasta) or 1 slice bread
- Nuts/seeds: 1 ounce (28g)
- Oils/fats: 1 tablespoon (14g)

Return ONLY valid JSON:

{
  "name": "Specific food name with exact portion",
  "calories": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": number (0.8+ for common foods, 0.6+ for estimates),
  "serving_size": "precise serving description with weight/volume",
  "notes": "preparation method and key assumptions"
}

ACCURACY EXAMPLES:
"chicken breast" → "Grilled chicken breast, 100g" (165 cal, 31g protein)
"apple" → "Medium Fuji apple, 180g" (95 cal, 25g carbs)
"pizza" → "Cheese pizza slice, 1/8 of 14-inch, 107g" (285 cal, 36g carbs)

Use precise portions and verified nutrition data. Return only JSON.
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
      // If no API key, fall back to OpenFoodFacts multi-result search
      if (!this.hasApiKey) {
        console.log('🔎 Using OpenFoodFacts fallback for suggestions (no Gemini key)');
        const off = await searchProductByText(query, 10);
        if (off.success && off.products?.length) {
          const foods = off.products.map((p) => ({
            name: p.name,
            calories: p.calories,
            carbs: p.carbs,
            protein: p.protein,
            fat: p.fat,
            fiber: p.fiber ?? 0,
            sugar: p.sugar ?? 0,
            sodium: p.sodium ?? 0,
            confidence: 0.7,
            serving_size: p.servingSize && p.servingUnit ? `${p.servingSize}${p.servingUnit}` : 'per serving',
            notes: 'OpenFoodFacts data',
            searchQuery: query,
            searchTimestamp: new Date().toISOString(),
            method: 'search',
          }));
          return { success: true, foods };
        }
        // If OFF fails, return a single estimated fallback
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

      // If Gemini returned only one result, try to augment with OFF suggestions
      if (foods.length < 2) {
        try {
          const off = await searchProductByText(query, 5);
          if (off.success && off.products?.length) {
            const offFoods = off.products.slice(0, 4).map((p) => ({
              name: p.name,
              calories: p.calories,
              carbs: p.carbs,
              protein: p.protein,
              fat: p.fat,
              fiber: p.fiber ?? 0,
              sugar: p.sugar ?? 0,
              sodium: p.sodium ?? 0,
              confidence: 0.65,
              serving_size: p.servingSize && p.servingUnit ? `${p.servingSize}${p.servingUnit}` : 'per serving',
              notes: 'OpenFoodFacts data',
              searchQuery: query,
              searchTimestamp: new Date().toISOString(),
              method: 'search',
            }));
            foods = [...foods, ...offFoods];
          }
        } catch (e) {
          console.warn('OFF augmentation failed:', e?.message);
        }
      }

      return {
        success: true,
        foods
      };

    } catch (error) {
      console.error('❌ Food suggestions error:', error);
      // Fallback to OpenFoodFacts multi-result search
      try {
        const off = await searchProductByText(query, 10);
        if (off.success && off.products?.length) {
          const foods = off.products.map((p) => ({
            name: p.name,
            calories: p.calories,
            carbs: p.carbs,
            protein: p.protein,
            fat: p.fat,
            fiber: p.fiber ?? 0,
            sugar: p.sugar ?? 0,
            sodium: p.sodium ?? 0,
            confidence: 0.7,
            serving_size: p.servingSize && p.servingUnit ? `${p.servingSize}${p.servingUnit}` : 'per serving',
            notes: 'OpenFoodFacts data',
            searchQuery: query,
            searchTimestamp: new Date().toISOString(),
            method: 'search',
          }));
          return { success: true, foods };
        }
      } catch (e) {
        console.warn('OFF fallback failed:', e?.message);
      }

      // Final single-item fallback
      const fallback = this.createFallbackFood(query);
      fallback.serving_size = fallback.serving_size || 'estimated portion';
      return {
        success: true,
        foods: [fallback],
        fallback: true
      };
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
