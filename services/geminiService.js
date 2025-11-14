import { GoogleGenerativeAI } from '@google/generative-ai';
import { securityService } from './apiKeySecurityService.js';

class GeminiService {
  constructor() {
    // Initialize Gemini AI - you'll need to add your API key to environment variables
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'demo_key';
    
    if (this.apiKey && this.apiKey !== 'demo_key') {
      // Validate API key security
      securityService.validateGeminiKey(this.apiKey);
      console.log('🤖 Initializing Gemini 2.5 Flash (advanced reasoning model)');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // Use available Gemini models (based on API key test results)
      try {
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        console.log('✅ Using gemini-2.5-flash-lite (speed-optimized for recipes)');
      } catch (error) {
        console.log('⚠️ Flash Lite unavailable, falling back to standard Flash');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log('✅ Using gemini-2.5-flash (standard speed)');
      }
    }
  }

  // Search for recipes using AI
  async searchRecipes(query, userPreferences = {}) {
    try {
      // Security checks
      securityService.checkRateLimit('gemini');
      securityService.monitorModelUsage('gemini-2.5-flash', 'recipe-search');
      
      if (!this.model) {
        throw new Error('Gemini API not configured');
      }

      const prompt = this.buildRecipeSearchPrompt(query, userPreferences);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response into recipe format
      return this.parseRecipeResponse(text);
    } catch (error) {
      console.error('Gemini search error:', error);
      throw error;
    }
  }

  // Build a comprehensive prompt for finding real online recipes
  buildRecipeSearchPrompt(query, preferences = {}) {
    const {
      diet = '',
      allergies = [],
      maxCalories = '',
      maxCookTime = '',
      skillLevel = 'beginner',
      servings = 4
    } = preferences;

    return `
You are a recipe search expert. Find 6-8 real, existing recipes from reputable cooking websites that match: "${query}"

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON.

IMPORTANT GUIDELINES:
- Only suggest real recipes that exist on well-known cooking sites
- Focus on popular, well-tested recipes (AllRecipes, Food Network, Bon Appétit, Serious Eats, Tasty, BBC Good Food, etc.)
- Provide accurate recipe titles as they appear on the source website
- Include realistic cooking times and nutrition estimates

Search Criteria:
- Diet preference: ${diet || 'None specified'}
- Allergies to avoid: ${allergies.length > 0 ? allergies.join(', ') : 'None'}
- Maximum calories per serving: ${maxCalories || 'No limit'}
- Maximum cooking time: ${maxCookTime || 'No limit'}
- Skill level: ${skillLevel}
- Servings: ${servings}

RESPOND WITH ONLY THIS JSON FORMAT (no markdown, no explanation, no extra text):

{
  "recipes": [
    {
      "id": "recipe_${Date.now()}_1",
      "title": "Exact recipe title from website",
      "description": "Brief 2-sentence description of the dish",
      "source": "Website name",
      "author": "Recipe author if known",
      "sourceUrl": "https://actual-recipe-page-url.com",
      "image": "https://actual-recipe-image-url.jpg",
      "readyInMinutes": 45,
      "prepTime": 15,
      "cookTime": 30,
      "servings": ${servings},
      "difficulty": "easy",
      "calories": 380,
      "protein": 22,
      "carbs": 35,
      "fat": 16,
      "fiber": 4,
      "sugar": 6,
      "ingredients": [
        {
          "name": "chicken breast",
          "amount": 1,
          "unit": "lb"
        }
      ],
      "instructions": [
        "Preheat oven to 375°F",
        "Season chicken with salt and pepper",
        "Heat oil in oven-safe skillet over medium-high heat"
      ],
      "tags": ["main-dish", "chicken", "healthy"],
      "cuisine": "American",
      "searchRelevance": "Why this recipe matches the search query"
    }
  ]
}

IMAGE REQUIREMENTS:
- Try to find the actual image URL from the recipe's source website
- Image should be high-quality and show the finished dish
- If you can't find the actual image URL, use a descriptive placeholder like "https://images.unsplash.com/photo-[relevant-food-photo]"
- Avoid broken or generic placeholder URLs

Requirements:
1. All recipes must be real and findable online
2. Provide actual recipe page URLs when possible
3. Include real recipe images from the source sites
4. Provide realistic nutrition estimates
5. Include detailed ingredient lists with measurements
6. Instructions should be clear step-by-step
7. Match the dietary requirements specified
8. Return ONLY valid JSON, no additional text
`;
  }

  // Parse AI response into structured recipe data
  parseRecipeResponse(responseText) {
    try {
      console.log('Raw Gemini response length:', responseText.length);
      console.log('Raw Gemini response (first 500 chars):', responseText.substring(0, 500));
      console.log('Raw Gemini response (last 200 chars):', responseText.substring(Math.max(0, responseText.length - 200)));
      
      // Check if response is too short or empty
      if (!responseText || responseText.trim().length < 10) {
        console.error('Gemini response is too short or empty');
        return this.extractRecipeFallback(responseText);
      }
      
      // Clean the response to extract JSON
      let cleanedResponse = responseText.trim();
      
      // Remove control characters (U+0000 to U+001F) that break JSON parsing
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F]/g, '');
      
      // More aggressive markdown removal
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, ''); // Remove opening ```json
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, ''); // Remove opening ```
      cleanedResponse = cleanedResponse.replace(/\s*```\s*$/i, ''); // Remove closing ```
      cleanedResponse = cleanedResponse.replace(/```json/gi, ''); // Remove any remaining ```json
      cleanedResponse = cleanedResponse.replace(/```/g, ''); // Remove any remaining ```
      
      // Check if we have any content left after markdown removal
      if (!cleanedResponse || cleanedResponse.trim().length < 5) {
        console.error('No content left after markdown removal');
        return this.extractRecipeFallback(responseText);
      }
      
      // Remove any comments that might break JSON parsing
      cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, ''); // Remove // comments
      cleanedResponse = cleanedResponse.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
      
      // Remove common AI response prefixes/suffixes
      cleanedResponse = cleanedResponse
        .replace(/^\s*Here's?.*?:\s*/i, '') // Remove "Here's the response:" type prefixes
        .replace(/^\s*Response:\s*/i, '') // Remove "Response:" prefix
        .replace(/^\s*Result:\s*/i, '') // Remove "Result:" prefix
        .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
        .trim();
      
      // Remove any non-printable characters that might be causing issues
      cleanedResponse = cleanedResponse.replace(/[^\x20-\x7E\n\r\t]/g, '');
      
      // Find JSON boundaries more carefully
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      } else {
        // If no proper JSON boundaries found, try to find array boundaries
        const arrayStart = cleanedResponse.indexOf('[');
        const arrayEnd = cleanedResponse.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          cleanedResponse = cleanedResponse.substring(arrayStart, arrayEnd + 1);
        } else {
          console.error('No valid JSON boundaries found in response');
          console.log('Response first 200 chars:', responseText.substring(0, 200));
          console.log('Response last 200 chars:', responseText.substring(Math.max(0, responseText.length - 200)));
          
          // If Gemini didn't return proper JSON, still try to return some results
          // rather than failing completely
          return [{
            id: `ai_partial_${Date.now()}`,
            title: 'AI Search Partially Successful',
            description: 'The AI found recipe information but had formatting issues. Please try a more specific search term for better results.',
            source: 'gemini_ai_partial',
            isAIGenerated: true,
            calories: 350,
            protein: 20,
            carbs: 40,
            fat: 12,
            ingredients: [
              { name: 'Try more specific search terms', amount: '', unit: '' }
            ],
            instructions: [
              'The AI recipe search encountered formatting issues.',
              'For better results, try searching with terms like:',
              '• "Healthy chicken breast recipe"',
              '• "Quick vegetarian pasta"',
              '• "Low carb dinner ideas"'
            ],
            readyInMinutes: 30,
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            image: this.generateFoodImageUrl('healthy food'),
            difficulty: 'easy',
            cuisine: 'Various',
            tags: ['search-help']
          }];
        }
      }
      
      // Check if we have a complete JSON structure
      if (cleanedResponse.length < 10) {
        console.error('Cleaned response is too short to be valid JSON');
        return this.extractRecipeFallback(responseText);
      }
      
      // Final cleanup for JSON formatting
      cleanedResponse = cleanedResponse
        .replace(/,\s*}/g, '}') // Fix trailing commas before closing braces
        .replace(/,\s*]/g, ']') // Fix trailing commas before closing brackets
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted property names
        .trim();
      
      // Additional validation - ensure string values don't contain unescaped quotes or control chars
      try {
        cleanedResponse = cleanedResponse.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
          // Escape any unescaped quotes and control characters within string values
          const escaped = content
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"')    // Escape quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
          return `"${escaped}"`;
        });
      } catch (regexError) {
        console.log('Regex cleanup failed, proceeding with original cleaned response');
      }
      
      console.log('Final cleaned response (first 300 chars):', cleanedResponse.substring(0, 300));
      console.log('Final cleaned response (last 100 chars):', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 100)));
      
      // Validate JSON structure before parsing
      const openBraces = (cleanedResponse.match(/\{/g) || []).length;
      const closeBraces = (cleanedResponse.match(/\}/g) || []).length;
      const openBrackets = (cleanedResponse.match(/\[/g) || []).length;
      const closeBrackets = (cleanedResponse.match(/\]/g) || []).length;
      
      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.error(`JSON structure invalid: {${openBraces}/${closeBraces}, [${openBrackets}/${closeBrackets}]`);
        return this.extractRecipeFallback(responseText);
      }
      
      // Parse JSON
      const parsed = JSON.parse(cleanedResponse);
      
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        console.log('Successfully parsed', parsed.recipes.length, 'real recipes from Gemini');
        return parsed.recipes.map(recipe => ({
          ...recipe,
          id: recipe.id || `ai_recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: recipe.source || 'gemini_ai',
          isAIGenerated: false, // These are real recipes found online
          isAISearched: true,   // But found via AI search
          // Ensure nutrition data is present
          calories: recipe.calories || 400,
          protein: recipe.protein || 20,
          carbs: recipe.carbs || 40,
          fat: recipe.fat || 15,
          // Improve image handling
          image: this.validateAndImproveImageUrl(recipe.image, recipe.title)
        }));
      }
      
      // If no recipes array, try the parsed object directly as an array
      if (Array.isArray(parsed)) {
        console.log('Successfully parsed', parsed.length, 'real recipes from Gemini (direct array)');
        return parsed.map(recipe => ({
          ...recipe,
          id: recipe.id || `ai_recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: recipe.source || 'gemini_ai',
          isAIGenerated: false, // These are real recipes found online
          isAISearched: true,   // But found via AI search
          // Ensure nutrition data is present
          calories: recipe.calories || 400,
          protein: recipe.protein || 20,
          carbs: recipe.carbs || 40,
          fat: recipe.fat || 15,
          // Improve image handling
          image: this.validateAndImproveImageUrl(recipe.image, recipe.title)
        }));
      }
      
      console.log('No valid recipe array found in parsed response');
      return this.extractRecipeFallback(responseText);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Raw response length:', responseText.length);
      console.error('Raw response (first 500 chars):', responseText.substring(0, 500));
      
      // Try to extract any recipe information manually as fallback
      try {
        return this.extractRecipeFallback(responseText);
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        // Return a basic fallback with search terms
        return [{
          id: `ai_fallback_${Date.now()}`,
          title: 'Recipe Search Needs Refinement',
          description: 'AI recipe search encountered technical issues. Try using more specific search terms for better results.',
          source: 'gemini_fallback',
          isAIGenerated: true,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          ingredients: [
            { name: 'More specific search terms needed', amount: '', unit: '' }
          ],
          instructions: [
            'The AI search encountered technical difficulties.',
            'Try searching with more specific terms like:',
            '• "Chicken breast with vegetables"',
            '• "Vegetarian pasta recipe"',
            '• "Quick 30-minute meals"',
            '• "Healthy breakfast ideas"'
          ],
          readyInMinutes: 0,
          prepTime: 0,
          cookTime: 0,
          servings: 0,
          image: this.generateFoodImageUrl('food'),
          difficulty: 'easy',
          cuisine: 'Help',
          tags: ['search-help']
        }];
      }
    }
  }

  // Validate and improve recipe image URLs
  validateAndImproveImageUrl(imageUrl, recipeTitle) {
    console.log('Validating image URL for', recipeTitle, ':', imageUrl);
    
    // If no image URL provided, generate a food-related image
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('example.com')) {
      console.log('No valid image URL, generating food image for:', recipeTitle);
      return this.generateFoodImageUrl(recipeTitle);
    }

    // Validate that the URL looks like a real image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerUrl = imageUrl.toLowerCase();
    
    // Check if URL ends with image extension or has image in query params
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    const isKnownImageHost = [
      'images.unsplash.com',
      'cdn.pixabay.com',
      'images.pexels.com',
      'allrecipes.com',
      'foodnetwork.com',
      'bonappetit.com',
      'seriouseats.com',
      'tasty.co',
      'bbcgoodfood.com',
      'food.com',
      'delish.com',
      'eatingwell.com'
    ].some(host => lowerUrl.includes(host));

    // If it looks like a valid image URL, use it
    if (hasImageExtension || isKnownImageHost) {
      console.log('Using provided image URL:', imageUrl);
      return imageUrl;
    }

    // Otherwise, generate a better food image
    console.log('Image URL not valid, generating food image for:', recipeTitle);
    return this.generateFoodImageUrl(recipeTitle);
  }

  // Generate a food-related image URL based on recipe title
  generateFoodImageUrl(recipeTitle) {
    console.log('Generating food image URL for:', recipeTitle);
    
    // Extract key food words from the title
    const foodKeywords = this.extractFoodKeywords(recipeTitle);
    const primaryFood = foodKeywords[0] || 'food';
    
    console.log('Primary food keyword:', primaryFood);
    
    // Use Unsplash for high-quality food images
    const unsplashBaseUrl = 'https://images.unsplash.com/photo-';
    
    // Map common foods to specific Unsplash photo IDs (these are real, high-quality food photos)
    const foodPhotoMap = {
      'pasta': '1565299507177-b0ac66763828', // Beautiful pasta dish
      'pizza': '1571066811602-716837d681de', // Delicious pizza
      'salad': '1512621776951-a57141f2eefd', // Fresh salad
      'chicken': '1598515213692-d31adb275c4f', // Grilled chicken
      'salmon': '1467003909585-2f8a72700288', // Salmon fillet
      'soup': '1547592166-23ac45744acd', // Warm soup
      'steak': '1546833999-b9f581a1996d', // Juicy steak
      'sandwich': '1568901346375-23c9450c58cd', // Gourmet sandwich
      'burger': '1571091718767-18b5b1457add', // Tasty burger
      'tacos': '1565299624946-b28f40a0ca4b', // Mexican tacos
      'curry': '1585032226651-4344db0ff574', // Indian curry
      'sushi': '1579952363873-27d3bfdc9f79', // Fresh sushi
      'dessert': '1567620905732-2d1ec7ab7445', // Sweet dessert
      'cake': '1578985545622-7c14a934b83b', // Beautiful cake
      'bread': '1509440159596-0249088772ff', // Fresh bread
      'rice': '1516684669134-de6f48d2a60d', // Rice dish
      'fish': '1544943910-b1cc6ad6eac0', // Cooked fish
      'vegetables': '1540420773420-69d1aebd4b19', // Fresh vegetables
      'breakfast': '1506084868230-bb9d95c24759', // Breakfast spread
      'noodles': '1569718212165-3b5b2810aa18', // Asian noodles
      'food': '1504674900919-07716e80b45e' // Generic delicious food
    };

    // Find the best matching photo
    const photoId = foodPhotoMap[primaryFood] || foodPhotoMap['food'];
    
    console.log('Selected photo ID:', photoId);
    
    const finalUrl = `${unsplashBaseUrl}${photoId}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`;
    
    console.log('Generated image URL:', finalUrl);
    
    return finalUrl;
  }

  // Extract food-related keywords from recipe title
  extractFoodKeywords(title) {
    const commonFoods = [
      'pasta', 'pizza', 'salad', 'chicken', 'salmon', 'soup', 'steak', 'sandwich',
      'burger', 'tacos', 'curry', 'sushi', 'dessert', 'cake', 'bread', 'rice',
      'fish', 'vegetables', 'breakfast', 'noodles', 'beef', 'pork', 'shrimp',
      'lobster', 'turkey', 'duck', 'lamb', 'quinoa', 'beans', 'lentils'
    ];

    const titleLower = title.toLowerCase();
    const foundFoods = commonFoods.filter(food => titleLower.includes(food));
    
    return foundFoods.length > 0 ? foundFoods : ['food'];
  }

  // Analyze nutrition facts from recipe content or URL
  async analyzeRecipeNutrition(recipeTitle, ingredients, instructions) {
    try {
      // Ensure instructions is an array
      const safeInstructions = Array.isArray(instructions) ? instructions : [];
      const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

      const prompt = `
Analyze the nutritional content of this recipe and provide accurate nutrition facts:

Recipe: "${recipeTitle}"

Ingredients:
${safeIngredients.map(ing => `- ${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`).join('\n')}

Instructions:
${safeInstructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Please calculate realistic nutrition facts per serving and return ONLY JSON:

{
  "nutrition": {
    "calories": 380,
    "protein": 22,
    "carbs": 35,
    "fat": 16,
    "fiber": 4,
    "sugar": 6,
    "sodium": 450,
    "cholesterol": 65,
    "saturatedFat": 5,
    "unsaturatedFat": 11
  },
  "servings": 4,
  "confidence": "high|medium|low"
}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return parsed.nutrition;
    } catch (error) {
      console.error('Error analyzing nutrition:', error);
      // Return reasonable defaults
      return {
        calories: 400,
        protein: 20,
        carbs: 40,
        fat: 15,
        fiber: 3,
        sugar: 5
      };
    }
  }

  // Enhanced fallback method to extract recipe information from malformed responses
  extractRecipeFallback(responseText) {
    console.log('Using fallback recipe extraction');
    const recipes = [];
    
    // Look for recipe-like patterns in the text
    const titleMatches = responseText.match(/(?:title|name)["']?\s*:\s*["']([^"'\n]+)["']?/gi);
    const descriptionMatches = responseText.match(/(?:description)["']?\s*:\s*["']([^"'\n]+)["']?/gi);
    
    if (titleMatches && titleMatches.length > 0) {
      titleMatches.forEach((match, index) => {
        const titleMatch = match.match(/["']([^"']+)["']?$/);
        if (titleMatch) {
          const title = titleMatch[1];
          
          // Create a more complete recipe object
          const recipe = {
            id: `ai_recipe_fallback_${Date.now()}_${index}`,
            title: title,
            description: descriptionMatches && descriptionMatches[index] ? 
              descriptionMatches[index].match(/["']([^"']+)["']?$/)?.[1] || 'Delicious recipe found via AI search' : 
              'Delicious recipe found via AI search',
            ingredients: [
              { name: 'Various ingredients', amount: 'As needed', unit: '' }
            ],
            instructions: [
              'This recipe was found through AI search.',
              'For complete instructions, please search for the recipe online.',
              'The AI search identified this as a relevant recipe for your query.'
            ],
            readyInMinutes: 30,
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            calories: 400,
            protein: 20,
            carbs: 40,
            fat: 15,
            fiber: 3,
            sugar: 5,
            source: 'gemini_ai_fallback',
            isAIGenerated: false,
            isAISearched: true,
            // Generate a proper food image
            image: this.generateFoodImageUrl(title),
            difficulty: 'medium',
            cuisine: 'International',
            tags: ['ai-found']
          };
          
          recipes.push(recipe);
        }
      });
    }
    
    // If no titles found, create a generic "search failed" recipe
    if (recipes.length === 0) {
      recipes.push({
        id: `ai_search_failed_${Date.now()}`,
        title: 'AI Recipe Search Encountered Issues',
        description: 'The AI search found recipes but encountered formatting issues. Please try refining your search terms.',
        ingredients: [
          { name: 'Try different keywords', amount: '', unit: '' }
        ],
        instructions: [
          'The AI recipe search encountered technical difficulties.',
          'Try searching with different keywords or more specific terms.',
          'For example: "chicken pasta", "vegetarian soup", "chocolate cake"'
        ],
        readyInMinutes: 0,
        prepTime: 0,
        cookTime: 0,
        servings: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        source: 'gemini_error',
        isAIGenerated: true,
        image: this.generateFoodImageUrl('food'),
        difficulty: 'easy',
        cuisine: 'Help',
        tags: ['search-help']
      });
    }
    
    return recipes;
  }

  // Generate recipe suggestions based on available ingredients
  async getRecipesByIngredients(ingredients, preferences = {}) {
    const ingredientList = ingredients.join(', ');
    const query = `Recipes I can make with these ingredients: ${ingredientList}`;
    
    return this.searchRecipes(query, {
      ...preferences,
      includeInstructions: `Focus on recipes that primarily use these ingredients: ${ingredientList}. Suggest what additional common pantry items might be needed.`
    });
  }

  // Get meal planning suggestions
  async getMealPlanSuggestions(mealType, preferences = {}) {
    const query = `${mealType} meal ideas that are healthy and delicious`;
    return this.searchRecipes(query, {
      ...preferences,
      mealType
    });
  }

  // Analyze a recipe and suggest modifications
  async suggestRecipeModifications(recipe, modifications = {}) {
    const prompt = `
Analyze this recipe and suggest modifications:

Recipe: ${recipe.title}
Ingredients: ${recipe.ingredients?.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ')}
Instructions: ${recipe.instructions?.join(' ')}

Requested modifications: ${JSON.stringify(modifications)}

Please provide a modified version with the same JSON structure as the original recipe.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseRecipeResponse(text);
    } catch (error) {
      console.error('Error getting recipe modifications:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
