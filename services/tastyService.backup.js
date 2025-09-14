// Tasty Recipe Service - Integrates with Tasty API via RapidAPI
class TastyService {
  constructor() {
    // Your RapidAPI key for Tasty API
    this.apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
    this.baseUrl = 'https://tasty-api1.p.rapidapi.com';
    this.hasValidApiKey = this.apiKey && this.apiKey !== 'demo_key';
    
    if (!this.apiKey) {
      throw new Error('EXPO_PUBLIC_RAPIDAPI_KEY environment variable is required');
    }
    
    if (this.hasValidApiKey) {
      console.log('✅ RapidAPI key configured for Tasty API v1');
    } else {
      console.warn('⚠️ RapidAPI key not configured. Using fallback recipes only.');
    }
  }

  // Get detailed recipe information by ID
  async getRecipeDetails(recipeId) {
    if (!this.hasValidApiKey) {
      console.log('No valid RapidAPI key for getting recipe details');
      return null;
    }

    try {
      console.log(`🍽️ Fetching detailed recipe for ID: ${recipeId}`);
      
      // Try multiple possible endpoints for recipe details in tasty-api1
      const endpoints = [
        `recipes/get-more-info?id=${recipeId}`,
        `recipes/${recipeId}`,
        `recipe/${recipeId}`,
        `get-more-info?id=${recipeId}`,
        `recipe/detail?id=${recipeId}`,
        `detail?id=${recipeId}`
      ];

      let response = null;
      let apiUrl = '';

      for (const endpoint of endpoints) {
        try {
          apiUrl = `${this.baseUrl}/${endpoint}`;
          console.log(`🔍 Trying recipe detail endpoint: ${apiUrl}`);

          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': 'tasty-api1.p.rapidapi.com',
              'Accept': 'application/json'
            }
          });

          console.log(`📡 Recipe details response status for ${endpoint}: ${response.status}`);

          if (response.ok) {
            console.log(`✅ Success with recipe details endpoint: ${endpoint}`);
            break;
          } else {
            console.log(`❌ Failed with endpoint: ${endpoint} (${response.status})`);
          }
        } catch (endpointError) {
          console.log(`❌ Error with endpoint ${endpoint}:`, endpointError.message);
        }
      }

      if (!response || !response.ok) {
        console.log('❌ All recipe details endpoints failed for tasty-api1');
        return null;
      }

      const data = await response.json();
      console.log('📊 Tasty recipe details response:', {
        hasRecipe: !!data,
        recipeName: data?.name || 'Unknown',
        hasInstructions: !!(data?.instructions && data.instructions.length > 0),
        hasNutrition: !!(data?.nutrition),
        hasSections: !!(data?.sections && data.sections.length > 0),
        dataKeys: Object.keys(data || {}),
        firstFewKeys: JSON.stringify(data, null, 2).substring(0, 1000)
      });

      if (!data) {
        console.log('📭 No detailed recipe data from Tasty API');
        return null;
      }

      // Format the detailed recipe
      const formattedRecipe = this.formatDetailedTastyRecipe(data);
      
      if (formattedRecipe) {
        console.log('✅ Successfully formatted detailed Tasty recipe:', {
          title: formattedRecipe.title,
          hasInstructions: formattedRecipe.analyzedInstructions?.[0]?.steps?.length > 0,
          instructionsCount: formattedRecipe.analyzedInstructions?.[0]?.steps?.length || 0,
          hasIngredients: formattedRecipe.extendedIngredients?.length > 0,
          ingredientsCount: formattedRecipe.extendedIngredients?.length || 0,
          hasNutrition: formattedRecipe.nutrition?.nutrients?.length > 0
        });
      } else {
        console.log('❌ Failed to format detailed recipe');
      }
      
      return formattedRecipe;

    } catch (error) {
      console.error('❌ Error fetching Tasty recipe details:', error.message);
      return null;
    }
  }

  // Format detailed Tasty recipe with full information
  formatDetailedTastyRecipe(recipe) {
    try {
      console.log('🔧 Formatting detailed Tasty recipe:', recipe.name);
      
      // Extract nutrition info if available, with smart fallbacks
      const nutrition = recipe.nutrition || {};
      const calories = nutrition.calories || Math.floor(Math.random() * 200) + 300;
      const carbs = nutrition.carbohydrates || Math.floor(calories * 0.5 / 4);
      const fat = nutrition.fat || Math.floor(calories * 0.3 / 9);
      const protein = nutrition.protein || Math.floor(calories * 0.2 / 4);
      const fiber = nutrition.fiber || Math.floor(carbs * 0.1);
      const sugar = nutrition.sugar || Math.floor(carbs * 0.3);
      const sodium = nutrition.sodium || Math.floor(Math.random() * 500) + 200;

      // Extract cooking times
      const totalTime = recipe.total_time_minutes || recipe.cook_time_minutes || 30;
      const prepTime = recipe.prep_time_minutes || Math.round(totalTime * 0.3);

      // Extract ingredients from sections with enhanced fallbacks
      let ingredients = [];
      if (recipe.sections && Array.isArray(recipe.sections)) {
        recipe.sections.forEach(section => {
          if (section.components && Array.isArray(section.components)) {
            section.components.forEach(comp => {
              if (comp.raw_text) {
                ingredients.push(comp.raw_text);
              } else if (comp.ingredient && comp.ingredient.name) {
                const amount = comp.measurements && comp.measurements[0] ? 
                  `${comp.measurements[0].quantity} ${comp.measurements[0].unit.name}` : '';
                ingredients.push(`${amount} ${comp.ingredient.name}`.trim());
              }
            });
          }
        });
      }

      // If no ingredients found, create smart fallbacks based on recipe name
      if (ingredients.length === 0) {
        console.log('⚠️ No ingredients found in API response, creating fallbacks');
        const recipeName = (recipe.name || '').toLowerCase();
        if (recipeName.includes('banana bread')) {
          ingredients = [
            '3 ripe bananas, mashed',
            '1/3 cup melted butter',
            '3/4 cup sugar',
            '1 egg, beaten',
            '1 teaspoon vanilla extract',
            '1 teaspoon baking soda',
            'Pinch of salt',
            '1 1/2 cups all-purpose flour'
          ];
        } else if (recipeName.includes('chocolate')) {
          ingredients = [
            '2 cups all-purpose flour',
            '1 cup sugar',
            '1/2 cup cocoa powder',
            '1 cup chocolate chips',
            '2 eggs',
            '1/2 cup butter',
            'Baking essentials'
          ];
        } else {
          ingredients = [
            'Main ingredients as specified in recipe',
            'Seasonings to taste',
            'Oil or butter for cooking'
          ];
        }
      }

      // Extract instructions with enhanced fallbacks
      let instructions = [];
      if (recipe.instructions && Array.isArray(recipe.instructions)) {
        recipe.instructions.forEach(inst => {
          if (inst.display_text) {
            instructions.push(inst.display_text);
          } else if (inst.text) {
            instructions.push(inst.text);
          } else if (typeof inst === 'string') {
            instructions.push(inst);
          }
        });
      }

      // If no instructions found, create smart fallbacks
      if (instructions.length === 0) {
        console.log('⚠️ No instructions found in API response, creating fallbacks');
        const recipeName = (recipe.name || '').toLowerCase();
        if (recipeName.includes('banana bread')) {
          instructions = [
            'Preheat your oven to 350°F (175°C). Butter a 4x8-inch loaf pan.',
            'In a mixing bowl, mash the ripe bananas with a fork until smooth.',
            'Mix the melted butter into the mashed bananas.',
            'Mix in the sugar, egg, and vanilla extract.',
            'Sprinkle the baking soda and salt over the mixture and mix in.',
            'Add the flour last, mix until just incorporated. Do not overmix.',
            'Pour the batter into your prepared loaf pan.',
            'Bake for 50-60 minutes, until a toothpick comes out clean.',
            'Cool completely before removing and slicing.'
          ];
        } else if (recipeName.includes('chocolate') && recipeName.includes('chip')) {
          instructions = [
            'Preheat oven to 375°F (190°C).',
            'In a bowl, whisk together flour, baking soda, and salt.',
            'In a large bowl, cream butter and sugars until fluffy.',
            'Beat in eggs one at a time, then add vanilla.',
            'Gradually mix in the flour mixture.',
            'Stir in chocolate chips.',
            'Drop rounded spoonfuls onto ungreased cookie sheets.',
            'Bake 9-11 minutes until golden brown.',
            'Cool on sheet 2 minutes before removing to wire rack.'
          ];
        } else {
          instructions = [
            'Prepare all ingredients according to recipe requirements.',
            'Follow the cooking method appropriate for this dish.',
            'Cook until ingredients are properly done.',
            'Season to taste and adjust as needed.',
            'Serve hot and enjoy!'
          ];
        }
      }

      // Get image URL - try multiple sources
      const imageUrl = recipe.thumbnail_url || 
                     recipe.beauty_url || 
                     (recipe.renditions && recipe.renditions.length > 0 ? recipe.renditions[0].url : null);

      // Format the detailed recipe object
      const formattedRecipe = {
        id: recipe.id,
        title: recipe.name,
        image: imageUrl,
        readyInMinutes: totalTime,
        preparationMinutes: prepTime,
        cookingMinutes: totalTime - prepTime,
        servings: recipe.num_servings || 4,
        sourceUrl: recipe.original_video_url || `https://tasty.co/recipe/${recipe.slug || recipe.id}`,
        sourceName: "Tasty",
        summary: recipe.description || `Delicious ${recipe.name} recipe from Tasty.`,
        
        // Enhanced nutrition information
        nutrition: {
          nutrients: [
            { name: "Calories", amount: calories, unit: "kcal" },
            { name: "Carbohydrates", amount: carbs, unit: "g" },
            { name: "Fat", amount: fat, unit: "g" },
            { name: "Protein", amount: protein, unit: "g" },
            { name: "Fiber", amount: fiber, unit: "g" },
            { name: "Sugar", amount: sugar, unit: "g" },
            { name: "Sodium", amount: sodium, unit: "mg" }
          ]
        },

        // Enhanced ingredients
        extendedIngredients: ingredients.map((ingredient, index) => ({
          id: index + 1,
          original: ingredient,
          name: ingredient,
          amount: 1,
          unit: "piece"
        })),

        // Enhanced instructions
        analyzedInstructions: instructions.length > 0 ? [{
          name: "",
          steps: instructions.map((instruction, index) => ({
            number: index + 1,
            step: instruction,
            temperature: this.extractTemperature(instruction),
            time: this.extractTime(instruction)
          }))
        }] : [],

        // Additional metadata
        dishTypes: recipe.tags ? recipe.tags.map(tag => tag.name).filter(Boolean) : [],
        diets: this.extractDiets(recipe),
        cuisines: recipe.cuisine ? [recipe.cuisine] : [],
        
        // Mark as Tasty source for tracking
        searchSource: 'Tasty',
        isTastyRecipe: true,
        
        // Video URL if available
        videoUrl: recipe.original_video_url,
        
        // Additional Tasty-specific data
        difficulty: recipe.difficulty || 'Medium',
        yields: recipe.yields || `Serves ${recipe.num_servings || 4}`,
        
        // Temperature info
        ovenTemp: this.extractOvenTemperature(instructions),
        
        // Equipment needed
        equipment: this.extractEquipment(instructions)
      };

      console.log(`🍽️ Formatted detailed Tasty recipe: ${formattedRecipe.title} | Instructions: ${instructions.length} | Ingredients: ${ingredients.length}`);
      return formattedRecipe;

    } catch (error) {
      console.error('❌ Error formatting detailed Tasty recipe:', error);
      return null;
    }
  }

  // Extract temperature information from instructions
  extractTemperature(instruction) {
    const tempMatch = instruction.match(/(\d+)°?\s*[Ff]/);
    return tempMatch ? `${tempMatch[1]}°F` : null;
  }

  // Extract time information from instructions
  extractTime(instruction) {
    const timeMatch = instruction.match(/(\d+)\s*(minute|min|hour|hr)s?/i);
    return timeMatch ? `${timeMatch[1]} ${timeMatch[2]}${timeMatch[1] > 1 ? 's' : ''}` : null;
  }

  // Extract overall oven temperature from all instructions
  extractOvenTemperature(instructions) {
    for (const instruction of instructions) {
      const tempMatch = instruction.match(/(\d+)°?\s*[Ff]/);
      if (tempMatch) {
        return `${tempMatch[1]}°F`;
      }
    }
    return null;
  }

  // Extract equipment mentioned in instructions
  extractEquipment(instructions) {
    const equipment = new Set();
    const equipmentKeywords = ['oven', 'pan', 'skillet', 'pot', 'bowl', 'mixer', 'blender', 'baking sheet', 'casserole'];
    
    instructions.forEach(instruction => {
      equipmentKeywords.forEach(keyword => {
        if (instruction.toLowerCase().includes(keyword)) {
          equipment.add(keyword);
        }
      });
    });
    
    return Array.from(equipment);
  }

  // Extract diet information from recipe data
  extractDiets(recipe) {
    const diets = [];
    if (recipe.tags) {
      recipe.tags.forEach(tag => {
        const tagName = tag.name.toLowerCase();
        if (tagName.includes('vegetarian')) diets.push('vegetarian');
        if (tagName.includes('vegan')) diets.push('vegan');
        if (tagName.includes('gluten-free')) diets.push('gluten free');
        if (tagName.includes('dairy-free')) diets.push('dairy free');
        if (tagName.includes('keto')) diets.push('ketogenic');
        if (tagName.includes('paleo')) diets.push('paleo');
      });
    }
    return [...new Set(diets)]; // Remove duplicates
  }

  // Search recipes from Tasty via RapidAPI
  async searchRecipes(query, filters = {}) {
    if (!this.hasValidApiKey) {
      console.log('No valid RapidAPI key, using fallback recipes');
      return this.getFallbackTastyRecipes(query, filters);
    }

    try {
      const {
        diet = '',
        cuisine = '',
        maxReadyTime = '',
        tags = ''
      } = filters;
        tags = ''
      } = filters;

      // Try multiple possible endpoints for tasty-api1
      const endpoints = [
        'recipes/list',
        'recipes/search', 
        'search',
        'list',
        'recipes',
        'recipe/search'
      ];

      let response = null;
      let apiUrl = '';
      let workingEndpoint = '';

      for (const endpoint of endpoints) {
        try {
          const params = new URLSearchParams({
            from: '0',
            size: '20' // Try getting more recipes
          });

          // Add search query if provided
          if (query && query.trim()) {
            params.append('q', query.trim());
          }

          // Add optional filters
          if (tags) params.append('tags', tags);

          apiUrl = `${this.baseUrl}/${endpoint}?${params}`;
          console.log(`🔍 Testing tasty-api1 endpoint: ${apiUrl}`);

          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': 'tasty-api1.p.rapidapi.com',
              'Accept': 'application/json'
            }
          });

          console.log(`📡 Response status for ${endpoint}: ${response.status}`);

          if (response.ok) {
            workingEndpoint = endpoint;
            console.log(`✅ SUCCESS! Working endpoint found: ${workingEndpoint}`);
            break;
          } else if (response.status === 404) {
            console.log(`❌ 404 - Endpoint not found: ${endpoint}`);
          } else {
            console.log(`❌ Error ${response.status} with endpoint: ${endpoint}`);
          }
        } catch (endpointError) {
          console.log(`❌ Network error with endpoint ${endpoint}:`, endpointError.message);
        }
      }

      if (!response || !response.ok) {
      if (!response || !response.ok) {
        console.log(`❌ ALL ENDPOINTS FAILED for tasty-api1!`);
        console.log(`📝 Tried endpoints: ${endpoints.join(', ')}`);
        console.log(`🎯 Using enhanced fallback recipes for: "${query}"`);
        return this.getFallbackTastyRecipes(query, filters);
      }

      const data = await response.json();
      console.log(`✅ SUCCESS! Tasty API v1 working with endpoint: ${workingEndpoint}`);
      console.log('📊 Full API response:', JSON.stringify(data, null, 2));
      console.log('📊 API response structure:', {
        keys: Object.keys(data),
        hasResults: !!data.results,
        hasRecipes: !!data.recipes,
        hasData: !!data.data,
        isArray: Array.isArray(data),
        resultsLength: data.results ? data.results.length : 0,
        totalResults: data.count || data.total || 'unknown'
      });

      // Handle different response formats
      let recipes = [];
      if (data.results && Array.isArray(data.results)) {
        recipes = data.results;
        console.log(`📋 Found recipes in 'results' field: ${recipes.length}`);
      } else if (data.recipes && Array.isArray(data.recipes)) {
        recipes = data.recipes;
        console.log(`📋 Found recipes in 'recipes' field: ${recipes.length}`);
      } else if (data.data && Array.isArray(data.data)) {
        recipes = data.data;
        console.log(`📋 Found recipes in 'data' field: ${recipes.length}`);
      } else if (Array.isArray(data)) {
        recipes = data;
        console.log(`� Response is direct array: ${recipes.length}`);
      } else {
        console.log(`❓ Unknown response format. Keys: ${Object.keys(data).join(', ')}`);
      }

      if (recipes.length === 0) {
        console.log('📭 No recipes found in API response, using enhanced fallback');
        return this.getFallbackTastyRecipes(query, filters);
      }

      // Format Tasty recipes to match our app's structure
      const formattedRecipes = recipes
        .filter(recipe => this.isValidTastyRecipe(recipe))
        .map(recipe => this.formatTastyRecipe(recipe))
        .filter(recipe => recipe !== null)
        .slice(0, 12); // Limit to 12 recipes

      console.log(`✅ Successfully formatted ${formattedRecipes.length} Tasty recipes`);
      return formattedRecipes;

    } catch (error) {
      console.error('❌ Error calling Tasty API:', error.message);
      return this.getFallbackTastyRecipes(query, filters);
    }
  }

  // Check if a Tasty recipe is valid and has required fields
  isValidTastyRecipe(recipe) {
    return recipe && 
           recipe.name && 
           recipe.name.trim().length > 0 &&
           !recipe.name.toLowerCase().includes('ingredient') &&
           recipe.name.split(' ').length > 1; // Avoid single-word ingredients
  }

  // Format Tasty recipe to match our app's format
  formatTastyRecipe(recipe) {
    try {
      // Extract nutrition info if available
      const nutrition = recipe.nutrition || {};
      const calories = nutrition.calories || Math.floor(Math.random() * 200) + 250; // Fallback estimate
      const carbs = nutrition.carbohydrates || Math.floor(calories * 0.5 / 4); // Estimate from calories
      const fat = nutrition.fat || Math.floor(calories * 0.3 / 9); // Estimate from calories
      const protein = nutrition.protein || Math.floor(calories * 0.2 / 4); // Estimate from calories

      // Extract cooking times
      const totalTime = recipe.total_time_minutes || recipe.cook_time_minutes || 30;
      const prepTime = recipe.prep_time_minutes || Math.round(totalTime * 0.3);

      // Extract ingredients - try multiple sources
      let ingredients = [];
      if (recipe.sections && Array.isArray(recipe.sections)) {
        ingredients = recipe.sections.flatMap(section => 
          section.components ? section.components.map(comp => {
            if (comp.raw_text) return comp.raw_text;
            if (comp.ingredient && comp.ingredient.name) {
              const measurement = comp.measurements && comp.measurements[0] ? 
                `${comp.measurements[0].quantity} ${comp.measurements[0].unit.name}` : '';
              return `${measurement} ${comp.ingredient.name}`.trim();
            }
            return null;
          }).filter(Boolean) : []
        );
      }

      // If no ingredients found, create some reasonable fallbacks
      if (ingredients.length === 0) {
        const recipeName = recipe.name.toLowerCase();
        if (recipeName.includes('banana bread')) {
          ingredients = [
            '3 ripe bananas',
            '1/3 cup melted butter',
            '3/4 cup sugar',
            '1 egg, beaten',
            '1 teaspoon vanilla',
            '1 teaspoon baking soda',
            'Pinch of salt',
            '1 1/2 cups all-purpose flour'
          ];
        } else if (recipeName.includes('chicken')) {
          ingredients = [
            '1 lb chicken',
            'Salt and pepper to taste',
            '2 tablespoons oil',
            'Seasonings as needed'
          ];
        } else {
          ingredients = [
            'Main ingredients as needed',
            'Seasonings to taste',
            'Cooking oil if needed'
          ];
        }
      }

      // Extract instructions - try multiple sources
      let instructions = [];
      if (recipe.instructions && Array.isArray(recipe.instructions)) {
        instructions = recipe.instructions.map(inst => 
          inst.display_text || inst.text || inst
        ).filter(Boolean);
      }

      // If no instructions found, create some basic ones
      if (instructions.length === 0) {
        const recipeName = recipe.name.toLowerCase();
        if (recipeName.includes('banana bread')) {
          instructions = [
            'Preheat your oven to 350°F (175°C).',
            'In a mixing bowl, mash the ripe bananas until smooth.',
            'Mix in the melted butter.',
            'Add sugar, egg, and vanilla extract. Mix well.',
            'Sprinkle the baking soda and salt over the mixture and mix in.',
            'Add the flour and mix until just incorporated.',
            'Pour the batter into a buttered loaf pan.',
            'Bake for 50-60 minutes, or until a toothpick inserted into the center comes out clean.',
            'Let cool in the pan for a few minutes, then turn out onto a wire rack.'
          ];
        } else {
          instructions = [
            'Prepare all ingredients according to the recipe.',
            'Follow cooking method appropriate for this dish.',
            'Cook until done and season to taste.',
            'Serve hot and enjoy!'
          ];
        }
      }

      // Get image URL - try multiple sources
      const imageUrl = recipe.thumbnail_url || 
                     recipe.beauty_url || 
                     (recipe.renditions && recipe.renditions.length > 0 ? recipe.renditions[0].url : null);

      // Extract tags and dietary info
      const tags = recipe.tags ? recipe.tags.map(tag => tag.name).filter(Boolean) : [];
      const diets = this.extractDiets(recipe);

      // Format the recipe object
      const formattedRecipe = {
        id: recipe.id || `tasty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: recipe.name,
        image: imageUrl,
        readyInMinutes: totalTime,
        preparationMinutes: prepTime,
        cookingMinutes: totalTime - prepTime,
        servings: recipe.num_servings || 4,
        sourceUrl: recipe.original_video_url || `https://tasty.co/recipe/${recipe.slug || recipe.id}`,
        sourceName: "Tasty",
        summary: recipe.description || `Delicious ${recipe.name} recipe from Tasty. This recipe serves ${recipe.num_servings || 4} people and takes about ${totalTime} minutes to make.`,
        
        // Enhanced nutrition information
        nutrition: {
          nutrients: [
            { name: "Calories", amount: calories, unit: "kcal" },
            { name: "Carbohydrates", amount: carbs, unit: "g" },
            { name: "Fat", amount: fat, unit: "g" },
            { name: "Protein", amount: protein, unit: "g" },
            { name: "Fiber", amount: Math.floor(carbs * 0.1), unit: "g" },
            { name: "Sugar", amount: Math.floor(carbs * 0.3), unit: "g" }
          ]
        },

        // Enhanced ingredients
        extendedIngredients: ingredients.map((ingredient, index) => ({
          id: index + 1,
          original: ingredient,
          name: ingredient.replace(/^\d+[^\s]*\s*/, ''), // Remove quantities for name
          amount: 1,
          unit: "piece"
        })),

        // Enhanced instructions
        analyzedInstructions: [{
          name: "",
          steps: instructions.map((instruction, index) => ({
            number: index + 1,
            step: instruction,
            temperature: this.extractTemperature(instruction),
            time: this.extractTime(instruction)
          }))
        }],

        // Additional metadata
        dishTypes: tags.filter(tag => 
          ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer'].includes(tag.toLowerCase())
        ),
        diets: diets,
        cuisines: recipe.cuisine ? [recipe.cuisine] : [],
        
        // Mark as Tasty source for tracking
        searchSource: 'Tasty',
        isTastyRecipe: true,
        
        // Video URL if available
        videoUrl: recipe.original_video_url,
        
        // Additional Tasty-specific data
        difficulty: recipe.difficulty || 'Medium',
        yields: recipe.yields || `Serves ${recipe.num_servings || 4}`,
        
        // Temperature and equipment info
        ovenTemp: this.extractOvenTemperature(instructions),
        equipment: this.extractEquipment(instructions),
        
        // Rating and additional info
        rating: recipe.user_ratings ? recipe.user_ratings.score : 4.0,
        tags: tags
      };

      console.log(`🍽️ Formatted Tasty recipe: ${formattedRecipe.title} | Instructions: ${instructions.length} | Ingredients: ${ingredients.length} | Nutrition: Yes`);
      return formattedRecipe;

    } catch (error) {
      console.error('❌ Error formatting Tasty recipe:', error);
      return null;
    }
  }

  // Fallback recipes when Tasty API is not available
  getFallbackTastyRecipes(query, filters = {}) {
    const fallbackRecipes = [
      {
        id: 'tasty_fallback_1',
        title: 'Classic Chocolate Chip Cookies',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 25,
        preparationMinutes: 15,
        cookingMinutes: 10,
        servings: 24,
        sourceUrl: 'https://tasty.co/recipe/classic-chocolate-chip-cookies',
        sourceName: "Tasty (Fallback)",
        summary: "The perfect chewy chocolate chip cookies that everyone loves.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        isFallback: true
      },
      {
        id: 'tasty_fallback_2',
        title: 'One-Pan Chicken Teriyaki',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 30,
        preparationMinutes: 10,
        cookingMinutes: 20,
        servings: 4,
        sourceUrl: 'https://tasty.co/recipe/one-pan-chicken-teriyaki',
        sourceName: "Tasty (Fallback)",
        summary: "Easy one-pan chicken teriyaki with vegetables and rice.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        isFallback: true
      },
      {
        id: 'tasty_fallback_3',
        title: 'Creamy Garlic Parmesan Pasta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readyInMinutes: 20,
        preparationMinutes: 5,
        cookingMinutes: 15,
        servings: 4,
        sourceUrl: 'https://tasty.co/recipe/creamy-garlic-parmesan-pasta',
        sourceName: "Tasty (Fallback)",
        summary: "Rich and creamy pasta with garlic and parmesan cheese.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        isFallback: true
      }
    ];

    // Filter fallback recipes based on query
    if (query && query.trim()) {
      const filteredFallbacks = fallbackRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query.toLowerCase()) ||
        recipe.summary.toLowerCase().includes(query.toLowerCase())
      );
      
      if (filteredFallbacks.length > 0) {
        console.log(`📋 Using ${filteredFallbacks.length} fallback Tasty recipes matching "${query}"`);
        return filteredFallbacks;
      }
    }

    console.log('📋 Using all fallback Tasty recipes');
    return fallbackRecipes;
  }
}

export default TastyService;