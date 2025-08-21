# Fiber, Sugar, and Sodium Test Instructions

## Issues Fixed
1. **FoodSearchService**: Updated the `searchFoodSuggestions` method to include fiber, sugar, and sodium in the Gemini API prompt
2. **FoodSearchModal**: Added a second nutrition row to display fiber, sugar, and sodium values
3. **Validation**: Added proper validation and fallback values for extended nutrition fields

## What You Should See Now

### 1. Food Search Results
When you search for food items, you should now see:
- **First row**: Calories, Carbs, Protein, Fat
- **Second row**: Fiber, Sugar, Sodium, [empty space]

### 2. Test Scenarios

#### Test A: Search for "apple"
**Expected Results:**
- Should show fiber values (typically 3-4g for an apple)
- Sugar values (typically 15-20g for an apple)
- Low sodium values (typically 1-2mg for an apple)

#### Test B: Search for "pizza slice"
**Expected Results:**
- Should show moderate fiber (typically 2-3g)
- Some sugar (typically 3-5g)
- Higher sodium (typically 400-600mg)

#### Test C: Search for "chicken breast"
**Expected Results:**
- Should show very low fiber (0g)
- Very low sugar (0-1g)
- Moderate sodium (typically 50-100mg)

### 3. What to Look For

1. **In Search Results**: Each food card should display two rows of nutrition
2. **When Adding Meals**: The fiber, sugar, and sodium should be passed to the meal data
3. **In Meal History**: When you expand nutrition details, you should see fiber, sugar, and sodium
4. **In Daily Totals**: The daily micro totals should include fiber, sugar, and sodium

### 4. Debugging Steps

If values are still not showing:

1. **Check Console Logs**: Look for Gemini API responses in the console
2. **Inspect Meal Data**: Check if the meal objects contain fiber, sugar, sodium properties
3. **Database Check**: Verify the meals table has the fiber, sugar, sodium columns
4. **API Response**: Check if Gemini is actually returning these values in the JSON

### 5. Console Commands for Testing

Open the app and check the console for:
- `🔍 Searching for food: [query]`
- `🤖 Gemini raw response: [JSON response]`
- `✅ Parsed food data: [cleaned data]`
- `🍽️ Adding searched food to meals: [meal data]`

The meal data should include:
```javascript
{
  name: "Food Name",
  calories: 200,
  carbs: 30,
  protein: 15,
  fat: 8,
  fiber: 5,    // ← Should be present
  sugar: 10,   // ← Should be present  
  sodium: 300, // ← Should be present
  method: 'search'
}
```

## Expected Behavior
- All three nutrition entry methods (manual, photo, search) should now collect and store fiber, sugar, and sodium
- The UI should display these values in the expandable nutrition section
- Daily totals should include these micronutrients
- Database should store these values for future reference
