# Enhanced Recipe System Setup Guide

The Core+ app now includes a comprehensive recipe system with the following features:

## ✨ Features Implemented

### 🔍 **Advanced Recipe Search**
- Search by keywords, ingredients, or dietary restrictions
- Filter by nutrition criteria (low carb, low sodium, high protein, etc.)
- Diet-specific filters (vegetarian, vegan, keto, paleo, gluten-free, dairy-free)
- Quick filters for prep time and calorie limits

### 🥘 **Smart Pantry Management**
- Add ingredients manually or by scanning barcodes
- Find recipes based on available ingredients
- "What can I make?" functionality
- Ingredient inventory tracking

### ❤️ **Favorites & History**
- Save favorite recipes for quick access
- Automatic history tracking of viewed recipes
- Easy favoriting/unfavoriting with heart icon
- Persistent storage in database and local cache

### 📊 **Complete Nutrition Facts**
- Detailed nutrition information for every recipe
- Calories, macros (protein, carbs, fat), and micronutrients (fiber, sodium)
- Per-serving nutrition calculations
- Visual nutrition cards in recipe details

### 📱 **Modern UI/UX**
- Clean, intuitive 4-tab interface (Search, My Pantry, Favorites, History)
- Recipe cards with nutrition previews
- Detailed recipe view with ingredients and instructions
- Responsive design with proper loading states

## 🛠️ Technical Implementation

### **Database Tables Created**
- `user_favorite_recipes` - Store user's favorite recipes
- `user_recipe_history` - Track recently viewed recipes
- `user_ingredients` - Manage user's pantry/ingredients
- All tables include proper RLS (Row Level Security) policies

### **Recipe Service Integration**
- Spoonacular API integration for comprehensive recipe data
- Fallback recipes when API is unavailable
- Local caching for offline functionality
- Intelligent nutrition data extraction

### **Component Architecture**
- `EnhancedRecipeBrowserScreen.js` - Main recipe interface
- `RecipeDetailsModal` - Detailed recipe view
- `recipeService.js` - API and data management
- Integrated with existing `WorkingMinimalNutrition.js`

## 🚀 Setup Instructions

### 1. **API Configuration**
Add your Spoonacular API key to `.env`:
```env
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_api_key_here
```

Get a free API key at: https://spoonacular.com/food-api

### 2. **Database Setup**
Run the SQL migration script:
```bash
# Apply the recipe database schema
supabase db reset
# Or manually run: database/recipe_tables.sql
```

### 3. **Component Integration**
The enhanced recipe browser is automatically integrated into the app via the "Recipes" quick action button.

## 📋 Usage Guide

### **For Users:**

1. **Search Recipes:**
   - Tap "Recipes" in quick actions
   - Use search bar or apply filters
   - View detailed nutrition facts
   - Add recipes directly to your meals

2. **Manage Pantry:**
   - Switch to "My Pantry" tab
   - Add ingredients manually or scan barcodes
   - Find recipes you can make with available ingredients

3. **Save Favorites:**
   - Heart any recipe to save it
   - Access saved recipes in "Favorites" tab
   - Recently viewed recipes appear in "History" tab

4. **Add to Meals:**
   - Tap any recipe to view details
   - Review complete nutrition information
   - Tap "Add to My Meals" to include in your daily tracking

### **Key Benefits:**
- **Smart Discovery:** Find recipes based on your dietary needs and available ingredients
- **Nutrition Transparency:** Know exactly what you're eating with detailed nutrition facts
- **Meal Planning:** Save favorites and plan meals in advance
- **Seamless Integration:** Recipes automatically add to your daily nutrition tracking

## 🔧 Customization Options

### **Dietary Filters Available:**
- Vegetarian, Vegan, Ketogenic, Paleo
- Gluten-Free, Dairy-Free
- Low Carb (<30g), Low Sodium (<600mg)
- Low Calorie (<400), High Protein (>25g)
- Quick recipes (<20 min prep time)

### **Nutrition Data Tracked:**
- Calories, Protein, Carbohydrates, Fat
- Fiber, Sugar, Sodium
- Serving size and prep time
- Difficulty level and dietary tags

## 🆘 Troubleshooting

### **Common Issues:**

1. **"No recipes found"**
   - Check internet connection
   - Verify API key in `.env` file
   - Try broader search terms or fewer filters

2. **Pantry ingredients not saving**
   - Ensure user is logged in
   - Check database connection
   - Ingredients are cached locally as backup

3. **Recipe details not loading**
   - API rate limits may apply
   - Fallback to basic recipe info
   - Retry after a few minutes

### **Performance Notes:**
- Recipe search results are cached locally
- Favorite recipes sync across devices
- Ingredient scanning requires camera permissions
- Background sync keeps data updated

## 🎯 Future Enhancements

Potential additions for future versions:
- Recipe ratings and reviews
- Meal planning calendar integration
- Shopping list generation from recipes
- Custom recipe creation and sharing
- Advanced nutrition goal matching
- Recipe recommendations based on eating patterns

The enhanced recipe system transforms Core+ into a complete nutrition and meal planning platform! 🚀
