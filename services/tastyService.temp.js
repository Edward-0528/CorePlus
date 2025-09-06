// Simplified Tasty Service - Working version for tasty-api1
class TastyService {
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '7a185a6062msh982ea92baf690fap117d8fjsn1a509397095e';
    this.baseUrl = 'https://tasty-api1.p.rapidapi.com';
    this.hasValidApiKey = this.apiKey && this.apiKey !== 'demo_key';
    
    if (this.hasValidApiKey) {
      console.log('✅ RapidAPI key configured for Tasty API v1');
    } else {
      console.warn('⚠️ RapidAPI key not configured. Using fallback recipes only.');
    }
  }

  // Search recipes from Tasty via RapidAPI
  async searchRecipes(query, filters = {}) {
    if (!this.hasValidApiKey) {
      console.log('No valid RapidAPI key, using fallback recipes');
      return this.getFallbackTastyRecipes(query, filters);
    }

    try {
      // Try multiple endpoints for tasty-api1
      const endpoints = ['recipes/list', 'search', 'recipes', 'list'];
      
      for (const endpoint of endpoints) {
        try {
          const params = new URLSearchParams({
            from: '0',
            size: '20',
            q: query || ''
          });

          const apiUrl = `${this.baseUrl}/${endpoint}?${params}`;
          console.log(`🔍 Testing tasty-api1 endpoint: ${apiUrl}`);

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': 'tasty-api1.p.rapidapi.com',
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
            console.log('📊 Response keys:', Object.keys(data));
            
            // Extract recipes from response
            let recipes = data.results || data.recipes || data.data || (Array.isArray(data) ? data : []);
            
            if (recipes.length > 0) {
              console.log(`📋 Found ${recipes.length} recipes`);
              return recipes.slice(0, 12).map(recipe => this.formatTastyRecipe(recipe));
            }
          }
        } catch (error) {
          console.log(`❌ Error with endpoint ${endpoint}:`, error.message);
        }
      }
      
      // If all endpoints fail, use fallback
      return this.getFallbackTastyRecipes(query, filters);
      
    } catch (error) {
      console.error('❌ Error calling Tasty API:', error.message);
      return this.getFallbackTastyRecipes(query, filters);
    }
  }

  // Simple recipe formatter
  formatTastyRecipe(recipe) {
    return {
      id: recipe.id || `tasty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: recipe.name || 'Tasty Recipe',
      image: recipe.thumbnail_url || recipe.image_url || 'https://via.placeholder.com/300x200',
      readyInMinutes: recipe.total_time_minutes || 30,
      servings: recipe.num_servings || 4,
      sourceUrl: `https://tasty.co/recipe/${recipe.slug || recipe.id}`,
      sourceName: "Tasty",
      summary: recipe.description || `Delicious ${recipe.name} recipe from Tasty.`,
      searchSource: 'Tasty',
      isTastyRecipe: true,
      
      // Basic structure for compatibility
      nutrition: { nutrients: [] },
      extendedIngredients: [],
      analyzedInstructions: []
    };
  }

  // Simple fallback recipes
  getFallbackTastyRecipes(query) {
    const fallbacks = [
      {
        id: 'tasty_fallback_1',
        title: 'Classic Chocolate Chip Cookies',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300',
        readyInMinutes: 25,
        servings: 24,
        sourceUrl: 'https://tasty.co/recipe/classic-chocolate-chip-cookies',
        sourceName: "Tasty (Fallback)",
        summary: "Perfect chewy chocolate chip cookies that everyone loves.",
        searchSource: 'Tasty',
        isTastyRecipe: true,
        nutrition: { nutrients: [] },
        extendedIngredients: [],
        analyzedInstructions: []
      }
    ];
    
    return fallbacks;
  }

  // Placeholder for recipe details
  async getRecipeDetails(recipeId) {
    console.log(`🔍 Getting recipe details for: ${recipeId}`);
    return null; // Will be enhanced later
  }
}

export default TastyService;
