import { supabase } from '../supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  FAVORITES: '@recipe_favorites',
  HISTORY: '@recipe_history',
  INGREDIENTS: '@user_ingredients',
  LAST_CACHE_UPDATE: '@recipe_cache_update'
};

class RecipeService {
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || 'demo_key';
    this.baseUrl = 'https://api.spoonacular.com/recipes';
    this.hasValidApiKey = this.apiKey && this.apiKey !== 'demo_key';
    
    if (!this.hasValidApiKey) {
      console.warn('Spoonacular API key not configured. Using fallback recipes only.');
    }
  }

  // Get user's favorite recipes from database
  async getFavoriteRecipes(userId) {
    try {
      const { data, error } = await supabase
        .from('user_favorite_recipes')
        .select(`
          *,
          recipe_data
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting favorite recipes:', error);
      // Fallback to local storage
      return await this.getFavoritesFromCache();
    }
  }

  // Get user's recipe history from database
  async getRecipeHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('user_recipe_history')
        .select(`
          *,
          recipe_data
        `)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recipe history:', error);
      // Fallback to local storage
      return await this.getHistoryFromCache();
    }
  }

  // Save recipe as favorite
  async addToFavorites(userId, recipe) {
    try {
      const { data, error } = await supabase
        .from('user_favorite_recipes')
        .insert({
          user_id: userId,
          recipe_id: recipe.id,
          recipe_data: recipe,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Also cache locally
      await this.addToFavoritesCache(recipe);
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      // Fallback to local storage only
      await this.addToFavoritesCache(recipe);
      return false;
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId, recipeId) {
    try {
      const { error } = await supabase
        .from('user_favorite_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;
      
      // Also remove from cache
      await this.removeFromFavoritesCache(recipeId);
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      // Fallback to local storage only
      await this.removeFromFavoritesCache(recipeId);
      return false;
    }
  }

  // Add to recipe history
  async addToHistory(userId, recipe) {
    try {
      // Check if already in history
      const { data: existing } = await supabase
        .from('user_recipe_history')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipe.id)
        .single();

      if (existing) {
        // Update viewed_at timestamp
        const { error } = await supabase
          .from('user_recipe_history')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new history entry
        const { error } = await supabase
          .from('user_recipe_history')
          .insert({
            user_id: userId,
            recipe_id: recipe.id,
            recipe_data: recipe,
            viewed_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }

      // Also cache locally
      await this.addToHistoryCache(recipe);
      return true;
    } catch (error) {
      console.error('Error adding to history:', error);
      // Fallback to local storage only
      await this.addToHistoryCache(recipe);
      return false;
    }
  }

  // Search recipes with filters
  async searchRecipes(query, filters = {}) {
    // If no valid API key, use fallback recipes immediately
    if (!this.hasValidApiKey) {
      console.log('No valid Spoonacular API key, using fallback recipes');
      return this.getFallbackRecipes(query, filters);
    }

    try {
      const {
        diet = '',         // vegetarian, vegan, keto, etc.
        intolerances = '', // gluten, dairy, etc.
        maxCalories = '',
        maxCarbs = '',
        maxSodium = '',
        cuisine = '',
        mealType = '',
        maxReadyTime = ''
      } = filters;

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        query: query || '',
        number: 12, // Increased to get more results
        addRecipeInformation: true,
        addRecipeNutrition: true,
        fillIngredients: true,
        instructionsRequired: true, // Ensure recipes have instructions
        addRecipeInstructions: true // Get detailed instructions
      });

      // Add filters if provided
      if (diet) params.append('diet', diet);
      if (intolerances) params.append('intolerances', intolerances);
      if (maxCalories) params.append('maxCalories', maxCalories);
      if (maxCarbs) params.append('maxCarbs', maxCarbs);
      if (maxSodium) params.append('maxSodium', maxSodium);
      if (cuisine) params.append('cuisine', cuisine);
      if (mealType) params.append('type', mealType);
      if (maxReadyTime) params.append('maxReadyTime', maxReadyTime);

      console.log('Spoonacular API URL:', `${this.baseUrl}/complexSearch?${params}`);

      const response = await fetch(`${this.baseUrl}/complexSearch?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Spoonacular API key is invalid or expired');
          this.hasValidApiKey = false; // Mark as invalid to skip future requests
        } else if (response.status === 402) {
          console.error('Spoonacular API quota exceeded');
          this.hasValidApiKey = false; // Mark as invalid to skip future requests
        } else if (response.status === 403) {
          console.error('Spoonacular API access forbidden');
          this.hasValidApiKey = false; // Mark as invalid to skip future requests
        }
        throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        console.log(`Spoonacular returned ${data.results.length} recipes`);
        return data.results.map(recipe => {
          const formatted = this.formatRecipe(recipe);
          console.log('Formatted recipe:', formatted.title, 'Image:', formatted.image ? 'Yes' : 'No');
          return formatted;
        });
      }

      console.log('No results from Spoonacular API, using fallback');
      return this.getFallbackRecipes(query, filters);
    } catch (error) {
      console.error('Spoonacular API search error:', error);
      
      // Mark API as invalid if it's an authentication error
      if (error.message.includes('401') || error.message.includes('402') || error.message.includes('403')) {
        this.hasValidApiKey = false;
      }
      
      // Return fallback recipes instead of empty array
      return this.getFallbackRecipes(query, filters);
    }
  }

  // Get recipes by ingredients (what can I make with what I have)
  async getRecipesByIngredients(ingredients, filters = {}) {
    try {
      const {
        ranking = 1, // 1 = maximize used ingredients, 2 = minimize missing ingredients
        number = 20
      } = filters;

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        ingredients: ingredients.join(','),
        number,
        ranking,
        ignorePantry: true,
        addRecipeInformation: true
      });

      const response = await fetch(`${this.baseUrl}/findByIngredients?${params}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        // Get detailed nutrition info for each recipe
        const recipesWithNutrition = await Promise.all(
          data.map(async (recipe) => {
            try {
              const nutritionResponse = await fetch(
                `${this.baseUrl}/${recipe.id}/nutritionWidget.json?apiKey=${this.apiKey}`
              );
              const nutrition = await nutritionResponse.json();
              return this.formatRecipeWithIngredients(recipe, nutrition);
            } catch (error) {
              console.error('Error getting nutrition for recipe:', recipe.id, error);
              return this.formatRecipeWithIngredients(recipe);
            }
          })
        );

        return recipesWithNutrition;
      }

      return [];
    } catch (error) {
      console.error('Error finding recipes by ingredients:', error);
      return this.getFallbackRecipesByIngredients(ingredients);
    }
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId) {
    try {
      // Handle AI-generated recipes differently
      if (typeof recipeId === 'string' && recipeId.startsWith('ai_recipe_')) {
        console.log('Returning AI-generated recipe details as-is');
        return null; // Let the caller use the original recipe data
      }

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        includeNutrition: true
      });

      const response = await fetch(`${this.baseUrl}/${recipeId}/information?${params}`);
      
      // Check if response is ok
      if (!response.ok) {
        console.error(`Recipe API returned status ${response.status} for recipe ${recipeId}`);
        return null;
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Recipe API returned non-JSON content for recipe ${recipeId}:`, contentType);
        return null;
      }

      // Get response text first to check for HTML errors
      const responseText = await response.text();
      
      // Check if response looks like HTML (error page)
      if (responseText.trim().startsWith('<')) {
        console.error(`Recipe API returned HTML instead of JSON for recipe ${recipeId}`);
        return null;
      }

      // Try to parse JSON
      const data = JSON.parse(responseText);
      
      // Validate that we got recipe data
      if (!data || !data.id) {
        console.error(`Invalid recipe data received for recipe ${recipeId}`);
        return null;
      }

      return this.formatRecipe(data);
    } catch (error) {
      console.error('Error getting recipe details for recipe', recipeId, ':', error);
      
      // If it's a parsing error, log more details
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('JSON parsing failed - API likely returned HTML error page');
      }
      
      return null;
    }
  }

  // Store user's available ingredients
  async saveUserIngredients(userId, ingredients) {
    try {
      const { error } = await supabase
        .from('user_ingredients')
        .upsert({
          user_id: userId,
          ingredients: ingredients,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Also cache locally
      await AsyncStorage.setItem(CACHE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
      return true;
    } catch (error) {
      console.error('Error saving ingredients:', error);
      // Fallback to local storage only
      await AsyncStorage.setItem(CACHE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
      return false;
    }
  }

  // Get user's available ingredients
  async getUserIngredients(userId) {
    try {
      const { data, error } = await supabase
        .from('user_ingredients')
        .select('ingredients')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.ingredients || [];
    } catch (error) {
      console.error('Error getting user ingredients:', error);
      // Fallback to local storage
      const cached = await AsyncStorage.getItem(CACHE_KEYS.INGREDIENTS);
      return cached ? JSON.parse(cached) : [];
    }
  }

  // Format recipe data to consistent structure
  formatRecipe(recipe) {
    const nutrition = recipe.nutrition?.nutrients || [];
    const calories = this.findNutrient(nutrition, 'Calories')?.amount || 0;
    const protein = this.findNutrient(nutrition, 'Protein')?.amount || 0;
    const carbs = this.findNutrient(nutrition, 'Carbohydrates')?.amount || 0;
    const fat = this.findNutrient(nutrition, 'Fat')?.amount || 0;
    const fiber = this.findNutrient(nutrition, 'Fiber')?.amount || 0;
    const sugar = this.findNutrient(nutrition, 'Sugar')?.amount || 0;
    const sodium = this.findNutrient(nutrition, 'Sodium')?.amount || 0;

    // Enhance image URL to get higher quality images from Spoonacular
    let imageUrl = recipe.image;
    if (imageUrl && imageUrl.includes('spoonacular.com')) {
      // Convert to higher quality image URL
      imageUrl = imageUrl.replace(/\d+x\d+/, '636x393');
    }

    // Handle instructions properly - Spoonacular has analyzedInstructions as nested objects
    let instructions = [];
    if (recipe.instructions && Array.isArray(recipe.instructions)) {
      instructions = recipe.instructions;
    } else if (recipe.analyzedInstructions && Array.isArray(recipe.analyzedInstructions)) {
      // Spoonacular's analyzedInstructions format: [{ steps: [{ step: "text" }] }]
      instructions = recipe.analyzedInstructions.flatMap(instruction => 
        instruction.steps ? instruction.steps.map(step => step.step) : []
      );
    } else if (typeof recipe.instructions === 'string') {
      // If instructions is a string, split it into steps
      instructions = recipe.instructions.split(/\d+\.|\n/).filter(step => step.trim().length > 0);
    }

    return {
      id: recipe.id,
      title: recipe.title,
      image: imageUrl,
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 1,
      sourceUrl: recipe.sourceUrl,
      summary: recipe.summary,
      instructions: instructions,
      ingredients: recipe.extendedIngredients || [],
      nutrition: {
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        fiber: Math.round(fiber),
        sugar: Math.round(sugar),
        sodium: Math.round(sodium)
      },
      diets: recipe.diets || [],
      dishTypes: recipe.dishTypes || [],
      cuisines: recipe.cuisines || [],
      difficulty: this.calculateDifficulty(recipe),
      healthScore: recipe.healthScore || 0,
      pricePerServing: recipe.pricePerServing || 0,
      isVegetarian: recipe.vegetarian || false,
      isVegan: recipe.vegan || false,
      isGlutenFree: recipe.glutenFree || false,
      isDairyFree: recipe.dairyFree || false,
      source: 'spoonacular' // Mark as coming from Spoonacular API
    };
  }

  // Format recipe with ingredient matching info
  formatRecipeWithIngredients(recipe, nutrition = null) {
    const formatted = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients || [],
      missedIngredients: recipe.missedIngredients || [],
      unusedIngredients: recipe.unusedIngredients || [],
      usedIngredientCount: recipe.usedIngredientCount || 0,
      missedIngredientCount: recipe.missedIngredientCount || 0,
      likes: recipe.likes || 0
    };

    if (nutrition) {
      formatted.nutrition = {
        calories: Math.round(nutrition.calories || 0),
        protein: Math.round(nutrition.protein?.replace('g', '') || 0),
        carbs: Math.round(nutrition.carbs?.replace('g', '') || 0),
        fat: Math.round(nutrition.fat?.replace('g', '') || 0)
      };
    }

    return formatted;
  }

  // Helper function to find specific nutrient
  findNutrient(nutrients, name) {
    return nutrients.find(nutrient => 
      nutrient.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Calculate recipe difficulty based on various factors
  calculateDifficulty(recipe) {
    const ingredients = recipe.extendedIngredients?.length || 0;
    const time = recipe.readyInMinutes || 30;
    const instructions = recipe.analyzedInstructions?.[0]?.steps?.length || 0;

    if (ingredients <= 5 && time <= 20 && instructions <= 5) return 'Easy';
    if (ingredients <= 10 && time <= 45 && instructions <= 10) return 'Medium';
    return 'Hard';
  }

  // Cache management functions
  async getFavoritesFromCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.FAVORITES);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting favorites from cache:', error);
      return [];
    }
  }

  async addToFavoritesCache(recipe) {
    try {
      const favorites = await this.getFavoritesFromCache();
      const exists = favorites.find(fav => fav.id === recipe.id);
      if (!exists) {
        favorites.unshift(recipe);
        await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding to favorites cache:', error);
    }
  }

  async removeFromFavoritesCache(recipeId) {
    try {
      const favorites = await this.getFavoritesFromCache();
      const filtered = favorites.filter(fav => fav.id !== recipeId);
      await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from favorites cache:', error);
    }
  }

  async getHistoryFromCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.HISTORY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting history from cache:', error);
      return [];
    }
  }

  async addToHistoryCache(recipe) {
    try {
      const history = await this.getHistoryFromCache();
      // Remove if already exists to avoid duplicates
      const filtered = history.filter(item => item.id !== recipe.id);
      // Add to front
      filtered.unshift({ ...recipe, viewedAt: new Date().toISOString() });
      // Keep only last 50 items
      const trimmed = filtered.slice(0, 50);
      await AsyncStorage.setItem(CACHE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding to history cache:', error);
    }
  }

  // Fallback recipes for when API is unavailable
  getFallbackRecipes(query = '', filters = {}) {
    const fallbackRecipes = [
      {
        id: 'fallback_1',
        title: 'Greek Chicken Bowl',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 25,
        servings: 4,
        sourceUrl: 'https://example.com/greek-chicken-bowl',
        summary: 'A healthy and delicious Greek-inspired chicken bowl with quinoa, fresh vegetables, and feta cheese.',
        instructions: [
          'Cook quinoa according to package directions',
          'Season chicken breast with Greek herbs and grill until cooked through',
          'Dice cucumber and tomatoes',
          'Assemble bowl with quinoa, chicken, vegetables, and feta',
          'Drizzle with olive oil and lemon juice'
        ],
        ingredients: [
          { name: 'chicken breast', amount: 1, unit: 'lb' },
          { name: 'quinoa', amount: 1, unit: 'cup' },
          { name: 'cucumber', amount: 1, unit: 'medium' },
          { name: 'feta cheese', amount: 0.5, unit: 'cup' },
          { name: 'olive oil', amount: 2, unit: 'tablespoons' }
        ],
        nutrition: { calories: 450, protein: 35, carbs: 25, fat: 22, fiber: 8, sugar: 5, sodium: 600 },
        difficulty: 'easy',
        healthScore: 85,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isDairyFree: false,
        diets: ['gluten-free'],
        cuisines: ['Mediterranean'],
        dishTypes: ['main course'],
        source: 'fallback'
      },
      {
        id: 'fallback_2',
        title: 'Vegetarian Stir Fry',
        image: 'https://images.unsplash.com/photo-1540420773420-69d1aebd4b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 15,
        servings: 4,
        sourceUrl: 'https://example.com/vegetarian-stir-fry',
        summary: 'Quick and nutritious vegetarian stir fry with tofu and fresh vegetables in a savory sauce.',
        instructions: [
          'Heat oil in a large wok or skillet over high heat',
          'Add cubed tofu and cook until golden brown',
          'Add mixed vegetables and stir-fry for 3-4 minutes',
          'Mix soy sauce, ginger, and garlic in a small bowl',
          'Add sauce to the pan and toss everything together',
          'Serve immediately over rice or noodles'
        ],
        ingredients: [
          { name: 'firm tofu', amount: 14, unit: 'oz' },
          { name: 'mixed vegetables', amount: 4, unit: 'cups' },
          { name: 'soy sauce', amount: 3, unit: 'tablespoons' },
          { name: 'fresh ginger', amount: 1, unit: 'tablespoon' },
          { name: 'garlic', amount: 3, unit: 'cloves' }
        ],
        nutrition: { calories: 320, protein: 18, carbs: 25, fat: 14, fiber: 8, sugar: 8, sodium: 900 },
        difficulty: 'easy',
        healthScore: 78,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: false,
        isDairyFree: true,
        diets: ['vegetarian', 'vegan'],
        cuisines: ['Asian'],
        dishTypes: ['main course'],
        source: 'fallback'
      },
      {
        id: 'fallback_3',
        title: 'Salmon with Lemon Herbs',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 20,
        servings: 4,
        sourceUrl: 'https://example.com/salmon-lemon-herbs',
        summary: 'Perfectly baked salmon fillet with fresh herbs and lemon, served with roasted vegetables.',
        instructions: [
          'Preheat oven to 400°F (200°C)',
          'Place salmon fillets on a baking sheet',
          'Drizzle with olive oil and season with salt and pepper',
          'Top with fresh herbs and lemon slices',
          'Bake for 12-15 minutes until fish flakes easily',
          'Serve with your favorite vegetables'
        ],
        ingredients: [
          { name: 'salmon fillets', amount: 1.5, unit: 'lbs' },
          { name: 'lemon', amount: 1, unit: 'large' },
          { name: 'fresh dill', amount: 2, unit: 'tablespoons' },
          { name: 'fresh parsley', amount: 2, unit: 'tablespoons' },
          { name: 'olive oil', amount: 2, unit: 'tablespoons' }
        ],
        nutrition: { calories: 380, protein: 35, carbs: 2, fat: 25, fiber: 0, sugar: 1, sodium: 300 },
        difficulty: 'easy',
        healthScore: 92,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isDairyFree: true,
        diets: ['gluten-free', 'dairy-free', 'pescatarian'],
        cuisines: ['American'],
        dishTypes: ['main course'],
        source: 'fallback'
      },
      {
        id: 'fallback_4',
        title: 'Veggie Pasta Primavera',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 30,
        servings: 4,
        sourceUrl: 'https://example.com/pasta-primavera',
        summary: 'Light and fresh pasta dish loaded with seasonal vegetables and herbs.',
        instructions: [
          'Cook pasta according to package directions',
          'Heat olive oil in a large skillet',
          'Sauté vegetables until tender-crisp',
          'Add garlic and herbs, cook for 1 minute',
          'Toss with cooked pasta and parmesan cheese',
          'Season with salt, pepper, and lemon juice'
        ],
        ingredients: [
          { name: 'pasta', amount: 12, unit: 'oz' },
          { name: 'mixed vegetables', amount: 4, unit: 'cups' },
          { name: 'parmesan cheese', amount: 0.5, unit: 'cup' },
          { name: 'garlic', amount: 3, unit: 'cloves' },
          { name: 'fresh basil', amount: 0.25, unit: 'cup' }
        ],
        nutrition: { calories: 420, protein: 15, carbs: 65, fat: 12, fiber: 6, sugar: 8, sodium: 400 },
        difficulty: 'easy',
        healthScore: 70,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isDairyFree: false,
        diets: ['vegetarian'],
        cuisines: ['Italian'],
        dishTypes: ['main course'],
        source: 'fallback'
      }
    ];

    console.log(`Using fallback recipes for query: "${query}"`);

    // Enhanced filtering for fallback data
    return fallbackRecipes.filter(recipe => {
      if (query && !recipe.title.toLowerCase().includes(query.toLowerCase())) {
        // Also check ingredients and cuisine for matches
        const queryLower = query.toLowerCase();
        const matchesIngredients = recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(queryLower)
        );
        const matchesCuisine = recipe.cuisines.some(cuisine => 
          cuisine.toLowerCase().includes(queryLower)
        );
        const matchesDishType = recipe.dishTypes.some(type => 
          type.toLowerCase().includes(queryLower)
        );
        
        if (!matchesIngredients && !matchesCuisine && !matchesDishType) {
          return false;
        }
      }
      
      if (filters.maxCalories && recipe.nutrition.calories > parseInt(filters.maxCalories)) {
        return false;
      }
      
      if (filters.diet === 'vegetarian' && !recipe.isVegetarian) {
        return false;
      }
      
      if (filters.diet === 'vegan' && !recipe.isVegan) {
        return false;
      }
      
      if (filters.maxReadyTime && recipe.readyInMinutes > parseInt(filters.maxReadyTime)) {
        return false;
      }
      
      return true;
    });
  }

  getFallbackRecipesByIngredients(ingredients) {
    // Return simple matches based on ingredient names
    return this.getFallbackRecipes().filter(recipe => 
      ingredients.some(ingredient => 
        recipe.ingredients.some(recipeIngredient =>
          recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
        )
      )
    );
  }
}

export const recipeService = new RecipeService();
