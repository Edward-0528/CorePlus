import { Camera } from 'expo-camera';

/**
 * Barcode scanning service for food nutrition lookup
 * Uses OpenFoodFacts API (free, open database)
 */

const OPENFOODFACTS_API_BASE = 'https://world.openfoodfacts.org/api/v0/product';

/**
 * Request camera permissions for barcode scanning
 */
export const requestBarcodePermissions = async () => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return {
      success: status === 'granted',
      status,
      message: status === 'granted' ? 'Camera permission granted' : 'Camera permission denied'
    };
  } catch (error) {
    console.error('Error requesting barcode permissions:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to request camera permissions'
    };
  }
};

/**
 * Check if camera permissions are already granted
 */
export const checkBarcodePermissions = async () => {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return {
      granted: status === 'granted',
      status
    };
  } catch (error) {
    console.error('Error checking barcode permissions:', error);
    return {
      granted: false,
      status: 'error'
    };
  }
};

/**
 * Fetch nutrition data from OpenFoodFacts API using barcode
 */
export const getNutritionFromBarcode = async (barcode) => {
  try {
    console.log(`🔍 Looking up barcode: ${barcode}`);
    
    const response = await fetch(`${OPENFOODFACTS_API_BASE}/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 0) {
      return {
        success: false,
        error: 'Product not found',
        message: 'This product is not in our database. Try manual entry.'
      };
    }
    
    const product = data.product;
    
    // Extract nutrition information
    const nutrition = extractNutritionData(product);
    
    if (!nutrition.calories && !nutrition.protein && !nutrition.carbs && !nutrition.fat) {
      return {
        success: false,
        error: 'No nutrition data',
        message: 'Product found but nutrition information is incomplete.'
      };
    }
    
    console.log(`✅ Found product: ${nutrition.name}`);
    
    return {
      success: true,
      nutrition,
      rawData: product // Include raw data for debugging
    };
    
  } catch (error) {
    console.error('Error fetching nutrition from barcode:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to lookup product. Please try again or enter manually.'
    };
  }
};

/**
 * Extract and normalize nutrition data from OpenFoodFacts product
 */
const extractNutritionData = (product) => {
  const nutriments = product.nutriments || {};
  
  // Get serving size (per 100g by default, but check for serving size)
  let servingSize = 100; // Default to 100g
  let servingUnit = 'g';
  
  if (product.serving_size) {
    const servingMatch = product.serving_size.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]*)/);
    if (servingMatch) {
      servingSize = parseFloat(servingMatch[1]);
      servingUnit = servingMatch[2] || 'g';
    }
  }
  
  // Extract nutrition per 100g and convert to per serving if needed
  const per100g = {
    calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0,
    protein: nutriments['proteins_100g'] || nutriments['proteins'] || 0,
    carbs: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0,
    fat: nutriments['fat_100g'] || nutriments['fat'] || 0,
    fiber: nutriments['fiber_100g'] || nutriments['fiber'] || 0,
    sugar: nutriments['sugars_100g'] || nutriments['sugars'] || 0,
    sodium: nutriments['sodium_100g'] || nutriments['sodium'] || 0
  };
  
  // Convert sodium from grams to mg if needed
  if (per100g.sodium < 10) {
    per100g.sodium = per100g.sodium * 1000; // Convert g to mg
  }
  
  // Calculate nutrition per serving
  const ratio = servingSize / 100;
  const perServing = {
    calories: Math.round(per100g.calories * ratio),
    protein: Math.round(per100g.protein * ratio * 10) / 10,
    carbs: Math.round(per100g.carbs * ratio * 10) / 10,
    fat: Math.round(per100g.fat * ratio * 10) / 10,
    fiber: Math.round(per100g.fiber * ratio * 10) / 10,
    sugar: Math.round(per100g.sugar * ratio * 10) / 10,
    sodium: Math.round(per100g.sodium * ratio)
  };
  
  return {
    // Product information
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || '',
    barcode: product.code || '',
    
    // Serving information
    servingSize,
    servingUnit,
    
    // Nutrition per serving
    ...perServing,
    
    // Additional metadata
    confidence: 0.95, // High confidence for barcode scans
    method: 'barcode',
    
    // Image if available
    imageUri: product.image_url || product.image_front_url || null,
    
    // Allergens and labels
    allergens: product.allergens_tags || [],
    labels: product.labels_tags || [],
    
    // Nutrition grade if available
    nutritionGrade: product.nutrition_grades || null,
    
    // Raw nutrition data for reference
    per100g,
    
    // Source information
    source: 'OpenFoodFacts',
    lastModified: product.last_modified_t ? new Date(product.last_modified_t * 1000) : null
  };
};

/**
 * Search for products by text (fallback when barcode fails)
 */
export const searchProductByText = async (searchTerm, limit = 10) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&json=1&page_size=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return {
        success: false,
        message: 'No products found'
      };
    }
    
    const products = data.products
      .filter(product => product.product_name && product.nutriments)
      .map(product => extractNutritionData(product))
      .slice(0, limit);
    
    return {
      success: true,
      products,
      count: products.length
    };
    
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to search products'
    };
  }
};

/**
 * Get popular/trending products for suggestions
 */
export const getPopularProducts = async (category = '', limit = 20) => {
  try {
    let url = 'https://world.openfoodfacts.org/cgi/search.pl?';
    
    if (category) {
      url += `categories_tags=${encodeURIComponent(category)}&`;
    }
    
    url += `sort_by=popularity&json=1&page_size=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const products = data.products
      ?.filter(product => product.product_name && product.nutriments)
      ?.map(product => extractNutritionData(product))
      ?.slice(0, limit) || [];
    
    return {
      success: true,
      products,
      count: products.length
    };
    
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
};

export default {
  requestBarcodePermissions,
  checkBarcodePermissions,
  getNutritionFromBarcode,
  searchProductByText,
  getPopularProducts
};
