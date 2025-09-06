// Enhanced Tasty Service with comprehensive endpoint testing
class TastyService {
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '7a185a6062msh982ea92baf690fap117d8fjsn1a509397095e';
    this.baseUrl = 'https://tasty-co1.p.rapidapi.com';
    this.hasValidApiKey = this.apiKey && this.apiKey !== 'demo_key';
    
    if (this.hasValidApiKey) {
      console.log('✅ RapidAPI key configured for Tasty CO1 API');
    } else {
      console.warn('⚠️ RapidAPI key not configured. Using fallback recipes only.');
    }
  }

  // Comprehensive search with multiple endpoint testing
  async searchRecipes(query, filters = {}) {
    if (!this.hasValidApiKey) {
      console.log('No valid RapidAPI key, using fallback recipes');
      return this.getFallbackTastyRecipes(query, filters);
    }

    console.log(`🔍 Starting comprehensive Tasty API search for: "${query}"`);
    
    // Test multiple endpoint configurations systematically
    const endpointConfigs = [
      // Main recipes endpoints
      { path: 'recipes/list', params: { from: 0, size: 20, tags: query || '' }, description: 'Recipes list with tags' },
      { path: 'recipes/list', params: { from: 0, size: 20, q: query || '' }, description: 'Recipes list with query' },
      { path: 'recipes/list', params: { from: 0, size: 20 }, description: 'Recipes list basic' },
      
      // Auto-complete and search endpoints
      { path: 'recipes/auto-complete', params: { prefix: query || '' }, description: 'Auto-complete search' },
      { path: 'feeds/list', params: { from: 0, size: 20 }, description: 'Feeds list' },
      { path: 'tags/list', params: { from: 0, size: 20 }, description: 'Tags list' },
      
      // Alternative parameter formats
      { path: 'recipes/list', params: { offset: 0, limit: 20, search: query || '' }, description: 'Alternative params 1' },
      { path: 'recipes/list', params: { page: 0, per_page: 20, keyword: query || '' }, description: 'Alternative params 2' }
    ];

    for (let i = 0; i < endpointConfigs.length; i++) {
      const config = endpointConfigs[i];
      console.log(`\n🧪 Test ${i + 1}/${endpointConfigs.length}: ${config.description}`);
      
      try {
        const result = await this.testEndpoint(config.path, config.params, query);
        if (result && result.length > 0) {
          console.log(`🎉 SUCCESS! Found ${result.length} recipes using: ${config.description}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ Error testing ${config.description}:`, error.message);
      }
    }

    console.log('\n🔄 All API endpoints failed, using enhanced fallback recipes');
    return this.getFallbackTastyRecipes(query, filters);
  }

  // Test individual endpoint with detailed logging
  async testEndpoint(path, params, query) {
    try {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.append(key, value.toString());
        }
      });

      const apiUrl = `${this.baseUrl}/${path}?${urlParams}`;
      console.log(`📡 Request: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tasty-co1.p.rapidapi.com',
          'Accept': 'application/json',
          'User-Agent': 'TastyApp/1.0'
        }
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Response keys:`, Object.keys(data));
        
        // Log response structure for debugging
        if (typeof data === 'object' && data !== null) {
          console.log(`📋 Response sample:`, JSON.stringify(data, null, 2).substring(0, 800));
        }

        // Try to extract recipes from various response structures
        let recipes = this.extractRecipesFromResponse(data);
        
        if (recipes.length > 0) {
          console.log(`✅ Extracted ${recipes.length} recipes from response`);
          return recipes.slice(0, 12).map(recipe => this.formatTastyRecipe(recipe));
        } else {
          console.log(`📭 No recipes found in response structure`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}:`, errorText.substring(0, 300));
        
        if (response.status === 401 || response.status === 403) {
          console.error('🔐 Authentication issue - API key may be invalid');
        } else if (response.status === 429) {
          console.warn('⏰ Rate limit exceeded');
        } else if (response.status === 404) {
          console.log('🚫 Endpoint not found');
        }
      }
    } catch (error) {
      console.error(`❌ Network error:`, error.message);
    }

    return [];
  }

  // Extract recipes from various possible response structures
  extractRecipesFromResponse(data) {
    let recipes = [];

    // Try different possible array locations
    const possiblePaths = [
      data.results,
      data.recipes,
      data.data,
      data.items,
      data.content,
      data.response,
      data
    ];

    for (const path of possiblePaths) {
      if (Array.isArray(path) && path.length > 0) {
        console.log(`🎯 Found recipes array with ${path.length} items`);
        recipes = path;
        break;
      }
    }

    // If we found an array, validate it contains recipe-like objects
    if (recipes.length > 0) {
      const sample = recipes[0];
      const hasRecipeProps = sample && (
        sample.name || sample.title || sample.display_name ||
        sample.id || sample.recipe_id ||
        sample.thumbnail_url || sample.image_url
      );
      
      if (hasRecipeProps) {
        console.log(`✅ Validated recipe structure in array`);
        return recipes;
      } else {
        console.log(`⚠️ Array found but doesn't contain recipe objects`);
      }
    }

    return [];
  }

  // Enhanced recipe formatter
  formatTastyRecipe(recipe) {
    console.log(`🔧 Formatting recipe:`, recipe.name || recipe.title || 'Unknown Recipe');
    
    const recipeId = recipe.id || recipe.recipe_id || `tasty_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const recipeName = recipe.name || recipe.title || recipe.display_name || 'Tasty Recipe';
    const recipeImage = recipe.thumbnail_url || recipe.image_url || recipe.renditions?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300';
    const cookTime = recipe.cook_time_minutes || recipe.total_time_minutes || recipe.prep_time_minutes || 30;
    const servingCount = recipe.num_servings || recipe.servings || recipe.yields || 4;
    const description = recipe.description || recipe.buzz || recipe.instructions_summary || `Delicious ${recipeName} from Tasty`;

    return {
      id: recipeId,
      title: recipeName,
      image: recipeImage,
      readyInMinutes: cookTime,
      servings: servingCount,
      sourceUrl: recipe.original_video_url || `https://tasty.co/recipe/${recipe.slug || recipeId}`,
      sourceName: "Tasty",
      summary: description,
      searchSource: 'Tasty',
      isTastyRecipe: true,
      nutrition: { 
        nutrients: recipe.nutrition ? [
          { name: 'Calories', amount: recipe.nutrition.calories || 0 },
          { name: 'Fat', amount: recipe.nutrition.fat || 0 },
          { name: 'Carbohydrates', amount: recipe.nutrition.carbohydrates || 0 },
          { name: 'Protein', amount: recipe.nutrition.protein || 0 }
        ] : []
      },
      extendedIngredients: this.extractIngredients(recipe),
      analyzedInstructions: this.extractInstructions(recipe),
      originalData: recipe
    };
  }

  // Extract ingredients from recipe
  extractIngredients(recipe) {
    let ingredients = [];
    
    if (recipe.sections && Array.isArray(recipe.sections)) {
      ingredients = recipe.sections.flatMap(section => 
        (section.components || []).map(component => ({
          original: component.raw_text || component.ingredient?.display_singular || 'Ingredient',
          name: component.ingredient?.display_singular || component.ingredient?.name || 'Ingredient'
        }))
      );
    } else if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      ingredients = recipe.ingredients.map(ing => ({
        original: ing.raw_text || ing.name || ing,
        name: ing.name || ing
      }));
    }

    return ingredients;
  }

  // Extract instructions from recipe
  extractInstructions(recipe) {
    let instructions = [];
    
    if (recipe.instructions && Array.isArray(recipe.instructions)) {
      instructions = [{
        name: '',
        steps: recipe.instructions.map((instruction, index) => ({
          number: index + 1,
          step: instruction.display_text || instruction.text || instruction
        }))
      }];
    }

    return instructions;
  }

  // Enhanced fallback recipes with full recipe details
  getFallbackTastyRecipes(query) {
    const queryLower = (query || '').toLowerCase();
    
    const allFallbacks = [
      {
        id: 'tasty_demo_1',
        title: 'Classic Chocolate Chip Cookies',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300',
        readyInMinutes: 25,
        servings: 24,
        sourceUrl: 'https://tasty.co/recipe/classic-chocolate-chip-cookies',
        sourceName: "Tasty (Demo)",
        summary: "Perfect chewy chocolate chip cookies that everyone loves.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        nutrition: { nutrients: [
          { name: 'Calories', amount: 150 },
          { name: 'Fat', amount: 7 },
          { name: 'Carbohydrates', amount: 21 },
          { name: 'Protein', amount: 2 }
        ]},
        extendedIngredients: [
          { original: '2 1/4 cups all-purpose flour', name: 'flour' },
          { original: '1 cup butter, softened', name: 'butter' },
          { original: '3/4 cup granulated sugar', name: 'sugar' },
          { original: '2 large eggs', name: 'eggs' },
          { original: '2 cups chocolate chips', name: 'chocolate chips' }
        ],
        analyzedInstructions: [{
          name: '',
          steps: [
            { number: 1, step: 'Preheat oven to 375°F (190°C).' },
            { number: 2, step: 'Mix butter and sugars until creamy.' },
            { number: 3, step: 'Beat in eggs and vanilla.' },
            { number: 4, step: 'Gradually blend in flour.' },
            { number: 5, step: 'Stir in chocolate chips.' },
            { number: 6, step: 'Drop rounded tablespoons onto ungreased cookie sheets.' },
            { number: 7, step: 'Bake 9-11 minutes or until golden brown.' }
          ]
        }]
      },
      {
        id: 'tasty_demo_2',
        title: 'Ultimate Banana Bread',
        image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300',
        readyInMinutes: 65,
        servings: 8,
        sourceUrl: 'https://tasty.co/recipe/ultimate-banana-bread',
        sourceName: "Tasty (Demo)",
        summary: "Moist and delicious banana bread made with ripe bananas.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        nutrition: { nutrients: [
          { name: 'Calories', amount: 195 },
          { name: 'Fat', amount: 4 },
          { name: 'Carbohydrates', amount: 39 },
          { name: 'Protein', amount: 4 }
        ]},
        extendedIngredients: [
          { original: '3 ripe bananas, mashed', name: 'bananas' },
          { original: '1/3 cup melted butter', name: 'butter' },
          { original: '3/4 cup sugar', name: 'sugar' },
          { original: '1 egg, beaten', name: 'egg' },
          { original: '1 teaspoon vanilla', name: 'vanilla' },
          { original: '1 1/2 cups all-purpose flour', name: 'flour' }
        ],
        analyzedInstructions: [{
          name: '',
          steps: [
            { number: 1, step: 'Preheat oven to 350°F (175°C).' },
            { number: 2, step: 'Mash bananas in a large bowl.' },
            { number: 3, step: 'Mix in melted butter.' },
            { number: 4, step: 'Add sugar, egg, and vanilla.' },
            { number: 5, step: 'Add flour and mix until just combined.' },
            { number: 6, step: 'Pour into greased 9x5 inch loaf pan.' },
            { number: 7, step: 'Bake for 60-65 minutes until golden brown.' }
          ]
        }]
      }
    ];

    // Filter based on query
    if (queryLower) {
      const filtered = allFallbacks.filter(recipe => 
        recipe.title.toLowerCase().includes(queryLower) ||
        recipe.summary.toLowerCase().includes(queryLower)
      );
      
      if (filtered.length > 0) {
        console.log(`🎯 Found ${filtered.length} matching demo recipes for "${query}"`);
        return filtered;
      }
    }
    
    console.log(`📦 Using ${allFallbacks.length} demo recipes for "${query}"`);
    return allFallbacks;
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId) {
    if (!this.hasValidApiKey) {
      console.log('⚠️ No API key for detailed recipe fetch');
      return null;
    }

    try {
      console.log(`🔍 Fetching detailed info for recipe ID: ${recipeId}`);
      
      const apiUrl = `${this.baseUrl}/recipes/get-more-info?id=${recipeId}`;
      console.log(`📡 Detail API Request: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tasty-co1.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Got detailed recipe data:`, Object.keys(data));
        return this.formatTastyRecipe(data);
      } else {
        console.log(`❌ Detail fetch failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching recipe details:', error);
    }
    
    return null;
  }
}

// Export both default and named export for compatibility
export default TastyService;
export const tastyService = new TastyService();
