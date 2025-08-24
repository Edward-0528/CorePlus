import AsyncStorage from '@react-native-async-storage/async-storage';

class WorkoutCacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.maxCacheSize = 50; // Maximum cache entries
  }

  // Generate cache key
  generateKey(type, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `workout_${type}_${paramString}`;
  }

  // Check if cache entry is valid
  isCacheValid(entry) {
    if (!entry || !entry.timestamp) return false;
    return (Date.now() - entry.timestamp) < this.cacheTimeout;
  }

  // Get from memory cache
  getFromMemoryCache(key) {
    const entry = this.cache.get(key);
    if (this.isCacheValid(entry)) {
      console.log(`🏃‍♂️ Cache HIT (memory): ${key}`);
      return entry.data;
    }
    return null;
  }

  // Set memory cache
  setMemoryCache(key, data) {
    // Implement simple LRU by removing oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`🏃‍♂️ Cache SET (memory): ${key}`);
  }

  // Get from persistent cache
  async getFromPersistentCache(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const entry = JSON.parse(cached);
        if (this.isCacheValid(entry)) {
          console.log(`🏃‍♂️ Cache HIT (persistent): ${key}`);
          // Also set in memory cache for faster access
          this.setMemoryCache(key, entry.data);
          return entry.data;
        } else {
          // Remove expired cache
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Error reading from persistent cache:', error);
    }
    return null;
  }

  // Set persistent cache
  async setPersistentCache(key, data) {
    try {
      const entry = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
      console.log(`🏃‍♂️ Cache SET (persistent): ${key}`);
    } catch (error) {
      console.warn('Error writing to persistent cache:', error);
    }
  }

  // Get cached data (checks memory first, then persistent)
  async get(type, params = {}) {
    const key = this.generateKey(type, params);
    
    // Try memory cache first
    let data = this.getFromMemoryCache(key);
    if (data) return data;

    // Try persistent cache
    data = await this.getFromPersistentCache(key);
    if (data) return data;

    console.log(`🏃‍♂️ Cache MISS: ${key}`);
    return null;
  }

  // Set cached data (both memory and persistent)
  async set(type, data, params = {}) {
    const key = this.generateKey(type, params);
    
    // Set in memory cache
    this.setMemoryCache(key, data);
    
    // Set in persistent cache (async, don't wait)
    this.setPersistentCache(key, data).catch(console.warn);
  }

  // Invalidate specific cache entry
  async invalidate(type, params = {}) {
    const key = this.generateKey(type, params);
    
    // Remove from memory cache
    this.cache.delete(key);
    
    // Remove from persistent cache
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🏃‍♂️ Cache INVALIDATED: ${key}`);
    } catch (error) {
      console.warn('Error invalidating persistent cache:', error);
    }
  }

  // Clear all workout caches
  async clearAll() {
    // Clear memory cache
    this.cache.clear();
    
    // Clear persistent cache (workout-related only)
    try {
      const keys = await AsyncStorage.getAllKeys();
      const workoutKeys = keys.filter(key => key.startsWith('workout_'));
      if (workoutKeys.length > 0) {
        await AsyncStorage.multiRemove(workoutKeys);
      }
      console.log('🏃‍♂️ All workout caches cleared');
    } catch (error) {
      console.warn('Error clearing persistent cache:', error);
    }
  }

  // Preload critical data
  async preload(criticalDataFetchers) {
    const promises = Object.entries(criticalDataFetchers).map(async ([type, fetcher]) => {
      try {
        const cachedData = await this.get(type);
        if (!cachedData) {
          console.log(`🏃‍♂️ Preloading: ${type}`);
          const data = await fetcher();
          await this.set(type, data);
          return { type, success: true, data };
        }
        return { type, success: true, data: cachedData, fromCache: true };
      } catch (error) {
        console.warn(`🏃‍♂️ Preload failed for ${type}:`, error);
        return { type, success: false, error };
      }
    });

    return await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const workoutCacheService = new WorkoutCacheService();
