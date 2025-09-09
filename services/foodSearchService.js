import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

class FoodSearchService {
  constructor() {
    // Use API key or fallback for bundling
    const apiKey = GEMINI_API_KEY || 'fallback-key-for-bundling';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.RATE_LIMIT_DELAY = 1000; // 1 second between requests
  }

  async initializeModel() {
    if (!this.model) {
      try {
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash-8b",
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        });
        console.log('🤖 Gemini model initialized for food search');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini model:', error);
        throw error;
      }
    }
    return this.model;
  }

  async searchFood(query) {
    try {
      // Rate limiting
      const now = Date.now();
      if (now - this.lastRequestTime < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }
      this.lastRequestTime = Date.now();
      this.requestCount++;

      console.log(`🔍 Searching for food: "${query}" (Request #${this.requestCount})`);

      const model = await this.initializeModel();

      const prompt = `
You are a nutrition expert. Given a food query, provide detailed nutritional information.

Food Query: "${query}"

Instructions:
1. Interpret the query as a food item (even if it's vague or misspelled)
2. Estimate a reasonable serving size
3. Provide accurate nutritional information
4. Return ONLY a valid JSON object with this exact structure:

{
  "name": "Properly formatted food name with serving size",
  "calories": number,
  "carbs": number (in grams),
  "protein": number (in grams),
  "fat": number (in grams),
  "fiber": number (in grams),
  "sugar": number (in grams),
  "sodium": number (in mg),
  "confidence": number (0.0-1.0, how certain you are about this food),
  "serving_size": "description of serving size",
  "notes": "any relevant notes about the food or assumptions made"
}

Examples:
- "apple" → medium apple (180g)
- "pizza slice" → 1 slice medium cheese pizza
- "chicken breast" → 100g grilled chicken breast
- "rice" → 1 cup cooked white rice

Be conservative with estimates and always include serving size context in the name.
Return only the JSON object, no additional text.
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
    // Estimate calories based on common food patterns
    let estimatedCalories = 200; // Default
    
    const lowCalFoods = ['apple', 'banana', 'orange', 'vegetable', 'salad', 'lettuce', 'cucumber', 'tomato'];
    const medCalFoods = ['chicken', 'fish', 'rice', 'bread', 'pasta', 'potato'];
    const highCalFoods = ['pizza', 'burger', 'fries', 'cake', 'ice cream', 'cheese', 'nuts'];
    
    const queryLower = query.toLowerCase();
    
    if (lowCalFoods.some(food => queryLower.includes(food))) {
      estimatedCalories = 80;
    } else if (highCalFoods.some(food => queryLower.includes(food))) {
      estimatedCalories = 400;
    } else if (medCalFoods.some(food => queryLower.includes(food))) {
      estimatedCalories = 250;
    }

    return {
      name: `${query} (estimated)`,
      calories: estimatedCalories,
      carbs: Math.round(estimatedCalories * 0.5 / 4), // 50% carbs
      protein: Math.round(estimatedCalories * 0.25 / 4), // 25% protein  
      fat: Math.round(estimatedCalories * 0.25 / 9), // 25% fat
      fiber: 3,
      sugar: 5,
      sodium: 150,
      confidence: 0.3,
      serving_size: "estimated portion",
      notes: "Nutritional information estimated due to API error",
      searchQuery: query,
      searchTimestamp: new Date().toISOString(),
      method: 'search'
    };
  }

  // Search multiple food suggestions
  async searchFoodSuggestions(query) {
    try {
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
      
      const foods = JSON.parse(cleanedText);

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
      });

      return {
        success: true,
        foods: foods
      };

    } catch (error) {
      console.error('❌ Food suggestions error:', error);
      
      // Return single fallback
      const fallback = this.createFallbackFood(query);
      return {
        success: false,
        error: error.message,
        foods: [fallback]
      };
    }
  }
}

export const foodSearchService = new FoodSearchService();
