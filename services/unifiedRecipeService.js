import { recipeService } from './recipeService';
import { tastyService } from './tastyService';

// Unified Recipe Search Service - Combines Spoonacular and Tasty sources
class UnifiedRecipeService {
  constructor() {
    this.sources = [
      { name: 'Spoonacular', service: recipeService, weight: 1.0 },
      { name: 'Tasty', service: tastyService, weight: 0.9 }
    ];
  }

  // Main search function that combines Spoonacular and Tasty sources
  async searchRecipes(query, filters = {}) {
    try {
      console.log(`🔍 Starting unified search for: "${query}"`);
      
      const allResults = [];
      const searchPromises = [];

      // Search Spoonacular
      searchPromises.push(
        this.searchWithTimeout(recipeService.searchRecipes(query, filters), 'Spoonacular', 10000)
      );

      // Search Tasty
      searchPromises.push(
        this.searchWithTimeout(tastyService.searchRecipes(query, filters), 'Tasty', 10000)
      );

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises);

      // Process results from each source
      results.forEach((result, index) => {
        const sourceName = ['Spoonacular', 'Tasty'][index];
        
        if (result.status === 'fulfilled' && result.value) {
          const recipes = Array.isArray(result.value) ? result.value : [];
          console.log(`✅ ${sourceName}: ${recipes.length} recipes found`);
          
          // Add source information and weight to each recipe
          recipes.forEach(recipe => {
            if (recipe && recipe.title) {
              recipe.searchSource = sourceName;
              recipe.sourceWeight = this.sources[index].weight;
              allResults.push(recipe);
            }
          });
        } else {
          console.log(`❌ ${sourceName}: Failed or no results`);
        }
      });

      console.log(`📊 Total recipes before processing: ${allResults.length}`);

      // Remove duplicates based on title similarity
      const uniqueRecipes = this.removeDuplicates(allResults);
      console.log(`🔄 Unique recipes after deduplication: ${uniqueRecipes.length}`);

      // Calculate relevance scores and sort
      const scoredRecipes = this.calculateRelevanceScores(uniqueRecipes, query, filters);
      const sortedRecipes = scoredRecipes.sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log(`✨ Final sorted results: ${sortedRecipes.length} recipes`);
      
      // Log top 3 results for debugging
      sortedRecipes.slice(0, 3).forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title} (Score: ${recipe.relevanceScore.toFixed(2)}, Source: ${recipe.searchSource})`);
      });

      return sortedRecipes;

    } catch (error) {
      console.error('Error in unified recipe search:', error);
      // Fallback to just Spoonacular if unified search fails
      return await recipeService.searchRecipes(query, filters);
    }
  }

  // Search with timeout to prevent hanging
  async searchWithTimeout(promise, sourceName, timeout = 10000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${sourceName} search timeout`)), timeout);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      console.warn(`${sourceName} search failed:`, error.message);
      return [];
    }
  }

  // Remove duplicate recipes based on title similarity
  removeDuplicates(recipes) {
    const uniqueRecipes = [];
    const seenTitles = new Set();

    recipes.forEach(recipe => {
      if (!recipe || !recipe.title) return;
      
      const normalizedTitle = this.normalizeTitle(recipe.title);
      
      // Check if we've seen a similar title
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        if (this.calculateStringSimilarity(normalizedTitle, seenTitle) > 0.8) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seenTitles.add(normalizedTitle);
        uniqueRecipes.push(recipe);
      }
    });

    return uniqueRecipes;
  }

  // Normalize title for comparison
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  // Calculate string similarity using Levenshtein distance
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance calculation
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Calculate relevance scores for sorting
  calculateRelevanceScores(recipes, query, filters) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    return recipes.map(recipe => {
      let score = 0;
      
      // Base score from source weight
      score += (recipe.sourceWeight || 0.5) * 10;
      
      // Title relevance (highest weight)
      const titleScore = this.calculateTextRelevance(recipe.title || '', queryWords);
      score += titleScore * 30;
      
      // Description/summary relevance
      const summaryScore = this.calculateTextRelevance(recipe.summary || '', queryWords);
      score += summaryScore * 15;
      
      // Ingredient relevance
      const ingredientText = this.getIngredientText(recipe);
      const ingredientScore = this.calculateTextRelevance(ingredientText, queryWords);
      score += ingredientScore * 10;
      
      // Filter matching bonuses
      score += this.calculateFilterBonus(recipe, filters);
      
      // Quality indicators
      score += this.calculateQualityScore(recipe);
      
      // Penalty for very long cooking times (unless user specifically wants it)
      if (!filters.maxReadyTime && recipe.readyInMinutes > 120) {
        score -= 5;
      }
      
      recipe.relevanceScore = Math.max(0, score);
      return recipe;
    });
  }

  // Calculate text relevance score
  calculateTextRelevance(text, queryWords) {
    if (!text || queryWords.length === 0) return 0;
    
    const textLower = text.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        // Exact word match
        score += 1;
        
        // Bonus for word at beginning of title
        if (textLower.startsWith(word)) {
          score += 0.5;
        }
        
        // Count frequency of word
        const matches = (textLower.match(new RegExp(word, 'g')) || []).length;
        score += (matches - 1) * 0.2; // Additional matches get smaller bonus
      }
    });
    
    return score / queryWords.length; // Normalize by query length
  }

  // Get ingredient text for searching
  getIngredientText(recipe) {
    if (!recipe.extendedIngredients) return '';
    
    return recipe.extendedIngredients
      .map(ing => ing.name || ing.original || '')
      .join(' ')
      .toLowerCase();
  }

  // Calculate filter matching bonus
  calculateFilterBonus(recipe, filters) {
    let bonus = 0;
    
    // Diet filters
    if (filters.diet) {
      if (filters.diet === 'vegetarian' && recipe.isVegetarian) bonus += 5;
      if (filters.diet === 'vegan' && recipe.isVegan) bonus += 5;
    }
    
    // Intolerance filters
    if (filters.intolerances) {
      if (filters.intolerances.includes('gluten') && recipe.isGlutenFree) bonus += 3;
      if (filters.intolerances.includes('dairy') && recipe.isDairyFree) bonus += 3;
    }
    
    // Time preference
    if (filters.maxReadyTime) {
      const maxTime = parseInt(filters.maxReadyTime);
      if (recipe.readyInMinutes <= maxTime) {
        bonus += 3;
      }
    }
    
    // Cuisine match
    if (filters.cuisine && recipe.cuisine && 
        recipe.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())) {
      bonus += 4;
    }
    
    return bonus;
  }

  // Calculate quality score based on recipe completeness
  calculateQualityScore(recipe) {
    let score = 0;
    
    // Has image
    if (recipe.image && recipe.image !== 'https://placeholder-image-url.jpg') {
      score += 2;
    }
    
    // Has nutrition info
    if (recipe.nutrition && recipe.nutrition.calories > 0) {
      score += 1;
    }
    
    // Has instructions
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
      score += 2;
    }
    
    // Has ingredients
    if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
      score += 1;
    }
    
    // Reasonable serving size
    if (recipe.servings >= 1 && recipe.servings <= 12) {
      score += 0.5;
    }
    
    // Reasonable cooking time
    if (recipe.readyInMinutes >= 5 && recipe.readyInMinutes <= 180) {
      score += 0.5;
    }
    
    return score;
  }
}

export const unifiedRecipeService = new UnifiedRecipeService();
