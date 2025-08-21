import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mealService } from '../services/mealService';
import { useAppContext } from './AppContext';

const DailyCaloriesContext = createContext();

export const DailyCaloriesProvider = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ carbs: 0, protein: 0, fat: 0 });
  const [dailyMicros, setDailyMicros] = useState({ fiber: 0, sugar: 0, sodium: 0 });
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [lastCacheUpdate, setLastCacheUpdate] = useState(null);

  // Cache keys
  const TODAY_MEALS_KEY = `meals_${new Date().toISOString().split('T')[0]}`;
  const LAST_CACHE_KEY = 'last_meal_cache_update';

  // Load cached meals only when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCachedMeals();
    } else {
      // Clear meals when user is not authenticated
      setTodaysMeals([]);
      setDailyCalories(0);
      setDailyMacros({ carbs: 0, protein: 0, fat: 0 });
      setDailyMicros({ fiber: 0, sugar: 0, sodium: 0 });
    }
  }, [isAuthenticated]);

  const loadCachedMeals = async () => {
    // Don't try to load if user is not authenticated
    if (!isAuthenticated) {
      console.log('⏭️ Skipping meal load - user not authenticated');
      return;
    }

    try {
      setMealsLoading(true);
      
      // Try to load from cache first
      const cachedMeals = await AsyncStorage.getItem(TODAY_MEALS_KEY);
      const cachedUpdateTime = await AsyncStorage.getItem(LAST_CACHE_KEY);
      
      if (cachedMeals) {
        const meals = JSON.parse(cachedMeals);
        updateMealState(meals);
        setLastCacheUpdate(cachedUpdateTime);
        console.log('✅ Loaded meals from cache:', meals.length, 'meals');
      }

      // Check if cache is stale (older than 5 minutes) or empty
      const shouldRefresh = !cachedUpdateTime || 
        (Date.now() - parseInt(cachedUpdateTime)) > 300000 || // 5 minutes
        !cachedMeals;

      if (shouldRefresh) {
        await refreshMealsFromServer();
      }
    } catch (error) {
      console.error('Error loading cached meals:', error);
      // Only try server fallback if authenticated
      if (isAuthenticated) {
        await refreshMealsFromServer();
      }
    } finally {
      setMealsLoading(false);
    }
  };

  const refreshMealsFromServer = async () => {
    // Don't try to fetch if user is not authenticated
    if (!isAuthenticated) {
      console.log('⏭️ Skipping meal fetch - user not authenticated');
      return;
    }

    try {
      const result = await mealService.getTodaysMeals();
      
      if (result.success) {
        const meals = result.meals || [];
        updateMealState(meals);
        
        // Cache the fresh data
        await AsyncStorage.setItem(TODAY_MEALS_KEY, JSON.stringify(meals));
        await AsyncStorage.setItem(LAST_CACHE_KEY, Date.now().toString());
        setLastCacheUpdate(Date.now().toString());
        
        console.log('✅ Refreshed meals from server:', meals.length, 'meals');
      }
    } catch (error) {
      // Only log authentication errors as warnings, not errors
      if (error.message?.includes('not authenticated')) {
        console.log('⏭️ Skipping meal fetch - user not authenticated');
      } else {
        console.error('Error refreshing meals from server:', error);
      }
    }
  };

  const updateMealState = (meals) => {
    // Format meals to match UI expectations
    const formattedMeals = meals.map(meal => {
      const formattedTime = meal.meal_time ? formatMealTime(meal.meal_time) : 'No time recorded';
      
      return {
        id: meal.id,
        name: meal.meal_name || meal.name, // Handle both database and formatted meals
        calories: meal.calories || 0,
        carbs: meal.carbs || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        sugar: meal.sugar || 0,
        sodium: meal.sodium || 0,
        method: meal.meal_method || meal.method,
        // Use actual meal time from database, don't fall back to current time
        time: formattedTime,
        date: meal.meal_date || meal.date,
        imageUri: meal.image_uri || meal.imageUri,
        confidence: meal.confidence_score || meal.confidence
      };
    });
    
    setTodaysMeals(formattedMeals);
    
    // Calculate totals
    const totalCalories = formattedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalCarbs = formattedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalProtein = formattedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalFat = formattedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    const totalFiber = formattedMeals.reduce((sum, meal) => sum + (meal.fiber || 0), 0);
    const totalSugar = formattedMeals.reduce((sum, meal) => sum + (meal.sugar || 0), 0);
    const totalSodium = formattedMeals.reduce((sum, meal) => sum + (meal.sodium || 0), 0);
    
    setDailyCalories(totalCalories);
    setDailyMacros({ carbs: totalCarbs, protein: totalProtein, fat: totalFat });
    setDailyMicros({ fiber: totalFiber, sugar: totalSugar, sodium: totalSodium });
  };

  // Helper function to format meal time
  const formatMealTime = (timeValue) => {
    try {
      if (!timeValue) {
        console.warn('No time value provided for meal');
        return 'No time';
      }
      
      // If timeValue is in HH:mm:ss format (string from database)
      if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
        // Create a date object for today with the provided time
        const today = new Date();
        const [hours, minutes, seconds] = timeValue.split(':');
        today.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
        
        return today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If timeValue is a full date string
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format for meal time:', timeValue);
        return 'Invalid time';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting meal time:', error, 'timeValue:', timeValue);
      return 'Error parsing time';
    }
  };

  const addMeal = async (newMeal) => {
    // Check authentication before attempting to add meal
    if (!isAuthenticated) {
      console.log('⏭️ Cannot add meal - user not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Add to server
      const result = await mealService.addMeal(newMeal);
      
      if (result.success) {
        // Get fresh data from server to ensure consistency
        await refreshMealsFromServer();
        
        return { success: true, meal: result.meal };
      }
      
      return result;
    } catch (error) {
      console.error('Error adding meal:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteMeal = async (mealId) => {
    // Check authentication before attempting to delete meal
    if (!isAuthenticated) {
      console.log('⏭️ Cannot delete meal - user not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await mealService.deleteMeal(mealId);
      
      if (result.success) {
        // Update local state immediately
        const updatedMeals = todaysMeals.filter(meal => meal.id !== mealId);
        updateMealState(updatedMeals);
        
        // Update cache
        await AsyncStorage.setItem(TODAY_MEALS_KEY, JSON.stringify(updatedMeals));
        await AsyncStorage.setItem(LAST_CACHE_KEY, Date.now().toString());
        
        return { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return { success: false, error: error.message };
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(TODAY_MEALS_KEY);
      await AsyncStorage.removeItem(LAST_CACHE_KEY);
      setTodaysMeals([]);
      setDailyCalories(0);
      setDailyMacros({ carbs: 0, protein: 0, fat: 0 });
      setDailyMicros({ fiber: 0, sugar: 0, sodium: 0 });
      setLastCacheUpdate(null);
    } catch (error) {
      console.error('Error clearing meal cache:', error);
    }
  };

  const value = {
    // Data
    dailyCalories,
    dailyMacros,
    dailyMicros,
    todaysMeals,
    mealsLoading,
    lastCacheUpdate,
    
    // Actions
    setDailyCalories,
    addMeal,
    deleteMeal,
    refreshMealsFromServer,
    clearCache,
    loadCachedMeals
  };

  return (
    <DailyCaloriesContext.Provider value={value}>
      {children}
    </DailyCaloriesContext.Provider>
  );
};

export const useDailyCalories = () => {
  const context = useContext(DailyCaloriesContext);
  if (context === undefined) {
    throw new Error('useDailyCalories must be used within a DailyCaloriesProvider');
  }
  return context;
};