import { supabase } from '../supabaseConfig';

class USRecipeService {
  constructor() {
    // Edamam Recipe API for US-focused recipes
    this.edamamAppId = process.env.EXPO_PUBLIC_EDAMAM_APP_ID;
    this.edamamAppKey = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY;
    this.edamamBaseUrl = 'https://api.edamam.com/api/recipes/v2';
    
    // USDA API for nutrition data
    this.usdaApiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;
    this.usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';
    
    console.log('US Recipe Service initialized with Edamam and USDA APIs');
    console.log('Edamam App ID:', this.edamamAppId ? 'LOADED' : 'NOT LOADED');
    console.log('Edamam App Key:', this.edamamAppKey ? 'LOADED' : 'NOT LOADED');
  }

  // Search for US-focused recipes using Edamam API
  async searchRecipes(query, filters = {}) {
    try {
      if (!this.edamamAppId || !this.edamamAppKey) {
        console.log('Edamam API credentials not loaded, using demo recipes. Please restart Expo after adding env variables.');
        return this.getDemoUSRecipes(query);
      }

      console.log('Searching US recipes for:', query, 'with filters:', filters);

      // Build search parameters - simplified to avoid validation errors
      const params = new URLSearchParams({
        type: 'public',
        q: query,
        app_id: this.edamamAppId,
        app_key: this.edamamAppKey
      });

      // Add diet filters
      if (filters.diet && filters.diet !== 'all') {
        const dietMap = {
          'vegetarian': 'vegetarian',
          'vegan': 'vegan',
          'ketogenic': 'keto-friendly',
          'gluten-free': 'gluten-free',
          'dairy-free': 'dairy-free'
        };
        if (dietMap[filters.diet]) {
          params.append('health', dietMap[filters.diet]);
        }
      }

      // Add calorie limits
      if (filters.maxCalories) {
        params.append('calories', `0-${filters.maxCalories}`);
      }

      // Add cooking time limits  
      if (filters.maxReadyTime) {
        params.append('time', `1-${filters.maxReadyTime}`);
      }

      // Add cuisine type filter
      if (filters.cuisine && filters.cuisine !== 'all') {
        const cuisineMap = {
          'american': 'American',
          'italian': 'Italian',
          'mexican': 'Mexican',
          'asian': 'Asian',
          'mediterranean': 'Mediterranean',
          'french': 'French',
          'indian': 'Indian'
        };
        if (cuisineMap[filters.cuisine]) {
          params.append('cuisineType', cuisineMap[filters.cuisine]);
        }
      } else {
        // Default to American if no specific cuisine selected
        params.append('cuisineType', 'American');
      }

      const url = `${this.edamamBaseUrl}?${params.toString()}`;
      console.log('Edamam API URL:', url.substring(0, 100) + '...');

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edamam API error:', response.status, errorText);
        throw new Error(`Edamam API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Edamam raw response:', data.hits?.length, 'recipes found');

      if (!data.hits || data.hits.length === 0) {
        return [];
      }

      // Format recipes for consistent use
      const formattedRecipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
      
      // Filter recipes based on cuisine preference
      let filteredRecipes;
      if (filters.cuisine === 'american' || !filters.cuisine || filters.cuisine === 'all') {
        // Filter for clearly American/familiar recipes
        filteredRecipes = formattedRecipes.filter(recipe => 
          this.isAmericanStyleRecipe(recipe)
        );
      } else {
        // For other cuisines, use all returned recipes (Edamam filtering should be sufficient)
        filteredRecipes = formattedRecipes;
      }

      console.log(`Filtered ${filters.cuisine || 'American'} recipes:`, filteredRecipes.length);
      return filteredRecipes.slice(0, 20); // Limit to 20 results

    } catch (error) {
      console.error('Error searching US recipes:', error);
      return this.getDemoUSRecipes(query);
    }
  }

  // Format Edamam recipe to our standard format
  formatEdamamRecipe(recipe) {
    // Extract nutrition info
    const nutrition = recipe.totalNutrients || {};
    const calories = Math.round(nutrition.ENERC_KCAL?.quantity || 0);
    const protein = Math.round(nutrition.PROCNT?.quantity || 0);
    const carbs = Math.round(nutrition.CHOCDF?.quantity || 0);
    const fat = Math.round(nutrition.FAT?.quantity || 0);
    const fiber = Math.round(nutrition.FIBTG?.quantity || 0);
    const sodium = Math.round(nutrition.NA?.quantity || 0);

    return {
      id: this.extractRecipeId(recipe.uri),
      title: recipe.label,
      image: recipe.image,
      source: recipe.source,
      sourceUrl: recipe.url,
      servings: recipe.yield || 4,
      totalTime: recipe.totalTime || 30,
      readyInMinutes: recipe.totalTime || 30,
      calories: Math.round(calories / (recipe.yield || 4)), // Per serving
      ingredients: recipe.ingredientLines || [],
      instructions: this.generateBasicInstructions(recipe),
      nutrition: {
        calories: Math.round(calories / (recipe.yield || 4)),
        protein: Math.round(protein / (recipe.yield || 4)),
        carbs: Math.round(carbs / (recipe.yield || 4)),
        fat: Math.round(fat / (recipe.yield || 4)),
        fiber: Math.round(fiber / (recipe.yield || 4)),
        sodium: Math.round(sodium / (recipe.yield || 4))
      },
      dietLabels: recipe.dietLabels || [],
      healthLabels: recipe.healthLabels || [],
      cuisineType: recipe.cuisineType || ['American'],
      mealType: recipe.mealType || ['Dinner'],
      dishType: recipe.dishType || ['Main course'],
      isVegetarian: recipe.healthLabels?.includes('Vegetarian') || false,
      isVegan: recipe.healthLabels?.includes('Vegan') || false,
      isGlutenFree: recipe.healthLabels?.includes('Gluten-Free') || false,
      isDairyFree: recipe.healthLabels?.includes('Dairy-Free') || false,
      difficulty: this.calculateDifficulty(recipe),
      source: 'edamam',
      isUSFocused: true
    };
  }

  // Check if recipe is American-style
  isAmericanStyleRecipe(recipe) {
    const title = recipe.title.toLowerCase();
    const ingredients = recipe.ingredients.join(' ').toLowerCase();
    
    // American food keywords
    const americanKeywords = [
      'burger', 'sandwich', 'bbq', 'barbecue', 'grilled', 'fried', 'baked',
      'roasted', 'meatloaf', 'chicken', 'beef', 'pork', 'turkey', 'salmon',
      'tuna', 'pasta', 'pizza', 'mac and cheese', 'meatball', 'steak',
      'chili', 'soup', 'salad', 'casserole', 'pie', 'cake', 'cookie',
      'brownie', 'muffin', 'pancake', 'waffle', 'omelet', 'scrambled',
      'breakfast', 'brunch', 'lunch', 'dinner', 'appetizer', 'snack'
    ];

    // Check for American-style ingredients
    const americanIngredients = [
      'ground beef', 'ground turkey', 'chicken breast', 'bacon', 'cheese',
      'cheddar', 'mozzarella', 'ranch', 'ketchup', 'mustard', 'mayo',
      'bread', 'flour', 'sugar', 'butter', 'milk', 'eggs', 'onion',
      'garlic', 'tomato', 'lettuce', 'potato', 'corn', 'green beans'
    ];

    const hasAmericanKeywords = americanKeywords.some(keyword => 
      title.includes(keyword) || ingredients.includes(keyword)
    );

    const hasAmericanIngredients = americanIngredients.some(ingredient =>
      ingredients.includes(ingredient)
    );

    // Exclude clearly non-American cuisines
    const nonAmericanKeywords = [
      'curry', 'naan', 'tandoori', 'masala', 'tikka', 'dal', 'biryani',
      'sushi', 'tempura', 'miso', 'ramen', 'udon', 'teriyaki',
      'paella', 'tapas', 'gazpacho', 'chorizo', 'serrano',
      'couscous', 'tagine', 'harissa', 'za\'atar',
      'dim sum', 'wonton', 'dumpling', 'congee', 'bok choy'
    ];

    const hasNonAmericanKeywords = nonAmericanKeywords.some(keyword =>
      title.includes(keyword) || ingredients.includes(keyword)
    );

    return (hasAmericanKeywords || hasAmericanIngredients) && !hasNonAmericanKeywords;
  }

  // Generate basic cooking instructions since Edamam doesn't provide them
  generateBasicInstructions(recipe) {
    const ingredients = recipe.ingredientLines || [];
    const cookingMethods = this.detectCookingMethods(recipe.label, ingredients);
    
    const instructions = [
      'Gather and prepare all ingredients as listed.',
      'Preheat oven to 375°F if baking, or heat pan over medium heat if cooking on stovetop.',
    ];

    if (cookingMethods.includes('sauté') || cookingMethods.includes('fry')) {
      instructions.push('Heat oil in a large skillet over medium-high heat.');
    }

    if (cookingMethods.includes('bake')) {
      instructions.push('Arrange ingredients in baking dish and bake according to recipe timing.');
    } else if (cookingMethods.includes('grill')) {
      instructions.push('Preheat grill and cook ingredients over medium heat, turning as needed.');
    } else {
      instructions.push('Cook ingredients according to package directions or until done.');
    }

    instructions.push('Season with salt and pepper to taste.');
    instructions.push('Serve hot and enjoy!');
    instructions.push('For complete detailed instructions, visit the original recipe source.');

    return instructions;
  }

  // Detect cooking methods from recipe name and ingredients
  detectCookingMethods(title, ingredients) {
    const text = (title + ' ' + ingredients.join(' ')).toLowerCase();
    const methods = [];

    if (text.includes('baked') || text.includes('baking') || text.includes('oven')) {
      methods.push('bake');
    }
    if (text.includes('grilled') || text.includes('grill') || text.includes('bbq')) {
      methods.push('grill');
    }
    if (text.includes('fried') || text.includes('sauté') || text.includes('pan')) {
      methods.push('sauté');
    }
    if (text.includes('roasted') || text.includes('roast')) {
      methods.push('roast');
    }

    return methods.length > 0 ? methods : ['cook'];
  }

  // Calculate recipe difficulty
  calculateDifficulty(recipe) {
    const ingredients = recipe.ingredientLines?.length || 0;
    const time = recipe.totalTime || 30;

    if (ingredients <= 5 && time <= 20) return 'Easy';
    if (ingredients <= 10 && time <= 45) return 'Medium';
    return 'Hard';
  }

  // Extract recipe ID from Edamam URI
  extractRecipeId(uri) {
    if (!uri) return `edamam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract the recipe ID from URI like "http://www.edamam.com/ontologies/edamam.owl#recipe_b79327d05b8e5b838ad6cfd9576b30b6"
    const parts = uri.split('#recipe_');
    return parts.length > 1 ? `edamam_${parts[1]}` : `edamam_${Date.now()}`;
  }

  // Demo US recipes for testing (when Edamam API not configured)
  getDemoUSRecipes(query) {
    const demoRecipes = [
      {
        id: 'demo_classic_burger',
        title: 'Classic American Cheeseburger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        source: 'Demo Recipe',
        sourceUrl: '#',
        servings: 4,
        totalTime: 20,
        readyInMinutes: 20,
        calories: 450,
        ingredients: [
          '1 lb ground beef (80/20)',
          '4 hamburger buns',
          '4 slices American cheese',
          'Lettuce leaves',
          '1 tomato, sliced',
          '1 onion, sliced',
          'Pickles',
          'Ketchup and mustard'
        ],
        instructions: [
          'Form ground beef into 4 patties',
          'Season patties with salt and pepper',
          'Heat grill or skillet over medium-high heat',
          'Cook patties 3-4 minutes per side',
          'Add cheese in last minute of cooking',
          'Toast buns lightly',
          'Assemble burgers with desired toppings',
          'Serve immediately'
        ],
        nutrition: {
          calories: 450,
          protein: 28,
          carbs: 35,
          fat: 22,
          fiber: 2,
          sodium: 890
        },
        isUSFocused: true,
        source: 'demo'
      },
      {
        id: 'demo_bbq_chicken',
        title: 'BBQ Grilled Chicken Breast',
        image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
        source: 'Demo Recipe',
        sourceUrl: '#',
        servings: 4,
        totalTime: 25,
        readyInMinutes: 25,
        calories: 320,
        ingredients: [
          '4 boneless chicken breasts',
          '1/2 cup BBQ sauce',
          '2 tbsp olive oil',
          '1 tsp garlic powder',
          '1 tsp paprika',
          'Salt and pepper to taste'
        ],
        instructions: [
          'Preheat grill to medium heat',
          'Season chicken with garlic powder, paprika, salt and pepper',
          'Brush chicken with olive oil',
          'Grill chicken 6-7 minutes per side',
          'Brush with BBQ sauce in last 2 minutes',
          'Cook until internal temperature reaches 165°F',
          'Let rest 5 minutes before serving'
        ],
        nutrition: {
          calories: 320,
          protein: 35,
          carbs: 8,
          fat: 14,
          fiber: 0,
          sodium: 520
        },
        isUSFocused: true,
        source: 'demo'
      }
    ];

    // Filter demo recipes based on query
    const query_lower = query.toLowerCase();
    return demoRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query_lower) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(query_lower))
    );
  }

  // Get recipe details (Edamam provides most details in initial call)
  async getRecipeDetails(recipeId) {
    try {
      // For Edamam, we typically have most details from the initial search
      // But we can fetch additional details if needed
      console.log('Getting recipe details for:', recipeId);
      
      // Return null to use the existing recipe data
      return null;
    } catch (error) {
      console.error('Error getting recipe details:', error);
      return null;
    }
  }

  // Search recipes by ingredients (using Edamam ingredient search)
  async getRecipesByIngredients(ingredients) {
    try {
      // Convert ingredients array to search query
      const query = ingredients.join(' ');
      
      // Use regular search but focus on ingredient matching
      const results = await this.searchRecipes(query, { 
        mealType: 'Dinner',
        cuisineType: 'American' 
      });
      
      return results;
    } catch (error) {
      console.error('Error finding recipes by ingredients:', error);
      return [];
    }
  }

  // === Database methods (same as original) ===
  
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
      return [];
    }
  }

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
      return [];
    }
  }

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
      return data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId, recipeId) {
    try {
      const { error } = await supabase
        .from('user_favorite_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async addToHistory(userId, recipe) {
    try {
      const { data, error } = await supabase
        .from('user_recipe_history')
        .insert({
          user_id: userId,
          recipe_id: recipe.id,
          recipe_data: recipe,
          viewed_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding to history:', error);
      // Don't throw here as history is not critical
    }
  }

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
      return [];
    }
  }

  async saveUserIngredients(userId, ingredients) {
    try {
      const { data, error } = await supabase
        .from('user_ingredients')
        .upsert({
          user_id: userId,
          ingredients: ingredients,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving user ingredients:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const usRecipeService = new USRecipeService();
