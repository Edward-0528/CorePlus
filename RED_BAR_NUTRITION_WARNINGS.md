# Red Bar Visual Indicators for Daily Intake Limits

## Overview
The nutrition tracking now includes visual warnings when daily intake limits are exceeded for any nutrient. Bars and gauges will turn red with warning indicators when you go over recommended daily values.

## Daily Goals & Limits

### Macronutrients
- **Calories**: 2000 cal (customizable goal)
- **Carbs**: 258g (~50% of calories)
- **Protein**: 125g (~25% of calories)
- **Fat**: 56g (~25% of calories)

### Micronutrients (Extended Nutrition)
- **Fiber**: 25g (FDA recommendation)
- **Sugar**: 50g (WHO recommendation for <10% of daily calories)
- **Sodium**: 2300mg (FDA recommendation)

## Visual Indicators

### 🔴 **Over Limit Indicators**
When any nutrient exceeds its daily goal:

1. **Progress Bars**: Turn from their normal color to **red (#FF6B6B)**
2. **Text Values**: Change to **red and bold** weight
3. **Warning Icon**: ⚠️ appears next to the value
4. **Circular Calorie Gauge**: Stroke and center value turn red

### 🟢 **Normal Indicators**
When within daily limits:
- **Carbs**: Light blue (#87CEEB)
- **Protein**: Light blue (#B0E0E6) 
- **Fat**: Light blue (#ADD8E6)
- **Fiber**: Light green (#90EE90)
- **Sugar**: Light pink (#FFB6C1)
- **Sodium**: Light purple (#DDA0DD)

## How It Works

### MacroBar Component
```javascript
// Automatically detects when value > goal
const isOverLimit = value > goal;
const barColor = isOverLimit ? '#FF6B6B' : color;
const textColor = isOverLimit ? '#FF6B6B' : '#8E8E93';
```

### CircularGauge Component
```javascript
// Changes color when calories exceed goal
const isOverGoal = value > goal;
const strokeColor = isOverGoal ? "#FF6B6B" : "#87CEEB";
const valueColor = isOverGoal ? "#FF6B6B" : "#1D1D1F";
```

## User Experience

### Real-Time Feedback
- Visual warnings appear immediately when logging meals that push you over limits
- Helps users make informed decisions about portion sizes and food choices
- Encourages balance throughout the day

### Educational Benefits
- Users learn appropriate daily intake levels for all nutrients
- Visual cues help develop better nutritional intuition
- Warning system promotes mindful eating habits

## Testing Scenarios

### Test Over-Limit Warnings
1. **High Calorie Test**: Log meals totaling >2000 calories
   - Circular gauge should turn red with ⚠️
   
2. **High Carbs Test**: Log high-carb meals >258g
   - Carbs bar should turn red
   
3. **High Sodium Test**: Log high-sodium foods >2300mg
   - Sodium bar (in expanded section) should turn red
   
4. **High Sugar Test**: Log sugary foods >50g
   - Sugar bar should turn red with warning

### Expected Behavior
- ✅ Bars change color immediately upon exceeding limits
- ✅ Warning icons (⚠️) appear in text values
- ✅ Text becomes bold and red when over limit
- ✅ Normal colors restore when back under limits
- ✅ All nutrients (carbs, protein, fat, fiber, sugar, sodium) have working limits

## Health Benefits
- **Calorie Management**: Prevents overeating
- **Macro Balance**: Encourages proper carb/protein/fat ratios
- **Heart Health**: Sodium limit warnings
- **Blood Sugar**: Sugar intake awareness
- **Digestive Health**: Fiber intake tracking

This feature transforms the nutrition tracker from a passive logging tool into an active health coaching system! 🎯
