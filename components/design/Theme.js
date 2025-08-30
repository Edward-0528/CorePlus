import { Colors, Typography, Spacings, BorderRadiuses } from 'react-native-ui-lib';

// Define your beautiful color palette
export const AppColors = {
  // Primary Brand Colors
  primary: '#4A90E2',
  primaryLight: '#7BB0F0',
  primaryDark: '#2C5EAA',
  
  // Secondary Colors  
  secondary: '#50E3C2',
  secondaryLight: '#7FEBD3',
  secondaryDark: '#3BAF96',
  
  // Accent Colors
  accent: '#FF6B6B',
  accentLight: '#FF8E8E', 
  accentDark: '#E55555',
  
  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  gray: '#E9ECEF',
  mediumGray: '#6C757D',
  darkGray: '#495057',
  black: '#212529',
  
  // Status Colors
  success: '#28A745',
  warning: '#FFC107', 
  error: '#DC3545',
  info: '#17A2B8',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#E9ECEF',
  
  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textInverse: '#FFFFFF',
  
  // Functional Colors
  border: '#E9ECEF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Feature-specific Colors
  nutrition: '#50E3C2',
  workout: '#FF6B6B', 
  health: '#4A90E2',
  account: '#FFC107',
};

// Define typography
export const AppTypography = {
  // Headings
  h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  h6: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  
  // Body Text
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  body3: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  
  // Special
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '600', lineHeight: 16, letterSpacing: 1.5 },
};

// Define spacing
export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Define border radius
export const AppBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

// Configure UI-Lib with our design system
export const configureDesignSystem = () => {
  // Configure Colors
  Colors.loadColors(AppColors);
  
  // Configure Typography
  Typography.loadTypographies(AppTypography);
  
  // Configure Spacings
  Spacings.loadSpacings(AppSpacing);
  
  // Configure Border Radiuses
  BorderRadiuses.loadBorders(AppBorderRadius);
};

// Theme configuration object
export const theme = {
  colors: AppColors,
  typography: AppTypography,
  spacing: AppSpacing,
  borderRadius: AppBorderRadius,
};

export default theme;
