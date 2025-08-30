# Swipe to Delete Meals Feature

## Overview
The app now supports swipe-to-delete functionality for meals in both the "Today" view and meal history. Users can easily remove accidentally added meals with a simple swipe gesture.

## How it Works

### User Experience
1. **Swipe to Reveal**: Swipe left or right on any meal item
2. **Visual Feedback**: 
   - A red "Delete" background appears as you swipe
   - Haptic feedback occurs when reaching the deletion threshold
3. **Delete Action**: Swipe far enough (50% of screen width) to trigger deletion
4. **Confirmation**: The meal is immediately removed with haptic feedback

### Implementation Details

#### Components Used
- `SwipeToDeleteWrapper`: Handles the swipe gesture and visual feedback
- `WorkingMinimalNutrition`: Main component with meal listings
- `DailyCaloriesContext`: Provides the `deleteMeal` function

#### Where It's Available
- **Today's Recent Meals**: In the "Today" tab, all recent meals can be swiped to delete
- **Meal History**: In the "Meals" tab, all historical meals can be swiped to delete

#### Technical Features
- **Gesture Recognition**: Uses react-native-gesture-handler for smooth swipe detection
- **Haptic Feedback**: Provides tactile feedback during interaction
- **Visual Indicators**: Red background with "Delete" text appears during swipe
- **Threshold-based**: Requires deliberate swipe (50% screen width) to prevent accidental deletions
- **Snap-back Animation**: If swipe doesn't reach threshold, item snaps back to original position

## Code Implementation

### Key Functions
```javascript
// Delete handler
const handleDeleteMeal = async (mealId) => {
  try {
    await deleteMeal(mealId);
  } catch (error) {
    console.error('Error deleting meal:', error);
  }
};
```

### Meal Wrapping
Each meal item is wrapped with:
```javascript
<SwipeToDeleteWrapper 
  onDelete={() => handleDeleteMeal(meal.id)}
  enabled={true}
>
  {/* Meal content */}
</SwipeToDeleteWrapper>
```

## User Benefits
1. **Quick Correction**: Easy removal of accidentally logged meals
2. **Intuitive Interface**: Standard iOS/Android swipe-to-delete pattern
3. **Safe Operation**: Threshold prevents accidental deletions
4. **Immediate Feedback**: Visual and haptic feedback confirm actions
5. **History Management**: Clean up meal history easily

## Accessibility
- The feature maintains all existing accessibility features
- Haptic feedback assists users with visual impairments
- Clear visual indicators during swipe actions
