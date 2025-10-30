// Food Analysis Service using Google Gemini AI for enhanced food identification and nutritional estimation

import * as FileSystem from 'expo-file-system';

// Get API key directly from environment (more reliable in production)
const getGeminiApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Function to construct API URL dynamically (ensures API key is available)
const getGeminiApiUrl = () => {
  const apiKey = getGeminiApiKey();
  console.log('🔧 getGeminiApiUrl debug:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyStart: apiKey ? apiKey.substring(0, 8) + '***' : 'NONE'
  });
  
  if (!apiKey) {
    console.error('🚨 getGeminiApiUrl: No API key available');
    throw new Error('Gemini API key not available');
  }
  
  // Use 2.5 Pro for image analysis (most accurate model available)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
  console.log('✅ getGeminiApiUrl: Image analysis URL constructed (2.5 Pro - highest accuracy), length:', url.length);
  return url;
};

// Function to construct text API URL (uses 2.5 Flash for better text analysis)
const getGeminiTextApiUrl = () => {
  const apiKey = getGeminiApiKey();
  console.log('🔧 getGeminiTextApiUrl debug:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyStart: apiKey ? apiKey.substring(0, 8) + '***' : 'NONE'
  });
  
  if (!apiKey) {
    console.error('🚨 getGeminiTextApiUrl: No API key available');
    throw new Error('Gemini API key not available');
  }
  
  // Use 2.5 Flash for text analysis (works perfectly for manual search)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log('✅ getGeminiTextApiUrl: Text analysis URL constructed (2.5 Flash), length:', url.length);
  return url;
};

// Validate API key availability (but don't fail at module load)
const validateApiKey = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error('Missing Gemini API key for food analysis. Search functionality may be limited.');
    return false;
  }
  return true;
};

// Enhanced nutrition database with realistic serving sizes and accurate nutrition values
const NUTRITION_DATABASE = {
  // Fruits (realistic portions)
  'apple': { calories: 95, carbs: 25, protein: 0.5, fat: 0.3, portion: '1 medium (180g)', fiber: 4, sugar: 19, sodium: 2 },
  'banana': { calories: 105, carbs: 27, protein: 1.3, fat: 0.4, portion: '1 medium (120g)', fiber: 3, sugar: 14, sodium: 1 },
  'orange': { calories: 62, carbs: 15, protein: 1.2, fat: 0.2, portion: '1 medium (130g)', fiber: 3, sugar: 12, sodium: 0 },
  'strawberry': { calories: 32, carbs: 8, protein: 0.7, fat: 0.3, portion: '1 cup (100g)', fiber: 2, sugar: 5, sodium: 1 },
  'grapes': { calories: 62, carbs: 16, protein: 0.6, fat: 0.2, portion: '1 cup (80g)', fiber: 1, sugar: 15, sodium: 2 },
  'blueberry': { calories: 84, carbs: 21, protein: 1, fat: 0.5, portion: '1 cup (148g)', fiber: 4, sugar: 15, sodium: 1 },
  'raspberry': { calories: 64, carbs: 15, protein: 1.5, fat: 0.8, portion: '1 cup (123g)', fiber: 8, sugar: 5, sodium: 1 },
  'pineapple': { calories: 82, carbs: 22, protein: 0.9, fat: 0.2, portion: '1 cup chunks (165g)', fiber: 2, sugar: 16, sodium: 2 },
  'mango': { calories: 107, carbs: 28, protein: 1, fat: 0.5, portion: '1 cup sliced (165g)', fiber: 3, sugar: 24, sodium: 3 },
  'avocado': { calories: 234, carbs: 12, protein: 3, fat: 21, portion: '1 medium (150g)', fiber: 10, sugar: 1, sodium: 7 },
  
  // Vegetables (realistic portions)
  'broccoli': { calories: 25, carbs: 5, protein: 3, fat: 0.3, portion: '1 cup (91g)', fiber: 2, sugar: 1, sodium: 33 },
  'carrot': { calories: 30, carbs: 7, protein: 0.7, fat: 0.1, portion: '1 medium (61g)', fiber: 2, sugar: 3, sodium: 42 },
  'spinach': { calories: 7, carbs: 1, protein: 0.9, fat: 0.1, portion: '1 cup fresh (30g)', fiber: 0.7, sugar: 0.1, sodium: 24 },
  'tomato': { calories: 22, carbs: 5, protein: 1, fat: 0.2, portion: '1 medium (123g)', fiber: 1, sugar: 3, sodium: 6 },
  'potato': { calories: 161, carbs: 37, protein: 4, fat: 0.2, portion: '1 medium baked (173g)', fiber: 4, sugar: 2, sodium: 8 },
  'sweet potato': { calories: 112, carbs: 26, protein: 2, fat: 0.1, portion: '1 medium baked (128g)', fiber: 4, sugar: 5, sodium: 7 },
  'bell pepper': { calories: 31, carbs: 7, protein: 1, fat: 0.3, portion: '1 cup chopped (149g)', fiber: 3, sugar: 5, sodium: 4 },
  'cucumber': { calories: 16, carbs: 4, protein: 0.7, fat: 0.1, portion: '1 cup sliced (104g)', fiber: 1, sugar: 2, sodium: 2 },
  'onion': { calories: 32, carbs: 7, protein: 0.9, fat: 0.1, portion: '1/2 cup chopped (80g)', fiber: 1, sugar: 3, sodium: 3 },
  'lettuce': { calories: 5, carbs: 1, protein: 0.5, fat: 0.1, portion: '1 cup shredded (36g)', fiber: 0.5, sugar: 0.8, sodium: 3 },
  'mushroom': { calories: 15, carbs: 2, protein: 2, fat: 0.2, portion: '1 cup sliced (70g)', fiber: 1, sugar: 1, sodium: 4 },
  'corn': { calories: 177, carbs: 41, protein: 5, fat: 2, portion: '1 cup kernels (164g)', fiber: 5, sugar: 6, sodium: 23 },
  
  // Proteins (realistic portions)
  'chicken breast': { calories: 185, carbs: 0, protein: 35, fat: 4, portion: '4 oz cooked (112g)', fiber: 0, sugar: 0, sodium: 74 },
  'chicken thigh': { calories: 209, carbs: 0, protein: 26, fat: 11, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 77 },
  'salmon': { calories: 175, carbs: 0, protein: 25, fat: 8, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 59 },
  'tuna': { calories: 109, carbs: 0, protein: 25, fat: 1, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 40 },
  'shrimp': { calories: 84, carbs: 0, protein: 18, fat: 1, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 94 },
  'beef': { calories: 213, carbs: 0, protein: 22, fat: 13, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 54 },
  'ground beef': { calories: 218, carbs: 0, protein: 22, fat: 14, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 71 },
  'pork': { calories: 206, carbs: 0, protein: 23, fat: 12, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 62 },
  'turkey': { calories: 125, carbs: 0, protein: 26, fat: 1, portion: '3 oz cooked (85g)', fiber: 0, sugar: 0, sodium: 54 },
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

// Enhanced fast food and restaurant database for accurate nutrition facts
const FAST_FOOD_DATABASE = {
  // McDonald's
  'mcdonalds 10 piece chicken nuggets': { calories: 420, carbs: 25, protein: 23, fat: 25, portion: '10 pieces', fiber: 2, sugar: 0, sodium: 540 },
  'mcdonalds 6 piece chicken nuggets': { calories: 250, carbs: 15, protein: 14, fat: 15, portion: '6 pieces', fiber: 1, sugar: 0, sodium: 325 },
  'mcdonalds 4 piece chicken nuggets': { calories: 170, carbs: 10, protein: 9, fat: 10, portion: '4 pieces', fiber: 1, sugar: 0, sodium: 220 },
  'mcdonalds big mac': { calories: 550, carbs: 45, protein: 25, fat: 31, portion: '1 sandwich', fiber: 3, sugar: 9, sodium: 1010 },
  'mcdonalds quarter pounder': { calories: 520, carbs: 42, protein: 26, fat: 26, portion: '1 sandwich', fiber: 3, sugar: 10, sodium: 1040 },
  'mcdonalds medium fries': { calories: 320, carbs: 43, protein: 4, fat: 15, portion: 'medium (115g)', fiber: 4, sugar: 0, sodium: 260 },
  'mcdonalds large fries': { calories: 510, carbs: 66, protein: 6, fat: 24, portion: 'large (154g)', fiber: 6, sugar: 0, sodium: 400 },
  'mcdonalds small fries': { calories: 230, carbs: 30, protein: 3, fat: 11, portion: 'small (71g)', fiber: 3, sugar: 0, sodium: 160 },
  'mcdonalds coca cola medium': { calories: 210, carbs: 58, protein: 0, fat: 0, portion: 'medium (21 fl oz)', fiber: 0, sugar: 58, sodium: 10 },
  'mcdonalds coca cola large': { calories: 290, carbs: 77, protein: 0, fat: 0, portion: 'large (30 fl oz)', fiber: 0, sugar: 77, sodium: 15 },
  'mcdonalds apple pie': { calories: 230, carbs: 32, protein: 4, fat: 10, portion: '1 pie', fiber: 4, sugar: 13, sodium: 100 },
  'mcdonalds mcflurry oreo': { calories: 510, carbs: 82, protein: 13, fat: 17, portion: 'regular size', fiber: 1, sugar: 64, sodium: 280 },
  
  // Burger King
  'burger king whopper': { calories: 657, carbs: 49, protein: 28, fat: 40, portion: '1 sandwich', fiber: 2, sugar: 11, sodium: 980 },
  'burger king chicken nuggets 10 piece': { calories: 430, carbs: 20, protein: 21, fat: 29, portion: '10 pieces', fiber: 2, sugar: 0, sodium: 900 },
  'burger king chicken nuggets 8 piece': { calories: 344, carbs: 16, protein: 17, fat: 23, portion: '8 pieces', fiber: 2, sugar: 0, sodium: 720 },
  'burger king medium fries': { calories: 320, carbs: 41, protein: 4, fat: 16, portion: 'medium', fiber: 4, sugar: 0, sodium: 480 },
  
  // KFC
  'kfc original recipe chicken breast': { calories: 320, carbs: 8, protein: 29, fat: 19, portion: '1 piece', fiber: 1, sugar: 0, sodium: 540 },
  'kfc original recipe chicken thigh': { calories: 250, carbs: 6, protein: 18, fat: 17, portion: '1 piece', fiber: 0, sugar: 0, sodium: 380 },
  'kfc popcorn chicken': { calories: 620, carbs: 30, protein: 30, fat: 40, portion: 'large', fiber: 3, sugar: 0, sodium: 1440 },
  'kfc coleslaw': { calories: 170, carbs: 13, protein: 1, fat: 13, portion: '1 serving', fiber: 3, sugar: 10, sodium: 270 },
  'kfc mashed potatoes with gravy': { calories: 120, carbs: 17, protein: 1, fat: 4.5, portion: '1 serving', fiber: 1, sugar: 1, sodium: 380 },
  
  // Taco Bell
  'taco bell crunchy taco': { calories: 170, carbs: 13, protein: 8, fat: 10, portion: '1 taco', fiber: 3, sugar: 1, sodium: 310 },
  'taco bell soft taco': { calories: 180, carbs: 18, protein: 9, fat: 8, portion: '1 taco', fiber: 2, sugar: 2, sodium: 500 },
  'taco bell burrito supreme': { calories: 390, carbs: 38, protein: 14, fat: 19, portion: '1 burrito', fiber: 6, sugar: 4, sodium: 1090 },
  'taco bell quesadilla cheese': { calories: 450, carbs: 37, protein: 19, fat: 25, portion: '1 quesadilla', fiber: 3, sugar: 4, sodium: 1000 },
  'taco bell nachos bellgrande': { calories: 740, carbs: 80, protein: 19, fat: 38, portion: '1 serving', fiber: 12, sugar: 5, sodium: 1200 },
  
  // Subway
  'subway footlong turkey breast': { calories: 560, carbs: 92, protein: 37, fat: 8, portion: '12 inch sub', fiber: 5, sugar: 16, sodium: 1260 },
  'subway 6 inch turkey breast': { calories: 280, carbs: 46, protein: 18, fat: 4, portion: '6 inch sub', fiber: 3, sugar: 8, sodium: 630 },
  'subway footlong italian bmt': { calories: 810, carbs: 94, protein: 36, fat: 32, portion: '12 inch sub', fiber: 5, sugar: 16, sodium: 2340 },
  'subway chocolate chip cookie': { calories: 200, carbs: 30, protein: 2, fat: 8, portion: '1 cookie', fiber: 1, sugar: 18, sodium: 160 },
  
  // Pizza Hut
  'pizza hut personal pan pepperoni': { calories: 150, carbs: 15, protein: 6, fat: 7, portion: '1 slice', fiber: 1, sugar: 2, sodium: 340 },
  'pizza hut medium cheese pizza': { calories: 220, carbs: 26, protein: 10, fat: 8, portion: '1 slice', fiber: 1, sugar: 3, sodium: 490 },
  'pizza hut stuffed crust pepperoni': { calories: 360, carbs: 36, protein: 15, fat: 17, portion: '1 slice', fiber: 2, sugar: 5, sodium: 900 },
  
  // Domino's
  'dominos medium hand tossed cheese': { calories: 200, carbs: 25, protein: 8, fat: 7, portion: '1 slice', fiber: 1, sugar: 2, sodium: 370 },
  'dominos medium hand tossed pepperoni': { calories: 210, carbs: 25, protein: 9, fat: 8, portion: '1 slice', fiber: 1, sugar: 2, sodium: 430 },
  
  // Chipotle
  'chipotle chicken burrito bowl': { calories: 630, carbs: 40, protein: 45, fat: 24, portion: '1 bowl with rice', fiber: 6, sugar: 1, sodium: 1070 },
  'chipotle chicken burrito': { calories: 840, carbs: 77, protein: 47, fat: 27, portion: '1 burrito with rice', fiber: 9, sugar: 3, sodium: 1390 },
  'chipotle guacamole': { calories: 230, carbs: 8, protein: 3, fat: 22, portion: '1 serving (4 oz)', fiber: 6, sugar: 1, sodium: 370 },
  
  // Starbucks
  'starbucks grande latte': { calories: 190, carbs: 18, protein: 13, fat: 7, portion: '16 fl oz', fiber: 0, sugar: 17, sodium: 150 },
  'starbucks venti frappuccino': { calories: 420, carbs: 65, protein: 5, fat: 16, portion: '24 fl oz', fiber: 0, sugar: 62, sodium: 250 },
  'starbucks blueberry muffin': { calories: 380, carbs: 54, protein: 6, fat: 16, portion: '1 muffin', fiber: 2, sugar: 26, sodium: 420 },
  
  // Five Guys
  'five guys hamburger': { calories: 700, carbs: 40, protein: 43, fat: 43, portion: '1 burger', fiber: 2, sugar: 8, sodium: 430 },
  'five guys cheeseburger': { calories: 840, carbs: 40, protein: 47, fat: 55, portion: '1 burger', fiber: 2, sugar: 8, sodium: 1040 },
  'five guys regular fries': { calories: 620, carbs: 78, protein: 8, fat: 30, portion: 'regular', fiber: 6, sugar: 2, sodium: 245 },
  
  // In-N-Out
  'in n out hamburger': { calories: 390, carbs: 41, protein: 16, fat: 19, portion: '1 burger', fiber: 3, sugar: 10, sodium: 650 },
  'in n out cheeseburger': { calories: 480, carbs: 41, protein: 22, fat: 27, portion: '1 burger', fiber: 3, sugar: 10, sodium: 1000 },
  'in n out double double': { calories: 670, carbs: 41, protein: 37, fat: 41, portion: '1 burger', fiber: 3, sugar: 10, sodium: 1440 },
  'in n out animal style fries': { calories: 750, carbs: 41, protein: 18, fat: 54, portion: '1 serving', fiber: 2, sugar: 7, sodium: 1440 },
  
  // Combo meals (common additions)
  'combo meal upgrade medium': { calories: 530, carbs: 101, protein: 4, fat: 15, portion: 'medium fries + medium drink', fiber: 4, sugar: 58, sodium: 270 },
  'combo meal upgrade large': { calories: 800, carbs: 143, protein: 6, fat: 24, portion: 'large fries + large drink', fiber: 6, sugar: 77, sodium: 415 }
};

export const foodAnalysisService = {
  // Analyze food image using Google Gemini AI
  async analyzeFoodImage(imageUri) {
    try {
      console.log('🔍 Starting food analysis with Gemini for image:', imageUri);
      
      // Validate API key first
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        console.error('❌ No Gemini API key available for image analysis');
        return {
          success: false,
          error: 'API key not available',
          predictions: []
        };
      }
      
      console.log('✅ API key available for image analysis');
      
      // Convert image to base64
      console.log('🔄 Converting image to base64...');
      const base64Image = await this.convertImageToBase64(imageUri);
      console.log('✅ Image converted to base64, length:', base64Image.length);
      
      // Call Gemini API for intelligent food identification
      console.log('🔄 Calling Gemini Vision API...');
      const geminiResponse = await this.callGeminiVision(base64Image);
      console.log('✅ Gemini Vision API response received:', {
        hasCandidates: !!geminiResponse.candidates,
        candidatesLength: geminiResponse.candidates?.length || 0
      });
      
      // Extract food items from Gemini response
      console.log('🔄 Extracting food items from Gemini response...');
      const detectedFoods = this.extractFoodItemsFromGemini(geminiResponse);
      console.log('✅ Detected foods extracted:', {
        count: detectedFoods.length,
        foods: detectedFoods.map(f => ({ name: f.name, confidence: f.confidence }))
      });
      
      // Generate top 3 food predictions with enhanced accuracy
      console.log('🔄 Generating food predictions...');
      const predictions = this.generateFoodPredictions(detectedFoods);
      console.log('✅ Enhanced food predictions generated:', {
        count: predictions.length,
        predictions: predictions.map(p => ({ name: p.name, calories: p.calories, confidence: p.confidence }))
      });
      
      return {
        success: true,
        predictions: predictions,
        imageUri: imageUri,
        source: 'gemini-vision'
      };
      
    } catch (error) {
      console.error('❌ Food analysis error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Return fallback predictions if analysis fails completely
      console.log('🔄 Returning fallback predictions due to error');
      const fallbackPredictions = this.getTimeBasedFallbacks();
      
      return {
        success: false,
        error: error.message,
        predictions: fallbackPredictions,
        source: 'fallback-error'
      };
    }
  },

  // Analyze food from text description using AI
  async analyzeFoodText(textDescription) {
    try {
      console.log('🔍 Starting text-based food analysis for:', textDescription);
      
      const apiKey = getGeminiApiKey();
      console.log('🔧 API Key status:', {
        hasKey: !!apiKey,
        keyLength: apiKey ? apiKey.length : 0,
        platform: require('react-native').Platform.OS,
        isDev: __DEV__
      });
      
      // First check our fast food database for exact matches
      const fastFoodMatch = this.checkFastFoodDatabase(textDescription);
      if (fastFoodMatch.length > 0) {
        console.log('✅ Found exact fast food match, skipping AI call');
        return {
          success: true,
          predictions: fastFoodMatch,
          source: 'fast-food-database'
        };
      }
      
      // Check if API key is available before making AI call
      if (!apiKey) {
        console.warn('⚠️ Gemini API key not available, using basic fallback');
        const basicPrediction = this.createBasicFoodPrediction(textDescription);
        return {
          success: true,
          predictions: [basicPrediction],
          source: 'basic-fallback'
        };
      }
      
      // If no exact match, use Gemini AI for intelligent analysis
      console.log('🔍 No fast food match found, using Gemini AI...');
      const geminiResponse = await this.callGeminiText(textDescription);
      
      // Extract food items from Gemini response
      const detectedFoods = this.extractFoodItemsFromGemini(geminiResponse);
      
      // Generate enhanced predictions with portion estimation
      const predictions = this.generateFoodPredictions(detectedFoods);
      
      console.log('✅ Text analysis complete, generated predictions:', predictions.length);
      
      return {
        success: true,
        predictions: predictions,
        source: 'text-analysis'
      };
      
    } catch (error) {
      console.error('❌ Text food analysis failed:', error);
      console.error('❌ Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Try to provide a basic fallback even when everything fails
      try {
        console.log('🔄 Attempting emergency fallback for:', textDescription);
        const emergencyFallback = this.createBasicFoodPrediction(textDescription);
        return {
          success: true,
          predictions: [emergencyFallback],
          source: 'emergency-fallback',
          originalError: error.message
        };
      } catch (fallbackError) {
        console.error('❌ Even emergency fallback failed:', fallbackError);
        return {
          success: false,
          error: error.message,
          predictions: []
        };
      }
    }
  },

  // Create a basic food prediction when AI is not available
  createBasicFoodPrediction(textDescription) {
    const name = textDescription.charAt(0).toUpperCase() + textDescription.slice(1).toLowerCase();
    
    // Provide reasonable defaults based on common food types
    let calories = 200, carbs = 20, protein = 10, fat = 8;
    
    // Adjust based on food type keywords
    if (/chicken|fish|meat|beef|pork|turkey/i.test(textDescription)) {
      calories = 250; carbs = 0; protein = 30; fat = 12;
    } else if (/fruit|apple|banana|orange/i.test(textDescription)) {
      calories = 80; carbs = 20; protein = 1; fat = 0;
    } else if (/vegetable|salad|broccoli|carrot/i.test(textDescription)) {
      calories = 25; carbs = 5; protein = 2; fat = 0;
    } else if (/pasta|rice|bread|pizza/i.test(textDescription)) {
      calories = 350; carbs = 60; protein = 12; fat = 8;
    }
    
    return {
      name: `${name} (estimated)`,
      calories: calories,
      carbs: carbs,
      protein: protein,
      fat: fat,
      fiber: 2,
      sugar: 3,
      sodium: 100,
      confidence: 0.5,
      portion: 'estimated serving'
    };
  },

  // Check fast food database for exact matches (saves API calls and improves accuracy)
  checkFastFoodDatabase(textDescription) {
    const normalizedInput = textDescription.toLowerCase().trim();
    console.log('🍔 Checking fast food database for:', normalizedInput);
    
    // Create search variations
    const searchVariations = [
      normalizedInput,
      normalizedInput.replace(/\s+/g, ' '), // normalize spaces
      normalizedInput.replace(/mcdonalds?|mcd|mc d/g, 'mcdonalds'),
      normalizedInput.replace(/burger king|bk/g, 'burger king'),
      normalizedInput.replace(/kentucky fried|kfc/g, 'kfc'),
      normalizedInput.replace(/taco bell|tb/g, 'taco bell'),
    ];
    
    // Check for combo meals first (more complex matches)
    const comboPatterns = [
      /(\d+\s*piece.*nugget.*combo)|(\d+\s*piece.*nugget.*meal)/,
      /(big mac.*combo)|(big mac.*meal)/,
      /(whopper.*combo)|(whopper.*meal)/,
      /(quarter pounder.*combo)|(quarter pounder.*meal)/
    ];
    
    for (const pattern of comboPatterns) {
      if (pattern.test(normalizedInput)) {
        return this.handleComboMeal(normalizedInput);
      }
    }
    
    // Check for exact fast food matches
    for (const [key, nutrition] of Object.entries(FAST_FOOD_DATABASE)) {
      for (const searchTerm of searchVariations) {
        if (this.isStrongMatch(searchTerm, key)) {
          console.log('✅ Found fast food match:', key);
          return [{
            name: this.formatFoodName(key),
            portion: nutrition.portion,
            calories: nutrition.calories,
            carbs: nutrition.carbs,
            protein: nutrition.protein,
            fat: nutrition.fat,
            fiber: nutrition.fiber || 0,
            sugar: nutrition.sugar || 0,
            sodium: nutrition.sodium || 0,
            confidence: 0.95,
            category: 'fast-food',
            description: `${nutrition.portion} • Fast food restaurant item`
          }];
        }
      }
    }
    
    return []; // No matches found
  },

  // Handle combo meals by breaking them into components
  handleComboMeal(input) {
    console.log('🍟 Handling combo meal:', input);
    const results = [];
    
    // McDonald's 10-piece nugget combo example
    if (input.includes('10') && input.includes('nugget') && input.includes('mcdonalds')) {
      results.push(
        this.createFoodItem('mcdonalds 10 piece chicken nuggets', FAST_FOOD_DATABASE['mcdonalds 10 piece chicken nuggets']),
        this.createFoodItem('mcdonalds medium fries', FAST_FOOD_DATABASE['mcdonalds medium fries']),
        this.createFoodItem('mcdonalds coca cola medium', FAST_FOOD_DATABASE['mcdonalds coca cola medium'])
      );
    }
    // Add more combo meal patterns as needed
    
    return results;
  },

  // Check if search term strongly matches database key
  isStrongMatch(searchTerm, dbKey) {
    // Remove extra spaces and normalize
    const normalizedSearch = searchTerm.replace(/\s+/g, ' ').trim();
    const normalizedKey = dbKey.replace(/\s+/g, ' ').trim();
    
    // Exact match
    if (normalizedSearch === normalizedKey) return true;
    
    // Key contains all important words from search
    const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
    const keyWords = normalizedKey.split(' ');
    
    return searchWords.every(word => 
      keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
    );
  },

  // Create standardized food item from database entry
  createFoodItem(name, nutrition) {
    return {
      name: this.formatFoodName(name),
      portion: nutrition.portion,
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
      fiber: nutrition.fiber || 0,
      sugar: nutrition.sugar || 0,
      sodium: nutrition.sodium || 0,
      confidence: 0.95,
      category: 'fast-food',
      description: `${nutrition.portion} • Restaurant item`
    };
  },

  // Format food names for display
  formatFoodName(dbKey) {
    return dbKey
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Mcdonalds/g, "McDonald's")
      .replace(/Kfc/g, "KFC")
      .replace(/Bk/g, "Burger King");
  },

  // Convert image URI to base64
  async convertImageToBase64(imageUri) {
    try {
      console.log('🔄 Converting image to base64:', imageUri);
      console.log('🔍 Image URI details:', {
        length: imageUri.length,
        scheme: imageUri.split('://')[0],
        isFile: imageUri.startsWith('file://'),
        isContent: imageUri.startsWith('content://'),
        isAsset: imageUri.startsWith('asset://'),
        hasPath: imageUri.includes('/')
      });
      
      // Method 1: Try expo-file-system first
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
        
        console.log('✅ Base64 conversion successful with FileSystem, length:', base64.length);
        return base64;
      } catch (fsError) {
        console.warn('FileSystem base64 failed, trying fetch method:', fsError.message);
        
        // Method 2: Fallback to fetch + manual base64 conversion
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        console.log('🔍 Image fetch details:', {
          responseOk: response.ok,
          status: response.status,
          arrayBufferSize: arrayBuffer.byteLength,
          bytesLength: bytes.length
        });
        
        // Convert to base64 manually
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        const base64 = btoa(binary);
        console.log('✅ Base64 conversion successful with fetch, length:', base64.length);
        return base64;
      }
    } catch (error) {
      console.error('❌ Base64 conversion error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        imageUri: imageUri
      });
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  },

  // Call Gemini API for intelligent food identification
  async callGeminiVision(base64Image) {
    // Debug API key availability
    const apiKey = getGeminiApiKey();
    console.log('🔑 Image analysis API key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 8) + '***' : 'NONE',
      platform: require('react-native').Platform.OS,
      isDev: __DEV__
    });

    if (!apiKey) {
      throw new Error('Gemini API key not available for image analysis');
    }

    const prompt = `Identify the specific foods in this image. Be precise about food names and portions.

Return only JSON:
{"foods":[{"name":"specific food name","portion":"realistic serving","confidence":0.9,"nutrition":{"calories":200,"carbs":20,"protein":15,"fat":8,"fiber":3,"sugar":5,"sodium":100}}]}

Example: {"foods":[{"name":"grilled chicken breast","portion":"4 oz","confidence":0.95,"nutrition":{"calories":185,"carbs":0,"protein":35,"fat":4,"fiber":0,"sugar":0,"sodium":74}}]}`;

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
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      },
    };

    // Build API URL safely
    let apiUrl;
    try {
      apiUrl = getGeminiApiUrl();
      console.log('✅ API URL obtained successfully');
    } catch (urlError) {
      console.error('❌ Failed to get Gemini API URL:', urlError.message);
      throw new Error(`API URL generation failed: ${urlError.message}`);
    }
    
    console.log('🔄 Making Gemini API request with:', {
      apiUrl: apiUrl && typeof apiUrl === 'string' ? apiUrl.substring(0, 50) + '...' : 'INVALID_URL',
      imageSize: base64Image.length,
      promptLength: prompt.length
    });

    if (!apiUrl) {
      throw new Error('Failed to get Gemini API URL - API key may not be available');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🔍 Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error response:', errorData);
      throw new Error(`Gemini API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('✅ Gemini API response successful:', {
      hasCandidates: !!responseData.candidates,
      candidatesCount: responseData.candidates?.length || 0
    });

    return responseData;
  },

  // Call Gemini API for text-based food analysis
  async callGeminiText(textDescription) {
    // Check if API key is available dynamically
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error('❌ Gemini API key not available for text analysis');
      throw new Error('API key not configured. Please check your environment variables.');
    }

    const prompt = `Analyze this food description and provide detailed nutritional information: "${textDescription}"

PRIORITY INSTRUCTIONS:
1. For RESTAURANT/FAST FOOD items, use EXACT official nutrition data:
   - McDonald's 10-piece chicken nuggets = 420 calories, 25g carbs, 23g protein, 25g fat
   - McDonald's Big Mac = 550 calories, 45g carbs, 25g protein, 31g fat
   - McDonald's medium fries = 320 calories, 43g carbs, 4g protein, 15g fat
   - Burger King Whopper = 657 calories, 49g carbs, 28g protein, 40g fat
   - Subway 6-inch turkey = 280 calories, 46g carbs, 18g protein, 4g fat
   - Pizza Hut medium cheese slice = 220 calories, 26g carbs, 10g protein, 8g fat
   - Taco Bell Crunchy Taco = 170 calories, 13g carbs, 8g protein, 10g fat
   - KFC Original Recipe breast = 320 calories, 8g carbs, 29g protein, 19g fat
   - Chipotle chicken burrito bowl = 630 calories, 40g carbs, 45g protein, 24g fat

2. For COMBO MEALS, include ALL items:
   - "10 piece nugget combo" = nuggets + medium fries + medium drink
   - Total calories = 420 (nuggets) + 320 (fries) + 210 (medium coke) = 950 calories

3. BRAND RECOGNITION - Look for these patterns:
   - "mcdonalds", "mcdonald's", "mcd", "mc d" → McDonald's
   - "burger king", "bk", "whopper" → Burger King  
   - "kfc", "kentucky fried" → KFC
   - "taco bell", "tb" → Taco Bell
   - "subway", "sub" → Subway
   - "pizza hut", "dominos", "papa johns" → Pizza chains
   - "chipotle", "qdoba", "moe's" → Mexican chains
   - "starbucks", "dunkin" → Coffee chains

4. PORTION INTELLIGENCE:
   - If quantities mentioned (like "10 piece", "large fries"), use EXACTLY
   - For restaurant items, use STANDARD serving sizes
   - For homemade items, use realistic typical servings

5. ACCURACY PRIORITY:
   - Restaurant/fast food = Use official nutrition data (HIGH priority)
   - Packaged foods = Use label data when possible
   - Homemade = Use USDA standard recipes

FAST FOOD EXAMPLES:
- "10 piece chicken nuggets mcdonalds" = McDonald's 10-piece nuggets (420 cal)
- "big mac combo" = Big Mac (550) + medium fries (320) + medium drink (210) = 1080 cal
- "whopper meal" = Whopper (657) + medium fries (320) + medium drink (210) = 1187 cal

Format response as JSON:
{
  "foods": [
    {
      "name": "McDonald's 10-piece Chicken McNuggets",
      "portion": "10 pieces",
      "confidence": 0.95,
      "nutrition": {
        "calories": 420,
        "carbs": 25,
        "protein": 23,
        "fat": 25,
        "fiber": 2,
        "sugar": 0,
        "sodium": 540
      }
    }
  ]
}

For COMBO MEALS, list each item separately:
{
  "foods": [
    {
      "name": "McDonald's 10-piece Chicken McNuggets",
      "portion": "10 pieces",
      "confidence": 0.95,
      "nutrition": {...}
    },
    {
      "name": "McDonald's Medium French Fries", 
      "portion": "medium (115g)",
      "confidence": 0.95,
      "nutrition": {...}
    },
    {
      "name": "McDonald's Medium Coca-Cola",
      "portion": "medium (21 fl oz)", 
      "confidence": 0.95,
      "nutrition": {...}
    }
  ]
}

CRITICAL: For fast food, prioritize EXACT official nutrition data over estimates.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      },
    };

    try {
      console.log('🔍 Making Gemini API request for text analysis...');
      const apiUrl = getGeminiTextApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response:', response.status, errorText);
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Gemini API response received successfully');
      return result;
      
    } catch (networkError) {
      console.error('❌ Network error calling Gemini API:', networkError.message);
      throw new Error(`Network error: ${networkError.message}. Check your internet connection.`);
    }
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
                fat: Math.round(food.nutrition.fat || 0),
                fiber: Math.round(food.nutrition.fiber || 0),
                sugar: Math.round(food.nutrition.sugar || 0),
                sodium: Math.round(food.nutrition.sodium || 0)
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
    const topFoods = detectedFoods.slice(0, 15); // Consider more detections
    const highConfidenceFoods = topFoods.filter(food => food.confidence > 0.4); // Only include foods with >40% confidence
    
    console.log(`🎯 Processing ${highConfidenceFoods.length} high confidence foods (>40%) out of ${topFoods.length} total detections`);
    
    highConfidenceFoods.forEach((food, index) => {
      // Check if food has direct nutrition data from Gemini
        if (food.nutrition && food.nutrition.calories > 0) {
          // Use Gemini's nutritional analysis directly
          predictions.push({
            name: this.capitalizeWords(food.name),
            calories: food.nutrition.calories,
            carbs: food.nutrition.carbs,
            protein: food.nutrition.protein,
            fat: food.nutrition.fat,
            fiber: food.nutrition.fiber || 0,
            sugar: food.nutrition.sugar || 0,
            sodium: food.nutrition.sodium || 0,
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
              fiber: Math.round((nutritionInfo.fiber || 2) * portionMultiplier), // Default fiber estimate
              sugar: Math.round((nutritionInfo.sugar || 3) * portionMultiplier), // Default sugar estimate  
              sodium: Math.round((nutritionInfo.sodium || 100) * portionMultiplier), // Default sodium estimate
              calcium: Math.round((nutritionInfo.calcium || 50) * portionMultiplier), // Default calcium estimate
              iron: Math.round((nutritionInfo.iron || 1) * portionMultiplier), // Default iron estimate
              vitaminC: Math.round((nutritionInfo.vitaminC || 5) * portionMultiplier), // Default vitamin C estimate
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
              fiber: estimatedNutrition.fiber || 2,
              sugar: estimatedNutrition.sugar || 3,
              sodium: estimatedNutrition.sodium || 100,
              confidence: food.confidence * 0.8, // Slightly lower confidence for estimates
              description: 'AI-estimated nutrition',
              portionSize: 'Standard serving',
              detectionSources: ['gemini-estimate'],
              isEstimated: true
            });
          }
        }
    });

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
    let baseFiber = 3;
    let baseSugar = 5;
    let baseSodium = 150;
    
    // Adjust based on food type indicators
    if (name.includes('salad') || name.includes('vegetable') || name.includes('green')) {
      baseCalories = 80;
      baseCarbs = 15;
      baseProtein = 3;
      baseFat = 2;
      baseFiber = 6; // High fiber for vegetables
      baseSugar = 3;
      baseSodium = 50;
    } else if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || 
               name.includes('fish') || name.includes('protein')) {
      baseCalories = 250;
      baseCarbs = 5;
      baseProtein = 30;
      baseFat = 12;
      baseFiber = 0; // Meat has no fiber
      baseSugar = 0;
      baseSodium = 200;
    } else if (name.includes('pasta') || name.includes('rice') || name.includes('bread') || 
               name.includes('grain')) {
      baseCalories = 300;
      baseCarbs = 55;
      baseProtein = 8;
      baseFat = 4;
      baseFiber = 4; // Moderate fiber for grains
      baseSugar = 2;
      baseSodium = 100;
    } else if (name.includes('fruit')) {
      baseCalories = 80;
      baseCarbs = 20;
      baseProtein = 1;
      baseFat = 0.5;
      baseFiber = 4; // Moderate fiber for fruits
      baseSugar = 15; // High natural sugar
      baseSodium = 5;
    } else if (name.includes('cheese') || name.includes('dairy') || name.includes('milk')) {
      baseCalories = 150;
      baseCarbs = 6;
      baseProtein = 8;
      baseFat = 10;
      baseFiber = 0; // Dairy has no fiber
      baseSugar = 6; // Lactose
      baseSodium = 180;
    } else if (name.includes('fried') || name.includes('crispy') || name.includes('oil')) {
      baseCalories = 400;
      baseCarbs = 35;
      baseProtein = 15;
      baseFat = 25;
      baseFiber = 2;
      baseSugar = 3;
      baseSodium = 300; // High sodium for fried foods
    }
    
    // Adjust based on confidence (lower confidence = more conservative estimates)
    const confidenceAdjustment = confidence > 0.7 ? 1.0 : 0.8;
    
    return {
      calories: Math.round(baseCalories * confidenceAdjustment),
      carbs: Math.round(baseCarbs * confidenceAdjustment),
      protein: Math.round(baseProtein * confidenceAdjustment),
      fat: Math.round(baseFat * confidenceAdjustment),
      fiber: Math.round(baseFiber * confidenceAdjustment),
      sugar: Math.round(baseSugar * confidenceAdjustment),
      sodium: Math.round(baseSodium * confidenceAdjustment)
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
