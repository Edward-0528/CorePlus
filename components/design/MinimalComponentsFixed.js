import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Define colors directly to avoid RNUI color issues
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

// Minimal Card Component with thin borders
const MinimalCard = ({ 
  children, 
  gradient, 
  style,
  onPress,
  ...props 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  if (gradient) {
    return (
      <CardComponent onPress={onPress} style={[styles.minimalGradientCard, style]} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={styles.gradientFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </CardComponent>
    );
  }
  
  return (
    <CardComponent
      style={[styles.minimalCard, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Minimal Metric Row - single line design
const MinimalMetric = ({ 
  icon, 
  title, 
  value, 
  unit, 
  color = AppColors.primary,
  style,
  onPress,
  ...props 
}) => (
  <TouchableOpacity style={[styles.minimalMetric, style]} onPress={onPress} {...props}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.metricTitle, { marginLeft: 12 }]}>{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={[styles.metricUnit, { marginLeft: 4 }]}>{unit}</Text>}
      </View>
    </View>
    <View style={styles.thinLine} />
  </TouchableOpacity>
);

// Minimal Button - just text with underline
const MinimalButton = ({ 
  title, 
  onPress, 
  color = AppColors.primary, 
  style,
  ...props 
}) => (
  <TouchableOpacity 
    style={[styles.minimalButton, style]} 
    onPress={onPress}
    {...props}
  >
    <Text style={[styles.buttonText, { color }]}>{title}</Text>
    <View style={[styles.buttonUnderline, { backgroundColor: color }]} />
  </TouchableOpacity>
);

// Minimal Section Header
const MinimalSection = ({ title, action, onActionPress, style }) => (
  <View style={[styles.minimalSection, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.sectionLine} />
  </View>
);

// Minimal Stats Row - clean line layout
const MinimalStats = ({ stats }) => (
  <View style={styles.minimalStatsContainer}>
    {stats.map((stat, index) => (
      <View key={index} style={styles.statItem}>
        <Text style={[styles.statValue, { color: stat.color || AppColors.textPrimary }]}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
        {index < stats.length - 1 && <View style={styles.statDivider} />}
      </View>
    ))}
  </View>
);

// Minimal Progress Bar
const MinimalProgress = ({ 
  progress, 
  color = AppColors.primary, 
  height = 2,
  style 
}) => (
  <View style={[styles.progressContainer, { height }, style]}>
    <View style={[styles.progressTrack, { height }]} />
    <View 
      style={[
        styles.progressFill, 
        { 
          width: `${Math.min(progress, 100)}%`, 
          backgroundColor: color,
          height 
        }
      ]} 
    />
  </View>
);

// Minimal Quick Action - just icon and text
const MinimalAction = ({ 
  icon, 
  title, 
  color = AppColors.primary,
  onPress,
  style 
}) => (
  <TouchableOpacity style={[styles.minimalAction, style]} onPress={onPress}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={styles.actionText}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  minimalCard: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 16,
    marginVertical: 4,
  },
  minimalGradientCard: {
    borderRadius: 4,
    marginVertical: 4,
    overflow: 'hidden',
  },
  gradientFill: {
    padding: 16,
    borderRadius: 4,
  },
  minimalMetric: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  metricTitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  metricUnit: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  thinLine: {
    height: 1,
    backgroundColor: AppColors.border,
    marginTop: 8,
    width: '100%',
  },
  minimalButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonUnderline: {
    height: 1,
    marginTop: 2,
    width: '100%',
  },
  minimalSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    color: AppColors.primary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
  },
  minimalStatsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 1,
    backgroundColor: AppColors.border,
  },
  progressContainer: {
    position: 'relative',
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressTrack: {
    backgroundColor: AppColors.backgroundSecondary,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 1,
  },
  minimalAction: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  actionText: {
    textAlign: 'center',
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
});

export default {
  MinimalCard,
  MinimalMetric,
  MinimalButton,
  MinimalSection,
  MinimalStats,
  MinimalProgress,
  MinimalAction,
};
