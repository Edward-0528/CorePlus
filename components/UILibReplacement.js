// Replacement for react-native-ui-lib components
// This provides the same API but uses standard React Native components

import React from 'react';
import { Text as RNText, View as RNView, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { AppColors } from '../constants/AppColors';

// Replacement for react-native-ui-lib components
// This provides the same API but uses standard React Native components

import React from 'react';
import { Text as RNText, View as RNView, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { AppColors } from '../constants/AppColors';

// Helper function to extract ui-lib spacing and layout props
const extractUILibProps = (props) => {
  const {
    // Typography props
    h1, h2, h3, h4, h5, h6, body1, body2, caption,
    
    // Layout props
    flex, center, centerV, centerH, row, column,
    
    // Spacing props (ui-lib format: marginL-xs, marginR-md, etc.)
    ...spacingProps
  } = props;

  const style = {};
  
  // Handle flex
  if (flex) style.flex = typeof flex === 'number' ? flex : 1;
  if (center) {
    style.justifyContent = 'center';
    style.alignItems = 'center';
  }
  if (centerV) style.alignItems = 'center';
  if (centerH) style.justifyContent = 'center';
  if (row) style.flexDirection = 'row';
  if (column) style.flexDirection = 'column';

  // Handle spacing props (marginL-xs, marginR-md, etc.)
  Object.keys(spacingProps).forEach(key => {
    if (key.startsWith('margin') || key.startsWith('padding')) {
      const spacingValue = getSpacingValue(key);
      if (spacingValue !== null) {
        style[spacingValue.property] = spacingValue.value;
      }
    }
  });

  return style;
};

// Convert ui-lib spacing notation to React Native style
const getSpacingValue = (prop) => {
  const spacingMap = {
    'xs': 4,
    'sm': 8, 
    'md': 16,
    'lg': 24,
    'xl': 32
  };

  // Examples: marginL-xs, marginR-md, paddingT-lg, marginT-xs
  const regex = /^(margin|padding)([LRTBHV]?)-?(xs|sm|md|lg|xl)$/;
  const match = prop.match(regex);
  
  if (!match) return null;
  
  const [, type, direction, size] = match;
  const value = spacingMap[size] || spacingMap.md;
  
  let property;
  if (direction === 'L') property = `${type}Left`;
  else if (direction === 'R') property = `${type}Right`;
  else if (direction === 'T') property = `${type}Top`;
  else if (direction === 'B') property = `${type}Bottom`;
  else if (direction === 'H') property = `${type}Horizontal`;
  else if (direction === 'V') property = `${type}Vertical`;
  else property = type;
  
  return { property, value };
};

// Text component that replaces ui-lib Text with typography variants
export const Text = ({ 
  h1, h2, h3, h4, h5, h6,
  body1, body2, caption,
  color,
  style,
  children,
  ...props 
}) => {
  let fontSize = 16;
  let fontWeight = 'normal';
  
  // Typography variants
  if (h1) { fontSize = 32; fontWeight = 'bold'; }
  else if (h2) { fontSize = 28; fontWeight = 'bold'; }
  else if (h3) { fontSize = 24; fontWeight = 'bold'; }
  else if (h4) { fontSize = 20; fontWeight = 'bold'; }
  else if (h5) { fontSize = 18; fontWeight = '600'; }
  else if (h6) { fontSize = 16; fontWeight = '600'; }
  else if (body1) { fontSize = 16; }
  else if (body2) { fontSize = 14; }
  else if (caption) { fontSize = 12; }
  
  // Extract ui-lib spacing props
  const uiLibStyle = extractUILibProps(props);
  
  const textStyle = {
    fontSize,
    fontWeight,
    color: color || AppColors.textPrimary,
    ...uiLibStyle,
    ...style
  };
  
  // Remove ui-lib props from props passed to RNText
  const cleanProps = { ...props };
  delete cleanProps.h1; delete cleanProps.h2; delete cleanProps.h3; 
  delete cleanProps.h4; delete cleanProps.h5; delete cleanProps.h6;
  delete cleanProps.body1; delete cleanProps.body2; delete cleanProps.caption;
  delete cleanProps.flex; delete cleanProps.center; delete cleanProps.centerV; delete cleanProps.centerH;
  delete cleanProps.row; delete cleanProps.column;
  
  // Remove ui-lib spacing props
  Object.keys(cleanProps).forEach(key => {
    if (key.startsWith('margin') || key.startsWith('padding')) {
      if (getSpacingValue(key) !== null) {
        delete cleanProps[key];
      }
    }
  });
  
  return (
    <RNText style={textStyle} {...cleanProps}>
      {children}
    </RNText>
  );
};

// View component with ui-lib props support
export const View = ({ style, ...props }) => {
  const uiLibStyle = extractUILibProps(props);
  
  const cleanProps = { ...props };
  delete cleanProps.flex; delete cleanProps.center; delete cleanProps.centerV; delete cleanProps.centerH;
  delete cleanProps.row; delete cleanProps.column;
  
  // Remove ui-lib spacing props
  Object.keys(cleanProps).forEach(key => {
    if (key.startsWith('margin') || key.startsWith('padding')) {
      if (getSpacingValue(key) !== null) {
        delete cleanProps[key];
      }
    }
  });
  
  return (
    <RNView style={[uiLibStyle, style]} {...cleanProps} />
  );
};

// TouchableOpacity component with ui-lib props support  
export const TouchableOpacity = ({ style, ...props }) => {
  const uiLibStyle = extractUILibProps(props);
  
  const cleanProps = { ...props };
  delete cleanProps.flex; delete cleanProps.center; delete cleanProps.centerV; delete cleanProps.centerH;
  delete cleanProps.row; delete cleanProps.column;
  
  // Remove ui-lib spacing props
  Object.keys(cleanProps).forEach(key => {
    if (key.startsWith('margin') || key.startsWith('padding')) {
      if (getSpacingValue(key) !== null) {
        delete cleanProps[key];
      }
    }
  });
  
  return (
    <RNTouchableOpacity style={[uiLibStyle, style]} {...cleanProps} />
  );
};

// Colors object that matches ui-lib Colors structure
export const Colors = {
  primary: AppColors.primary,
  secondary: AppColors.secondary,
  success: AppColors.success,
  error: AppColors.error,
  warning: AppColors.warning,
  info: AppColors.info,
  
  // Background colors
  white: AppColors.backgroundPrimary,
  grey80: AppColors.backgroundSecondary,
  grey70: AppColors.surface,
  grey60: AppColors.border,
  grey50: AppColors.textSecondary,
  grey40: AppColors.textTertiary,
  grey30: AppColors.disabled,
  
  // Text colors
  dark10: AppColors.textPrimary,
  dark20: AppColors.textSecondary,
  dark30: AppColors.textTertiary,
  dark40: AppColors.disabled,
  
  // Common ui-lib colors
  blue30: AppColors.primary,
  green30: AppColors.success,
  red30: AppColors.error,
  yellow30: AppColors.warning,
  
  // Transparent
  transparent: 'transparent',
  
  // Function to get color with opacity (ui-lib compatibility)
  rgba: (color, alpha) => {
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
};

// Switch component (same as React Native Switch)
export { Switch } from 'react-native';

export default {
  Text,
  View,
  TouchableOpacity,
  Colors,
  Switch
};
