import { Dimensions, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes for responsive design (based on iPhone 11 Pro)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scale function for width
const scaleWidth = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Scale function for height  
const scaleHeight = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

// Scale font sizes with a moderate factor to avoid extremely large/small text
const scaleFont = (size) => {
  const newSize = scaleWidth(size);
  return Math.max(12, Math.min(newSize, size * 1.2)); // Limit scaling between 12px and 120% of original
};

// Responsive spacing
const spacing = {
  xs: scaleWidth(4),
  sm: scaleWidth(8),
  md: scaleWidth(16),
  lg: scaleWidth(24),
  xl: scaleWidth(32),
  xxl: scaleWidth(48),
};

// Device type detection
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isLargeDevice = SCREEN_WIDTH >= 414;

// Responsive padding based on device size
const responsivePadding = {
  // Bumped up to create more left/right breathing room for forms and cards
  container: isSmallDevice ? 24 : isMediumDevice ? 28 : 32,
  content: isSmallDevice ? 14 : isMediumDevice ? 18 : 22,
  small: isSmallDevice ? 10 : isMediumDevice ? 14 : 18,
};

// Responsive font sizes
const fonts = {
  tiny: scaleFont(10),
  small: scaleFont(12),
  medium: scaleFont(14),
  regular: scaleFont(16),
  large: scaleFont(18),
  title: scaleFont(24),
  hero: scaleFont(32),
  logo: scaleFont(40),
};

// Safe area adjustments for different devices
const safeAreaAdjustment = {
  top: SCREEN_HEIGHT > 800 ? 20 : 10,
  bottom: SCREEN_HEIGHT > 800 ? 34 : 20,
};

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  scaleWidth,
  scaleHeight,
  scaleFont,
  spacing,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  responsivePadding,
  fonts,
  safeAreaAdjustment
};
