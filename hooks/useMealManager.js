import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mealService } from '../services/mealService';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { supabase } from '../supabaseConfig';

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

  // Clear all meal history state and cache (useful on login/logout)
  const clearMealHistory = useCallback(async () => {
    console.log('🧹 Clearing meal history state and cache');
    setMealHistory({});
    setLoadedDates(new Set());
    setHistoryLoading(false);
    
    // Clear recent meal cache (last 30 days) to ensure fresh data
    try {
      const today = new Date();
      for (let i = 0; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = await getMealCacheKey(dateStr);
        await AsyncStorage.removeItem(cacheKey);
      }
      console.log('✅ Cleared meal history cache');
    } catch (error) {
      console.warn('Error clearing meal cache:', error);
    }
  }, []);

  // Helper function to get user-specific cache key
  const getMealCacheKey = async (date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return `meals_${date}_${user.id}`;
      }
      return `meals_${date}`; // Fallback for backwards compatibility
    } catch (error) {
      console.warn('Failed to get user for cache key:', error);
      return `meals_${date}`; // Fallback
    }
  };

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
      if (!timeValue) return 'Unknown';
      
      // If it's already a formatted time string (HH:MM), return it
      if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}/.test(timeValue)) {
        return timeValue;
      }
      
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting meal time:', error);
      return 'Unknown';
    }
  };

  // Lazy load meal history for specific dates with reduced caching
  const loadMealHistory = useCallback(async (dates = []) => {
    if (!dates.length) return;

    // Check loaded dates inside the function to avoid dependency issues
    const currentlyLoadedDates = loadedDates;
    const datesToLoad = dates.filter(date => !currentlyLoadedDates.has(date));
    
    if (datesToLoad.length === 0) {
      return; // All dates already loaded, no need to set loading
    }

    setHistoryLoading(true);
    try {
      console.log('📅 Loading meal history for dates:', datesToLoad);

      // Reduce caching - only check cache for recent dates (last 7 days)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const cachedData = {};
      for (const date of datesToLoad) {
        const dateObj = new Date(date);
        // Only use cache for recent dates
        if (dateObj >= sevenDaysAgo) {
          try {
            const cacheKey = await getMealCacheKey(date);
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
              const rawMeals = JSON.parse(cached);
              cachedData[date] = formatMeals(rawMeals);
              console.log(`💾 Loaded ${rawMeals.length} meals from cache for ${date}`);
            }
          } catch (error) {
            console.warn(`Failed to load cached meals for ${date}:`, error);
          }
        }
      }

      // Update state with cached data immediately (for recent dates only)
      if (Object.keys(cachedData).length > 0) {
        setMealHistory(prev => ({ ...prev, ...cachedData }));
        setLoadedDates(prev => new Set([...prev, ...Object.keys(cachedData)]));
      }

      // Always fetch from server for better data freshness
      const uncachedDates = datesToLoad.filter(date => !cachedData[date]);
      
      // Process dates in smaller batches to avoid overwhelming the UI
      const batchSize = 5;
      for (let i = 0; i < uncachedDates.length; i += batchSize) {
        const batch = uncachedDates.slice(i, i + batchSize);
        console.log('🌐 Fetching meals from server for dates:', batch);
        
        // Process batch in parallel for better performance
        const promises = batch.map(async (date) => {
          try {
            const result = await mealService.getMealsByDate(date);
            
            if (result.success) {
              const rawMeals = result.meals || [];
              const formattedMeals = formatMeals(rawMeals);
              
              // Update state with formatted meals
              setMealHistory(prev => ({ ...prev, [date]: formattedMeals }));
              setLoadedDates(prev => new Set([...prev, date]));
              
              // Only cache recent data to avoid storage bloat
              const dateObj = new Date(date);
              if (dateObj >= sevenDaysAgo) {
                const cacheKey = await getMealCacheKey(date);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(rawMeals));
              }
              
              console.log(`✅ Loaded ${formattedMeals.length} meals for ${date}`);
              return { date, success: true, count: formattedMeals.length };
            }
            return { date, success: false, error: 'No data' };
          } catch (error) {
            console.error(`Error loading meals for ${date}:`, error);
            return { date, success: false, error: error.message };
          }
        });

        // Wait for batch to complete before processing next batch
        const results = await Promise.all(promises);
        
        // Small delay between batches to not overwhelm the UI
        if (i + batchSize < uncachedDates.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error in loadMealHistory:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []); // Remove loadedDates dependency to prevent recreation

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
    cleanupOldCache,
    clearMealHistory // Add this for clearing cache on login
  };
};
