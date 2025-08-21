import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mealService } from '../services/mealService';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';

export const useMealManager = () => {
  const { 
    dailyCalories, 
    dailyMacros,
    dailyMicros, 
    todaysMeals, 
    mealsLoading,
    addMeal: addMealToContext,
    deleteMeal: deleteMealFromContext,
    refreshMealsFromServer 
  } = useDailyCalories();

  const [mealHistory, setMealHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadedDates, setLoadedDates] = useState(new Set());

  // Helper function to format meals consistently
  const formatMeals = (meals) => {
    return meals.map(meal => ({
      id: meal.id,
      name: meal.meal_name || meal.name,
      calories: meal.calories || 0,
      carbs: meal.carbs || 0,
      protein: meal.protein || 0,
      fat: meal.fat || 0,
      fiber: meal.fiber || 0,
      sugar: meal.sugar || 0,
      sodium: meal.sodium || 0,
      method: meal.meal_method || meal.method,
      time: meal.meal_time ? formatMealTime(meal.meal_time) : formatMealTime(new Date()),
      date: meal.meal_date || meal.date,
      imageUri: meal.image_uri || meal.imageUri,
      confidence: meal.confidence_score || meal.confidence
    }));
  };

  // Helper function to format meal time
  const formatMealTime = (timeValue) => {
    try {
      if (!timeValue) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting meal time:', error);
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Lazy load meal history for specific dates
  const loadMealHistory = useCallback(async (dates = []) => {
    if (!dates.length) return;

    setHistoryLoading(true);
    try {
      const datesToLoad = dates.filter(date => !loadedDates.has(date));
      
      if (datesToLoad.length === 0) {
        setHistoryLoading(false);
        return; // All dates already loaded
      }

      console.log('📅 Loading meal history for dates:', datesToLoad);

      // Load from cache first
      const cachedData = {};
      for (const date of datesToLoad) {
        try {
          const cached = await AsyncStorage.getItem(`meals_${date}`);
          if (cached) {
            const rawMeals = JSON.parse(cached);
            cachedData[date] = formatMeals(rawMeals);
          }
        } catch (error) {
          console.warn(`Failed to load cached meals for ${date}:`, error);
        }
      }

      // Update state with cached data immediately
      if (Object.keys(cachedData).length > 0) {
        setMealHistory(prev => ({ ...prev, ...cachedData }));
        setLoadedDates(prev => new Set([...prev, ...Object.keys(cachedData)]));
      }

      // Load missing dates from server
      const uncachedDates = datesToLoad.filter(date => !cachedData[date]);
      
      if (uncachedDates.length > 0) {
        console.log('🌐 Fetching meals from server for dates:', uncachedDates);
        
        // Load meals for each date (could be optimized with a batch API call)
        for (const date of uncachedDates) {
          try {
            const result = await mealService.getMealsByDate(date);
            
            if (result.success) {
              const rawMeals = result.meals || [];
              const formattedMeals = formatMeals(rawMeals);
              
              // Update state with formatted meals
              setMealHistory(prev => ({ ...prev, [date]: formattedMeals }));
              setLoadedDates(prev => new Set([...prev, date]));
              
              // Cache the raw data (we'll format it when loading)
              await AsyncStorage.setItem(`meals_${date}`, JSON.stringify(rawMeals));
              
              console.log(`✅ Loaded ${formattedMeals.length} meals for ${date}`);
            }
          } catch (error) {
            console.error(`Error loading meals for ${date}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadMealHistory:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [loadedDates]);

  // Get meals for a specific date (from cache or trigger load)
  const getMealsForDate = useCallback(async (date) => {
    const today = new Date().toISOString().split('T')[0];
    
    // If requesting today's meals, return from context
    if (date === today) {
      return todaysMeals;
    }
    
    // Check if we have this date in history
    if (mealHistory[date]) {
      return mealHistory[date];
    }
    
    // Load if not available
    await loadMealHistory([date]);
    return mealHistory[date] || [];
  }, [mealHistory, todaysMeals, loadMealHistory]);

  // Get nutrition totals for a specific date
  const getNutritionTotalsForDate = useCallback(async (date) => {
    const meals = await getMealsForDate(date);
    
    return {
      calories: meals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      carbs: meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
      protein: meals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
      fat: meals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
      fiber: meals.reduce((sum, meal) => sum + (meal.fiber || 0), 0),
      sugar: meals.reduce((sum, meal) => sum + (meal.sugar || 0), 0),
      sodium: meals.reduce((sum, meal) => sum + (meal.sodium || 0), 0),
      mealCount: meals.length
    };
  }, [getMealsForDate]);

  // Get weekly nutrition summary (lazy loaded)
  const getWeeklyNutritionSummary = useCallback(async (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate date range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Load all dates (will use cache where available)
    await loadMealHistory(dates);
    
    // Calculate summary
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;
    let totalMeals = 0;
    
    const dailyData = [];
    
    for (const date of dates) {
      const totals = await getNutritionTotalsForDate(date);
      totalCalories += totals.calories;
      totalCarbs += totals.carbs;
      totalProtein += totals.protein;
      totalFat += totals.fat;
      totalFiber += totals.fiber;
      totalSugar += totals.sugar;
      totalSodium += totals.sodium;
      totalMeals += totals.mealCount;
      
      dailyData.push({
        date,
        ...totals
      });
    }
    
    return {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      totalFiber,
      totalSugar,
      totalSodium,
      totalMeals,
      averageDaily: {
        calories: Math.round(totalCalories / dates.length),
        carbs: Math.round(totalCarbs / dates.length),
        protein: Math.round(totalProtein / dates.length),
        fat: Math.round(totalFat / dates.length),
        fiber: Math.round(totalFiber / dates.length),
        sugar: Math.round(totalSugar / dates.length),
        sodium: Math.round(totalSodium / dates.length)
      },
      dailyData
    };
  }, [loadMealHistory, getNutritionTotalsForDate]);

  // Clear old cached data (keep last 30 days)
  const cleanupOldCache = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allKeys = await AsyncStorage.getAllKeys();
      const mealKeys = allKeys.filter(key => key.startsWith('meals_'));
      
      for (const key of mealKeys) {
        const dateStr = key.replace('meals_', '');
        const keyDate = new Date(dateStr);
        
        if (keyDate < thirtyDaysAgo) {
          await AsyncStorage.removeItem(key);
          console.log(`🗑️ Cleaned up old cache for ${dateStr}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
    }
  }, []);

  // Auto cleanup on mount (once per session)
  useEffect(() => {
    const cleanup = async () => {
      const lastCleanup = await AsyncStorage.getItem('last_cache_cleanup');
      const now = Date.now();
      
      // Cleanup once per day
      if (!lastCleanup || (now - parseInt(lastCleanup)) > 86400000) {
        await cleanupOldCache();
        await AsyncStorage.setItem('last_cache_cleanup', now.toString());
      }
    };
    
    cleanup();
  }, [cleanupOldCache]);

  return {
    // Today's data (from context)
    dailyCalories,
    dailyMacros,
    dailyMicros,
    todaysMeals,
    mealsLoading,
    
    // Historical data
    mealHistory,
    historyLoading,
    loadedDates,
    
    // Actions
    addMeal: addMealToContext,
    deleteMeal: deleteMealFromContext,
    refreshMealsFromServer,
    
    // Lazy loading functions
    loadMealHistory,
    getMealsForDate,
    getNutritionTotalsForDate,
    getWeeklyNutritionSummary,
    cleanupOldCache
  };
};
