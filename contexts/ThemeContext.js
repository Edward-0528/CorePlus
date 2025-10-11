import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

// Dark mode color scheme
export const DarkColors = {
  primary: '#6B8E23',
  primaryLight: '#8FBC8F',
  primaryDark: '#556B2F',
  white: '#121212',
  black: '#FFFFFF',
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  surface: '#2D2D2D',
  surfaceSecondary: '#373737',
  border: '#404040',
  borderLight: '#4A4A4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#808080',
  textMuted: '#606060',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  nutrition: '#8FBC8F',
  workout: '#FF6B6B',
  account: '#FFC107',
  danger: '#DC3545',
  // Status bar and navigation
  statusBarStyle: 'light',
  navigationBarStyle: 'dark',
};

// Light mode color scheme (existing)
export const LightColors = {
  primary: '#6B8E23',
  primaryLight: '#8FBC8F',
  primaryDark: '#556B2F',
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  border: '#E9ECEF',
  borderLight: '#F1F3F4',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textMuted: '#CED4DA',
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  nutrition: '#8FBC8F',
  workout: '#FF6B6B',
  account: '#FFC107',
  danger: '#DC3545',
  // Status bar and navigation
  statusBarStyle: 'dark',
  navigationBarStyle: 'light',
};

const THEME_STORAGE_KEY = '@CorePlus:theme_preference';

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // If no preference saved, use system preference
        const systemTheme = Appearance.getColorScheme();
        setIsDarkMode(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system preference
      const systemTheme = Appearance.getColorScheme();
      setIsDarkMode(systemTheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
      console.log('🎨 Theme switched to:', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (darkMode) => {
    try {
      setIsDarkMode(darkMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
      console.log('🎨 Theme set to:', darkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const currentColors = isDarkMode ? DarkColors : LightColors;

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    colors: currentColors,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
