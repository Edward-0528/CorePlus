// Centralized App Colors Configuration
// This file defines all colors used throughout the Core+ app

export const AppColors = {
  // Primary brand colors (keeping the green accent the user likes)
  primary: '#6B8E23',  // Green accent
  primaryLight: '#8FBC8F',
  primaryDark: '#556B2F',
  
  // Semantic colors
  success: '#28A745',
  warning: '#FFC107', 
  danger: '#DC3545',
  info: '#17A2B8',
  
  // Light variants for backgrounds
  successLight: '#D4EDDA',
  warningLight: '#FFF3CD', 
  dangerLight: '#F8D7DA',
  
  // Additional semantic colors
  amber: '#FF9500',
  
  // Category colors
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  
  // Text colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textWhite: '#FFFFFF',
  
  // Background colors
  white: '#FFFFFF',
  background: '#F8F9FA',
  backgroundSecondary: '#F1F3F4',
  backgroundDark: '#343A40',
  
  // Border colors
  border: '#E9ECEF',
  borderLight: '#F0F0F0',
  borderDark: '#DEE2E6',
  
  // Status bar and navigation
  statusBarLight: 'dark-content',
  statusBarDark: 'light-content',
  
  // Additional utility colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Legacy Colors object for backward compatibility
export const Colors = {
  primary: AppColors.primary,
  workout: AppColors.workout,
  nutrition: AppColors.nutrition,
  account: AppColors.account,
  white: AppColors.white,
  black: '#000000',
  textPrimary: AppColors.textPrimary,
  textSecondary: AppColors.textSecondary,
  background: AppColors.background,
  border: AppColors.border,
};

// Color validation function
export const validateColor = (color) => {
  if (!color) return AppColors.textPrimary;
  
  // Check if it's a valid hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) return color;
  
  // Check if it's a named color in our palette
  if (AppColors[color]) return AppColors[color];
  
  // Check if it's a valid rgba color
  if (color.startsWith('rgba') || color.startsWith('rgb')) return color;
  
  // Default fallback
  console.warn(`Invalid color: ${color}, using default`);
  return AppColors.textPrimary;
};

// Color utility functions
export const colorWithOpacity = (color, opacity) => {
  if (!color) return AppColors.transparent;
  
  // If it's already rgba, don't modify
  if (color.includes('rgba')) return color;
  
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return color;
};

export default AppColors;
