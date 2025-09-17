// Custom theme system without react-native-ui-lib dependency
import { AppColors } from '../../constants/AppColors';

const Typography = {
  text: { fontSize: 16 },
  caption: { fontSize: 12 },
  title: { fontSize: 20 },
};

const Spacings = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
};

const BorderRadiuses = {
  br10: 10,
  br20: 20,
  br30: 30,
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
  // Since we removed react-native-ui-lib, we don't need to load colors
  // Colors are available directly from our constants
  console.log('🎨 Design system configured with custom colors');
  
  // Our colors are already available through imports
  // No need for Colors.loadColors() - just use AppColors directly
  
  // Custom typography system (no ui-lib dependency)
  // Typography configuration removed - using direct styles
  
  // Custom spacing system (no ui-lib dependency)  
  // Spacing configuration removed - using direct values
  
  // Custom border radius system (no ui-lib dependency)
  // Border radius configuration removed - using direct values
  
  return {
    colors: AppColors,
    typography: AppTypography,
    spacing: AppSpacing,
    borderRadius: AppBorderRadius
  };
};

// Theme configuration object
export const theme = {
  colors: AppColors,
  typography: AppTypography,
  spacing: AppSpacing,
  borderRadius: AppBorderRadius,
};

export default theme;
