// Food Analysis Service using Google Gemini AI for enhanced food identification and nutritional estimation
const GEMINI_API_KEY = 'AIzaSyCEn--MmLdZAoidpQ_y5ynpTr7bHJi5fAs';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Nutrition database with estimated values per 100g
const NUTRITION_DATABASE = {
  // Fruits
  'apple': { calories: 52, carbs: 14, protein: 0.3, fat: 0.2, portion: 150 },
  'banana': { calories: 89, carbs: 23, protein: 1.1, fat: 0.3, portion: 120 },
  'orange': { calories: 47, carbs: 12, protein: 0.9, fat: 0.1, portion: 130 },
  'strawberry': { calories: 32, carbs: 8, protein: 0.7, fat: 0.3, portion: 100 },
  'grapes': { calories: 62, carbs: 16, protein: 0.6, fat: 0.2, portion: 80 },
  'blueberry': { calories: 57, carbs: 14, protein: 0.7, fat: 0.3, portion: 75 },
  'raspberry': { calories: 52, carbs: 12, protein: 1.2, fat: 0.7, portion: 75 },
  'pineapple': { calories: 50, carbs: 13, protein: 0.5, fat: 0.1, portion: 100 },
  'mango': { calories: 60, carbs: 15, protein: 0.8, fat: 0.4, portion: 120 },
  'avocado': { calories: 160, carbs: 9, protein: 2, fat: 15, portion: 100 },
  
  // Vegetables
  'broccoli': { calories: 34, carbs: 7, protein: 2.8, fat: 0.4, portion: 100 },
  'carrot': { calories: 41, carbs: 10, protein: 0.9, fat: 0.2, portion: 80 },
  'spinach': { calories: 23, carbs: 4, protein: 2.9, fat: 0.4, portion: 50 },
  'tomato': { calories: 18, carbs: 4, protein: 0.9, fat: 0.2, portion: 100 },
  'potato': { calories: 77, carbs: 17, protein: 2, fat: 0.1, portion: 150 },
  'sweet potato': { calories: 86, carbs: 20, protein: 1.6, fat: 0.1, portion: 130 },
  'bell pepper': { calories: 31, carbs: 7, protein: 1, fat: 0.3, portion: 80 },
  'cucumber': { calories: 16, carbs: 4, protein: 0.7, fat: 0.1, portion: 100 },
  'onion': { calories: 40, carbs: 9, protein: 1.1, fat: 0.1, portion: 60 },
  'lettuce': { calories: 15, carbs: 3, protein: 1.4, fat: 0.2, portion: 50 },
  'mushroom': { calories: 22, carbs: 3, protein: 3.1, fat: 0.3, portion: 70 },
  'corn': { calories: 86, carbs: 19, protein: 3.3, fat: 1.4, portion: 100 },
  
  // Proteins
  'chicken breast': { calories: 165, carbs: 0, protein: 31, fat: 3.6, portion: 120 },
  'chicken thigh': { calories: 209, carbs: 0, protein: 26, fat: 11, portion: 100 },
  'salmon': { calories: 208, carbs: 0, protein: 20, fat: 13, portion: 100 },
  'tuna': { calories: 144, carbs: 0, protein: 30, fat: 1, portion: 100 },
  'shrimp': { calories: 85, carbs: 0, protein: 20, fat: 1.1, portion: 85 },
  'beef': { calories: 250, carbs: 0, protein: 26, fat: 15, portion: 100 },
  'ground beef': { calories: 254, carbs: 0, protein: 26, fat: 17, portion: 100 },
  'pork': { calories: 242, carbs: 0, protein: 27, fat: 14, portion: 100 },
  'turkey': { calories: 135, carbs: 0, protein: 30, fat: 1, portion: 100 },
  'egg': { calories: 155, carbs: 1.1, protein: 13, fat: 11, portion: 50 },
  'tofu': { calories: 76, carbs: 1.9, protein: 8, fat: 4.8, portion: 100 },
  'beans': { calories: 127, carbs: 23, protein: 9, fat: 0.5, portion: 100 },
  'lentils': { calories: 116, carbs: 20, protein: 9, fat: 0.4, portion: 100 },
  'nuts': { calories: 607, carbs: 7, protein: 20, fat: 54, portion: 30 },
  'almonds': { calories: 579, carbs: 22, protein: 21, fat: 50, portion: 30 },
  
  // Grains & Carbs
  'rice': { calories: 130, carbs: 28, protein: 2.7, fat: 0.3, portion: 100 },
  'brown rice': { calories: 111, carbs: 23, protein: 2.6, fat: 0.9, portion: 100 },
  'bread': { calories: 265, carbs: 49, protein: 9, fat: 3.2, portion: 50 },
  'whole wheat bread': { calories: 247, carbs: 41, protein: 13, fat: 4.2, portion: 50 },
  'pasta': { calories: 131, carbs: 25, protein: 5, fat: 1.1, portion: 100 },
  'whole wheat pasta': { calories: 124, carbs: 26, protein: 5.5, fat: 1.1, portion: 100 },
  'oatmeal': { calories: 68, carbs: 12, protein: 2.4, fat: 1.4, portion: 100 },
  'quinoa': { calories: 120, carbs: 22, protein: 4.4, fat: 1.9, portion: 100 },
  'couscous': { calories: 112, carbs: 23, protein: 3.8, fat: 0.2, portion: 100 },
  'bagel': { calories: 250, carbs: 49, protein: 10, fat: 1.5, portion: 70 },
  'tortilla': { calories: 218, carbs: 36, protein: 6, fat: 5.8, portion: 45 },
  
  // Dairy
  'milk': { calories: 42, carbs: 5, protein: 3.4, fat: 1, portion: 200 },
  'skim milk': { calories: 34, carbs: 5, protein: 3.4, fat: 0.2, portion: 200 },
  'whole milk': { calories: 61, carbs: 5, protein: 3.2, fat: 3.3, portion: 200 },
  'cheese': { calories: 113, carbs: 1, protein: 7, fat: 9, portion: 30 },
  'cheddar cheese': { calories: 403, carbs: 1.3, protein: 25, fat: 33, portion: 30 },
  'mozzarella': { calories: 280, carbs: 2.2, protein: 28, fat: 17, portion: 30 },
  'yogurt': { calories: 59, carbs: 3.6, protein: 10, fat: 0.4, portion: 150 },
  'greek yogurt': { calories: 59, carbs: 3.6, protein: 10, fat: 0.4, portion: 150 },
  'butter': { calories: 717, carbs: 0.1, protein: 0.9, fat: 81, portion: 10 },
  'cream cheese': { calories: 342, carbs: 4.1, protein: 6, fat: 34, portion: 30 },
  
  // Prepared Foods & Snacks
  'pizza': { calories: 266, carbs: 33, protein: 11, fat: 10, portion: 100 },
  'hamburger': { calories: 295, carbs: 34, protein: 17, fat: 12, portion: 150 },
  'sandwich': { calories: 250, carbs: 30, protein: 12, fat: 8, portion: 150 },
  'burrito': { calories: 326, carbs: 48, protein: 15, fat: 9, portion: 200 },
  'salad': { calories: 20, carbs: 4, protein: 2, fat: 0.3, portion: 100 },
  'caesar salad': { calories: 187, carbs: 7, protein: 7, fat: 17, portion: 150 },
  'soup': { calories: 40, carbs: 6, protein: 2, fat: 1, portion: 200 },
  'french fries': { calories: 365, carbs: 63, protein: 4, fat: 17, portion: 100 },
  'chips': { calories: 536, carbs: 53, protein: 7, fat: 34, portion: 30 },
  'cookie': { calories: 502, carbs: 64, protein: 5.9, fat: 25, portion: 25 },
  'cake': { calories: 257, carbs: 42, protein: 3, fat: 9, portion: 80 },
  'ice cream': { calories: 207, carbs: 24, protein: 3.5, fat: 11, portion: 65 },
  
  // Beverages (calories per serving)
  'coffee': { calories: 2, carbs: 0, protein: 0.3, fat: 0, portion: 240 },
  'tea': { calories: 2, carbs: 0.7, protein: 0, fat: 0, portion: 240 },
  'orange juice': { calories: 45, carbs: 10, protein: 0.7, fat: 0.2, portion: 240 },
  'apple juice': { calories: 46, carbs: 11, protein: 0.1, fat: 0.1, portion: 240 },
  'soda': { calories: 41, carbs: 10.6, protein: 0, fat: 0, portion: 240 },
  'beer': { calories: 43, carbs: 3.6, protein: 0.5, fat: 0, portion: 240 },
  'wine': { calories: 85, carbs: 2.6, protein: 0.1, fat: 0, portion: 150 },
};

export const foodAnalysisService = {
  // Analyze food image using Google Gemini AI
  async analyzeFoodImage(imageUri) {
    try {
      console.log('🔍 Starting food analysis with Gemini for image:', imageUri);
      
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Call Gemini API for intelligent food identification
      const geminiResponse = await this.callGeminiVision(base64Image);
      
      // Extract food items from Gemini response
      const detectedFoods = this.extractFoodItemsFromGemini(geminiResponse);
      
      // Generate top 3 food predictions with enhanced accuracy
      const predictions = this.generateFoodPredictions(detectedFoods);
      
      console.log('✅ Enhanced food predictions generated:', predictions);
      return {
        success: true,
        predictions: predictions,
        imageUri: imageUri
      };
      
    } catch (error) {
      console.error('❌ Food analysis error:', error);
      return {
        success: false,
        error: error.message,
        predictions: []
      };
    }
  },

  // Convert image URI to base64
  async convertImageToBase64(imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  },

  // Call Gemini API for intelligent food identification
  async callGeminiVision(base64Image) {
    const prompt = `Analyze this food image and provide detailed information. Please identify:

1. The specific food items visible (be as specific as possible - e.g., "grilled chicken breast" not just "chicken")
2. Estimated portion sizes for each item
3. For each food item, estimate nutritional values per serving:
   - Calories
   - Carbohydrates (g)
   - Protein (g)
   - Fat (g)
4. Confidence level for each identification (0.0 to 1.0)

Format your response as JSON:
{
  "foods": [
    {
      "name": "specific food name",
      "portion": "description of portion size",
      "confidence": 0.95,
      "nutrition": {
        "calories": 250,
        "carbs": 30,
        "protein": 25,
        "fat": 8
      }
    }
  ]
}

Be accurate and specific. If you're unsure about a food item, lower the confidence score accordingly.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  },

  // Extract food items from Gemini API response
  extractFoodItemsFromGemini(geminiResponse) {
    console.log('🔍 Processing Gemini response:', geminiResponse);
    
    try {
      const candidates = geminiResponse.candidates;
      if (!candidates || candidates.length === 0) {
        console.warn('No candidates in Gemini response');
        return [];
      }

      const content = candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        console.warn('No content parts in Gemini response');
        return [];
      }

      const textResponse = content.parts[0].text;
      console.log('📝 Gemini text response:', textResponse);

      // Try to parse JSON from Gemini's response
      let parsedResponse;
      try {
        // Extract JSON from the response (Gemini might wrap it in markdown or other text)
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: try to parse the entire response
          parsedResponse = JSON.parse(textResponse);
        }
      } catch (parseError) {
        console.warn('Could not parse JSON from Gemini response, using fallback extraction');
        return this.extractFoodFromText(textResponse);
      }

      const detectedFoods = [];
      
      if (parsedResponse.foods && Array.isArray(parsedResponse.foods)) {
        parsedResponse.foods.forEach(food => {
          if (food.name && food.confidence && food.nutrition) {
            detectedFoods.push({
              name: food.name.toLowerCase(),
              confidence: Math.min(1.0, Math.max(0.0, food.confidence)),
              source: 'gemini',
              portion: food.portion || 'standard serving',
              nutrition: {
                calories: Math.round(food.nutrition.calories || 0),
                carbs: Math.round(food.nutrition.carbs || 0),
                protein: Math.round(food.nutrition.protein || 0),
                fat: Math.round(food.nutrition.fat || 0)
              },
              originalResponse: food
            });
          }
        });
      }

      console.log('✅ Extracted foods from Gemini:', detectedFoods);
      return detectedFoods;
      
    } catch (error) {
      console.error('Error extracting foods from Gemini response:', error);
      return [];
    }
  },

  // Map Vision API labels to our food database with enhanced intelligence
  mapToFoodName(label) {
    const cleanLabel = label.toLowerCase().trim();
    
    // Direct matches first
    if (NUTRITION_DATABASE[cleanLabel]) {
      return cleanLabel;
    }

    // Enhanced food mappings with more specific matches
    const foodMappings = {
      // Fruits - more specific
      'apple': 'apple',
      'green apple': 'apple',
      'red apple': 'apple',
      'fruit': 'apple',
      'banana': 'banana',
      'yellow banana': 'banana',
      'ripe banana': 'banana',
      'orange': 'orange',
      'orange fruit': 'orange',
      'citrus': 'orange',
      'citrus fruit': 'orange',
      'strawberry': 'strawberry',
      'strawberries': 'strawberry',
      'berry': 'strawberry',
      'berries': 'strawberry',
      'grape': 'grapes',
      'grapes': 'grapes',
      'bunch of grapes': 'grapes',
      
      // Vegetables - more specific
      'broccoli': 'broccoli',
      'green broccoli': 'broccoli',
      'broccoli florets': 'broccoli',
      'carrot': 'carrot',
      'carrots': 'carrot',
      'orange carrot': 'carrot',
      'spinach': 'spinach',
      'spinach leaves': 'spinach',
      'leafy green': 'spinach',
      'leafy greens': 'spinach',
      'green leafy vegetable': 'spinach',
      'tomato': 'tomato',
      'tomatoes': 'tomato',
      'red tomato': 'tomato',
      'cherry tomato': 'tomato',
      'potato': 'potato',
      'potatoes': 'potato',
      'baked potato': 'potato',
      'mashed potato': 'potato',
      
      // Proteins - more specific
      'chicken': 'chicken breast',
      'chicken breast': 'chicken breast',
      'grilled chicken': 'chicken breast',
      'roasted chicken': 'chicken breast',
      'chicken meat': 'chicken breast',
      'poultry': 'chicken breast',
      'white meat': 'chicken breast',
      'salmon': 'salmon',
      'salmon fillet': 'salmon',
      'grilled salmon': 'salmon',
      'cooked salmon': 'salmon',
      'pink salmon': 'salmon',
      'fish': 'salmon',
      'fish fillet': 'salmon',
      'seafood': 'salmon',
      'beef': 'beef',
      'beef steak': 'beef',
      'steak': 'beef',
      'red meat': 'beef',
      'ground beef': 'beef',
      'meat': 'beef',
      'egg': 'egg',
      'eggs': 'egg',
      'boiled egg': 'egg',
      'fried egg': 'egg',
      'scrambled egg': 'egg',
      'tofu': 'tofu',
      'bean curd': 'tofu',
      'soy protein': 'tofu',
      
      // Grains & Carbs - more specific
      'rice': 'rice',
      'white rice': 'rice',
      'brown rice': 'rice',
      'cooked rice': 'rice',
      'steamed rice': 'rice',
      'grain': 'rice',
      'grains': 'rice',
      'bread': 'bread',
      'slice of bread': 'bread',
      'toast': 'bread',
      'white bread': 'bread',
      'whole wheat bread': 'bread',
      'pasta': 'pasta',
      'spaghetti': 'pasta',
      'noodle': 'pasta',
      'noodles': 'pasta',
      'penne': 'pasta',
      'linguine': 'pasta',
      'oatmeal': 'oatmeal',
      'oats': 'oatmeal',
      'porridge': 'oatmeal',
      'cereal': 'oatmeal',
      'breakfast cereal': 'oatmeal',
      'quinoa': 'quinoa',
      'quinoa grain': 'quinoa',
      
      // Dairy - more specific
      'milk': 'milk',
      'glass of milk': 'milk',
      'white milk': 'milk',
      'dairy': 'milk',
      'dairy product': 'milk',
      'cheese': 'cheese',
      'cheddar cheese': 'cheese',
      'mozzarella': 'cheese',
      'slice of cheese': 'cheese',
      'yogurt': 'yogurt',
      'yoghurt': 'yogurt',
      'greek yogurt': 'yogurt',
      
      // Prepared Foods - more specific
      'pizza': 'pizza',
      'pizza slice': 'pizza',
      'cheese pizza': 'pizza',
      'pepperoni pizza': 'pizza',
      'sandwich': 'sandwich',
      'sub sandwich': 'sandwich',
      'club sandwich': 'sandwich',
      'grilled sandwich': 'sandwich',
      'salad': 'salad',
      'green salad': 'salad',
      'mixed salad': 'salad',
      'caesar salad': 'salad',
      'soup': 'soup',
      'bowl of soup': 'soup',
      'chicken soup': 'soup',
      'vegetable soup': 'soup',
      
      // Generic fallbacks
      'vegetable': 'carrot',
      'vegetables': 'carrot',
      'green vegetable': 'broccoli',
      'food': 'sandwich',
      'meal': 'sandwich',
      'dish': 'sandwich',
      'plate': 'sandwich',
      'cuisine': 'sandwich'
    };

    // Check for partial matches
    for (const [key, value] of Object.entries(foodMappings)) {
      if (cleanLabel.includes(key) || key.includes(cleanLabel)) {
        return value;
      }
    }

    // Check for compound food names
    const words = cleanLabel.split(/\s+/);
    for (const word of words) {
      if (foodMappings[word]) {
        return foodMappings[word];
      }
      if (NUTRITION_DATABASE[word]) {
        return word;
      }
    }

    return null;
  },

  // Extract food from text detection (menu items, labels)
  extractFoodFromText(text) {
    const foods = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const cleanLine = line.toLowerCase().trim();
      if (cleanLine.length < 3) continue;
      
      // Look for food words in the text
      const words = cleanLine.split(/[\s,.-]+/);
      for (const word of words) {
        const foodName = this.mapToFoodName(word);
        if (foodName) {
          foods.push({
            name: foodName,
            confidence: 0.7, // Moderate confidence for text detection
            text: line.trim()
          });
        }
      }
    }
    
    return foods;
  },

  // Enhanced duplicate removal with confidence boosting
  removeDuplicateFoodsAdvanced(foods) {
    const foodMap = new Map();
    
    foods.forEach(food => {
      const existing = foodMap.get(food.name);
      if (!existing) {
        foodMap.set(food.name, food);
      } else {
        // Boost confidence if multiple sources detect the same food
        const confidenceBoost = existing.source !== food.source ? 0.15 : 0.05;
        const newConfidence = Math.min(1.0, Math.max(existing.confidence, food.confidence) + confidenceBoost);
        
        foodMap.set(food.name, {
          ...existing,
          confidence: newConfidence,
          sources: [...(existing.sources || [existing.source]), food.source]
        });
      }
    });

    return Array.from(foodMap.values());
  },

  // Add contextual intelligence based on detected items
  enhanceWithContext(foods) {
    const enhanced = [...foods];
    
    // Boost confidence for commonly paired foods
    const combinations = {
      'rice': ['chicken breast', 'beef', 'salmon'],
      'pasta': ['chicken breast', 'beef'],
      'bread': ['cheese', 'egg'],
      'salad': ['chicken breast', 'cheese']
    };
    
    const detectedNames = foods.map(f => f.name);
    
    enhanced.forEach(food => {
      if (combinations[food.name]) {
        const hasComplement = combinations[food.name].some(complement => 
          detectedNames.includes(complement)
        );
        if (hasComplement) {
          food.confidence = Math.min(1.0, food.confidence + 0.1);
          food.contextBoost = true;
        }
      }
    });
    
    // Penalize unlikely combinations
    const unlikely = {
      'milk': ['pizza', 'soup'],
      'soup': ['pizza', 'sandwich']
    };
    
    enhanced.forEach(food => {
      if (unlikely[food.name]) {
        const hasUnlikely = unlikely[food.name].some(unlikely => 
          detectedNames.includes(unlikely)
        );
        if (hasUnlikely) {
          food.confidence = Math.max(0.3, food.confidence - 0.15);
        }
      }
    });
    
    return enhanced;
  },

  // Remove duplicate foods, keeping highest confidence (legacy method)
  removeDuplicateFoods(foods) {
    const foodMap = new Map();
    
    foods.forEach(food => {
      if (!foodMap.has(food.name) || foodMap.get(food.name).confidence < food.confidence) {
        foodMap.set(food.name, food);
      }
    });

    return Array.from(foodMap.values());
  },

  // Generate top 3 food predictions with nutrition data
  generateFoodPredictions(detectedFoods) {
    const predictions = [];
    console.log('🔍 Generating predictions from:', detectedFoods);
    
    // If no foods detected, provide smart generic options based on time
    if (detectedFoods.length === 0) {
      return this.getTimeBasedFallbacks();
    }

    // Process each detected food with smart portion estimation
    const topFoods = detectedFoods.slice(0, 8); // Consider more detections
    
    topFoods.forEach((food, index) => {
      if (predictions.length < 3) {
        // Check if food has direct nutrition data from Gemini
        if (food.nutrition && food.nutrition.calories > 0) {
          // Use Gemini's nutritional analysis directly
          predictions.push({
            name: this.capitalizeWords(food.name),
            calories: food.nutrition.calories,
            carbs: food.nutrition.carbs,
            protein: food.nutrition.protein,
            fat: food.nutrition.fat,
            confidence: food.confidence,
            description: `AI-analyzed • ${food.portion}`,
            portionSize: food.portion || 'Standard serving',
            detectionSources: ['gemini-nutrition'],
            isGeminiPrediction: true
          });
        } else {
          // Fallback to database lookup with smart portion estimation
          const nutritionInfo = NUTRITION_DATABASE[food.name];
          if (nutritionInfo) {
            const portionMultiplier = this.estimatePortionSize(food, detectedFoods);
            
            predictions.push({
              name: this.capitalizeWords(food.name),
              calories: Math.round(nutritionInfo.calories * portionMultiplier),
              carbs: Math.round(nutritionInfo.carbs * portionMultiplier),
              protein: Math.round(nutritionInfo.protein * portionMultiplier),
              fat: Math.round(nutritionInfo.fat * portionMultiplier),
              confidence: food.confidence,
              description: this.generateSmartDescription(food.name, nutritionInfo, portionMultiplier),
              portionSize: this.getPortionDescription(portionMultiplier),
              detectionSources: food.sources || [food.source]
            });
          } else {
            // Food not in database - use Gemini's estimation or reasonable defaults
            const estimatedNutrition = this.estimateNutritionForUnknownFood(food.name, food.confidence);
            predictions.push({
              name: this.capitalizeWords(food.name),
              calories: estimatedNutrition.calories,
              carbs: estimatedNutrition.carbs,
              protein: estimatedNutrition.protein,
              fat: estimatedNutrition.fat,
              confidence: food.confidence * 0.8, // Slightly lower confidence for estimates
              description: 'AI-estimated nutrition',
              portionSize: 'Standard serving',
              detectionSources: ['gemini-estimate'],
              isEstimated: true
            });
          }
        }
      }
    });

    // If we still need more predictions, create intelligent variations
    while (predictions.length < 3 && predictions.length > 0) {
      const basePrediction = predictions[0];
      const variation = this.createIntelligentVariation(basePrediction, predictions.length);
      if (variation) {
        predictions.push(variation);
      } else {
        break;
      }
    }

    // If still no predictions, use fallbacks
    if (predictions.length === 0) {
      return this.getTimeBasedFallbacks();
    }

    // Sort by confidence and add meal type suggestions
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .map(pred => ({
        ...pred,
        mealType: this.suggestMealType(pred.name, pred.calories)
      }));
  },

  // Smart portion size estimation
  estimatePortionSize(food, allDetectedFoods) {
    const basePortionMultiplier = NUTRITION_DATABASE[food.name].portion / 100;
    let multiplier = basePortionMultiplier;
    
    // Adjust based on confidence (higher confidence = more accurate portion)
    const confidenceAdjustment = food.confidence > 0.8 ? 1.0 : food.confidence > 0.6 ? 0.9 : 0.8;
    multiplier *= confidenceAdjustment;
    
    // Adjust based on number of foods detected (more foods = smaller portions each)
    if (allDetectedFoods.length > 3) {
      multiplier *= 0.8; // Smaller portions when multiple foods
    } else if (allDetectedFoods.length === 1) {
      multiplier *= 1.2; // Larger portion when single food
    }
    
    // Adjust based on food type
    const foodType = this.getFoodCategory(food.name);
    switch (foodType) {
      case 'protein':
        multiplier *= allDetectedFoods.some(f => this.getFoodCategory(f.name) === 'carb') ? 1.0 : 1.3;
        break;
      case 'carb':
        multiplier *= allDetectedFoods.some(f => this.getFoodCategory(f.name) === 'protein') ? 1.0 : 0.9;
        break;
      case 'vegetable':
        multiplier *= 1.2; // Vegetables typically larger portions
        break;
      case 'snack':
        multiplier *= 0.7; // Snacks typically smaller
        break;
    }
    
    return Math.max(0.5, Math.min(2.5, multiplier)); // Clamp between reasonable bounds
  },

  // Get food category for smart adjustments
  getFoodCategory(foodName) {
    const categories = {
      'protein': ['chicken breast', 'salmon', 'beef', 'egg', 'tofu', 'tuna', 'shrimp', 'turkey', 'beans', 'lentils'],
      'carb': ['rice', 'bread', 'pasta', 'oatmeal', 'quinoa', 'potato', 'sweet potato', 'bagel', 'tortilla'],
      'vegetable': ['broccoli', 'carrot', 'spinach', 'tomato', 'bell pepper', 'cucumber', 'lettuce', 'onion'],
      'fruit': ['apple', 'banana', 'orange', 'strawberry', 'grapes', 'blueberry', 'mango', 'pineapple'],
      'dairy': ['milk', 'cheese', 'yogurt', 'butter'],
      'snack': ['chips', 'cookie', 'cake', 'ice cream', 'nuts'],
      'prepared': ['pizza', 'sandwich', 'salad', 'soup', 'hamburger', 'burrito']
    };
    
    for (const [category, foods] of Object.entries(categories)) {
      if (foods.includes(foodName)) return category;
    }
    return 'other';
  },

  // Estimate nutrition for foods not in database using AI analysis
  estimateNutritionForUnknownFood(foodName, confidence) {
    console.log(`🤖 Estimating nutrition for unknown food: ${foodName}`);
    
    // Basic estimation based on food type keywords
    const name = foodName.toLowerCase();
    
    // Default values for unknown foods
    let baseCalories = 200;
    let baseCarbs = 25;
    let baseProtein = 10;
    let baseFat = 8;
    
    // Adjust based on food type indicators
    if (name.includes('salad') || name.includes('vegetable') || name.includes('green')) {
      baseCalories = 80;
      baseCarbs = 15;
      baseProtein = 3;
      baseFat = 2;
    } else if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || 
               name.includes('fish') || name.includes('protein')) {
      baseCalories = 250;
      baseCarbs = 5;
      baseProtein = 30;
      baseFat = 12;
    } else if (name.includes('pasta') || name.includes('rice') || name.includes('bread') || 
               name.includes('grain')) {
      baseCalories = 300;
      baseCarbs = 55;
      baseProtein = 8;
      baseFat = 4;
    } else if (name.includes('fruit')) {
      baseCalories = 80;
      baseCarbs = 20;
      baseProtein = 1;
      baseFat = 0.5;
    } else if (name.includes('cheese') || name.includes('dairy') || name.includes('milk')) {
      baseCalories = 150;
      baseCarbs = 6;
      baseProtein = 8;
      baseFat = 10;
    } else if (name.includes('fried') || name.includes('crispy') || name.includes('oil')) {
      baseCalories = 400;
      baseCarbs = 35;
      baseProtein = 15;
      baseFat = 25;
    }
    
    // Adjust based on confidence (lower confidence = more conservative estimates)
    const confidenceAdjustment = confidence > 0.7 ? 1.0 : 0.8;
    
    return {
      calories: Math.round(baseCalories * confidenceAdjustment),
      carbs: Math.round(baseCarbs * confidenceAdjustment),
      protein: Math.round(baseProtein * confidenceAdjustment),
      fat: Math.round(baseFat * confidenceAdjustment)
    };
  },

  // Generate smart descriptions with context
  generateSmartDescription(foodName, nutritionInfo, portionMultiplier) {
    const portionSize = portionMultiplier > 1.5 ? 'Large serving' : 
                      portionMultiplier > 1.2 ? 'Regular serving' : 'Small serving';
    
    const category = this.getFoodCategory(foodName);
    const healthyKeywords = {
      'protein': 'High protein',
      'vegetable': 'Rich in vitamins',
      'fruit': 'Natural sugars & fiber',
      'carb': 'Energy source',
      'dairy': 'Calcium rich'
    };
    
    const healthNote = healthyKeywords[category] || 'Balanced nutrition';
    
    return `${portionSize} • ${healthNote}`;
  },

  // Get portion description
  getPortionDescription(multiplier) {
    if (multiplier > 1.8) return 'Extra Large';
    if (multiplier > 1.4) return 'Large';
    if (multiplier > 1.1) return 'Regular';
    if (multiplier > 0.8) return 'Medium';
    return 'Small';
  },

  // Create intelligent variations of detected foods
  createIntelligentVariation(basePrediction, variationIndex) {
    const originalName = basePrediction.name.toLowerCase();
    
    if (variationIndex === 1) {
      // Create a "with sides" version
      const commonSides = this.getCommonSides(originalName);
      if (commonSides.length > 0) {
        const side = commonSides[0];
        const sideNutrition = NUTRITION_DATABASE[side];
        if (sideNutrition) {
          const sideMultiplier = sideNutrition.portion / 100 * 0.8; // Smaller side portion
          return {
            ...basePrediction,
            name: `${basePrediction.name} with ${this.capitalizeWords(side)}`,
            calories: basePrediction.calories + Math.round(sideNutrition.calories * sideMultiplier),
            carbs: basePrediction.carbs + Math.round(sideNutrition.carbs * sideMultiplier),
            protein: basePrediction.protein + Math.round(sideNutrition.protein * sideMultiplier),
            fat: basePrediction.fat + Math.round(sideNutrition.fat * sideMultiplier),
            confidence: basePrediction.confidence * 0.85,
            description: 'Complete meal with side',
            portionSize: 'Meal Size'
          };
        }
      }
    } else if (variationIndex === 2) {
      // Create a larger portion version
      return {
        ...basePrediction,
        name: `Large ${basePrediction.name}`,
        calories: Math.round(basePrediction.calories * 1.4),
        carbs: Math.round(basePrediction.carbs * 1.4),
        protein: Math.round(basePrediction.protein * 1.4),
        fat: Math.round(basePrediction.fat * 1.4),
        confidence: basePrediction.confidence * 0.8,
        description: 'Generous portion size',
        portionSize: 'Large'
      };
    }
    
    return null;
  },

  // Get common side dishes for foods
  getCommonSides(mainFood) {
    const sides = {
      'chicken breast': ['rice', 'broccoli', 'sweet potato'],
      'salmon': ['rice', 'spinach', 'quinoa'],
      'beef': ['potato', 'carrot', 'broccoli'],
      'pasta': ['salad', 'broccoli'],
      'pizza': ['salad'],
      'sandwich': ['chips'],
      'soup': ['bread']
    };
    
    return sides[mainFood] || ['salad', 'rice'];
  },

  // Time-based fallback predictions
  getTimeBasedFallbacks() {
    const hour = new Date().getHours();
    
    if (hour < 10) { // Breakfast
      return [
        {
          name: 'Breakfast Bowl',
          calories: 320,
          carbs: 45,
          protein: 15,
          fat: 8,
          confidence: 0.4,
          description: 'Typical breakfast portion',
          mealType: 'Breakfast'
        },
        {
          name: 'Light Breakfast',
          calories: 180,
          carbs: 25,
          protein: 8,
          fat: 4,
          confidence: 0.35,
          description: 'Smaller morning meal',
          mealType: 'Breakfast'
        },
        {
          name: 'Hearty Breakfast',
          calories: 480,
          carbs: 55,
          protein: 22,
          fat: 18,
          confidence: 0.3,
          description: 'Full breakfast meal',
          mealType: 'Breakfast'
        }
      ];
    } else if (hour < 14) { // Lunch
      return [
        {
          name: 'Lunch Plate',
          calories: 420,
          carbs: 48,
          protein: 25,
          fat: 15,
          confidence: 0.4,
          description: 'Balanced lunch meal',
          mealType: 'Lunch'
        },
        {
          name: 'Light Lunch',
          calories: 280,
          carbs: 35,
          protein: 15,
          fat: 8,
          confidence: 0.35,
          description: 'Lighter midday meal',
          mealType: 'Lunch'
        },
        {
          name: 'Large Lunch',
          calories: 580,
          carbs: 65,
          protein: 32,
          fat: 22,
          confidence: 0.3,
          description: 'Substantial lunch',
          mealType: 'Lunch'
        }
      ];
    } else { // Dinner/Snack
      return [
        {
          name: 'Dinner Plate',
          calories: 520,
          carbs: 55,
          protein: 32,
          fat: 20,
          confidence: 0.4,
          description: 'Complete dinner meal',
          mealType: 'Dinner'
        },
        {
          name: 'Light Dinner',
          calories: 350,
          carbs: 40,
          protein: 22,
          fat: 12,
          confidence: 0.35,
          description: 'Lighter evening meal',
          mealType: 'Dinner'
        },
        {
          name: 'Snack',
          calories: 150,
          carbs: 18,
          protein: 6,
          fat: 6,
          confidence: 0.3,
          description: 'Evening snack',
          mealType: 'Snack'
        }
      ];
    }
  },

  // Suggest meal type based on food and calories
  suggestMealType(foodName, calories) {
    const hour = new Date().getHours();
    
    if (calories < 200) return 'Snack';
    if (hour < 10) return 'Breakfast';
    if (hour < 14) return 'Lunch';
    if (hour < 18) return 'Afternoon Snack';
    return 'Dinner';
  },

  // Generate food description for user clarity
  generateFoodDescription(foodName, nutritionInfo) {
    const descriptions = {
      'apple': 'Fresh fruit, rich in fiber',
      'banana': 'Energy-rich fruit with potassium',
      'chicken breast': 'Lean protein source',
      'salmon': 'Omega-3 rich fish',
      'rice': 'Carbohydrate staple',
      'broccoli': 'Nutrient-dense vegetable',
      'pizza': 'Italian flatbread dish',
      'sandwich': 'Bread with fillings'
    };

    return descriptions[foodName] || `${Math.round(nutritionInfo.calories)}cal per serving`;
  },

  // Calculate nutrition for detected foods (keeping for backward compatibility)
  calculateNutrition(detectedFoods) {
    if (detectedFoods.length === 0) {
      // Return default meal if no foods detected
      return {
        name: 'Mixed Meal',
        calories: 300,
        carbs: 35,
        protein: 15,
        fat: 12,
        detectedFoods: [],
        confidence: 0.3
      };
    }

    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let foodNames = [];
    let avgConfidence = 0;

    detectedFoods.slice(0, 3).forEach(food => { // Take top 3 most confident foods
      const nutritionInfo = NUTRITION_DATABASE[food.name];
      if (nutritionInfo) {
        const portionMultiplier = nutritionInfo.portion / 100; // Convert to actual portion
        
        totalCalories += Math.round(nutritionInfo.calories * portionMultiplier);
        totalCarbs += Math.round(nutritionInfo.carbs * portionMultiplier);
        totalProtein += Math.round(nutritionInfo.protein * portionMultiplier);
        totalFat += Math.round(nutritionInfo.fat * portionMultiplier);
        
        foodNames.push(food.name);
        avgConfidence += food.confidence;
      }
    });

    avgConfidence = avgConfidence / detectedFoods.length;
    
    return {
      name: foodNames.length > 0 ? this.generateMealName(foodNames) : 'Unknown Food',
      calories: Math.max(totalCalories, 50), // Minimum 50 calories
      carbs: Math.max(totalCarbs, 5),
      protein: Math.max(totalProtein, 2),
      fat: Math.max(totalFat, 1),
      detectedFoods: detectedFoods,
      confidence: avgConfidence
    };
  },

  // Generate a readable meal name from detected foods
  generateMealName(foodNames) {
    if (foodNames.length === 1) {
      return this.capitalizeWords(foodNames[0]);
    } else if (foodNames.length === 2) {
      return `${this.capitalizeWords(foodNames[0])} with ${this.capitalizeWords(foodNames[1])}`;
    } else {
      return `${this.capitalizeWords(foodNames[0])} Mixed Meal`;
    }
  },

  // Capitalize words for display
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }
};
