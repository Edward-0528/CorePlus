import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

const Spacings = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20 };
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Minimal Card Component
export const BeautifulCard = ({ 
  children, 
  gradient, 
  style,
  onPress,
  ...props 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  if (gradient) {
    return (
      <CardComponent onPress={onPress} style={style} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={[styles.minimalGradientCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </CardComponent>
    );
  }
  
  return (
    <View
      style={[styles.minimalCard, style]}
      onPress={onPress}
      {...props}
    >
      {children}
    </View>
  );
};

// Metric Card Component
export const MetricCard = ({ 
  icon, 
  title, 
  value, 
  unit, 
  color = Colors.primary,
  onPress,
  progress,
  style
}) => (
  <BeautifulCard onPress={onPress} style={[styles.metricCard, style]}>
    <View row centerV spread>
      <View>
        <View row centerV marginB-xs>
          <Ionicons name={icon} size={20} color={color} style={{ marginRight: 8 }} />
          <Text body2 color={Colors.textSecondary}>{title}</Text>
        </View>
        <View row centerV>
          <Text h4 color={Colors.textPrimary}>{value}</Text>
          {unit && <Text body2 color={Colors.textSecondary} marginL-xs>{unit}</Text>}
        </View>
      </View>
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: Colors.gray }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(progress, 100)}%`, backgroundColor: color }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  </BeautifulCard>
);

// Action Button Component
export const ActionButton = ({ 
  icon, 
  title, 
  subtitle,
  color = Colors.primary,
  onPress,
  style,
  gradient
}) => {
  if (gradient) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.actionButton, style]} activeOpacity={0.8}>
        <LinearGradient
          colors={gradient}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={24} color={Colors.white} />
          <Text h6 color={Colors.white} marginT-xs>{title}</Text>
          {subtitle && <Text caption color={Colors.white} marginT-xs>{subtitle}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.actionButton, { backgroundColor: color }, style]}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={24} color={Colors.white} />
      <Text h6 color={Colors.white} marginT-xs>{title}</Text>
      {subtitle && <Text caption color={Colors.white} marginT-xs>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

// Section Header Component
export const SectionHeader = ({ 
  title, 
  subtitle, 
  action, 
  onActionPress,
  style 
}) => (
  <View row centerV spread style={[styles.sectionHeader, style]}>
    <View flex>
      <Text h5 color={Colors.textPrimary}>{title}</Text>
      {subtitle && <Text body2 color={Colors.textSecondary} marginT-xs>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onActionPress}>
        <Text button color={Colors.primary}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Stats Row Component
export const StatsRow = ({ stats, style }) => (
  <View row style={[styles.statsRow, style]}>
    {stats.map((stat, index) => (
      <View key={index} flex center style={[
        styles.statItem,
        index < stats.length - 1 && styles.statItemBorder
      ]}>
        <Text h4 color={stat.color || Colors.primary}>{stat.value}</Text>
        <Text caption color={Colors.textSecondary} marginT-xs>{stat.label}</Text>
      </View>
    ))}
  </View>
);

// Quick Action Component
export const QuickAction = ({ 
  icon, 
  label, 
  color = Colors.primary,
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.quickAction, { backgroundColor: `${color}15` }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={24} color={color} />
    <Text caption color={color} marginT-xs style={{ textAlign: 'center' }}>{label}</Text>
  </TouchableOpacity>
);

// Empty State Component
export const EmptyState = ({ 
  icon, 
  title, 
  subtitle, 
  actionText,
  onActionPress,
  style 
}) => (
  <View center style={[styles.emptyState, style]}>
    <Ionicons name={icon} size={64} color={Colors.textLight} />
    <Text h5 color={Colors.textSecondary} marginT-md center>{title}</Text>
    {subtitle && <Text body2 color={Colors.textLight} marginT-xs center>{subtitle}</Text>}
    {actionText && onActionPress && (
      <TouchableOpacity 
        style={styles.emptyStateAction}
        onPress={onActionPress}
      >
        <Text button color={Colors.primary}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadiuses.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Spacings.md,
  },
  gradientCard: {
    borderRadius: BorderRadiuses.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: Spacings.md,
  },
  metricCard: {
    minHeight: 80,
  },
  progressContainer: {
    marginLeft: Spacings.md,
  },
  progressBar: {
    width: 60,
    height: 6,
    borderRadius: BorderRadiuses.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadiuses.xs,
  },
  actionButton: {
    padding: Spacings.md,
    borderRadius: BorderRadiuses.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    padding: Spacings.md,
    borderRadius: BorderRadiuses.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
    width: '100%',
  },
  sectionHeader: {
    marginBottom: Spacings.md,
    paddingHorizontal: Spacings.md,
  },
  statsRow: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadiuses.md,
    padding: Spacings.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    paddingVertical: Spacings.sm,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  quickAction: {
    padding: Spacings.md,
    borderRadius: BorderRadiuses.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    aspectRatio: 1,
  },
  emptyState: {
    padding: Spacings.xxl,
  },
  emptyStateAction: {
    marginTop: Spacings.lg,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadiuses.sm,
  },
});

export default {
  BeautifulCard,
  MetricCard,
  ActionButton,
  SectionHeader,
  StatsRow,
  QuickAction,
  EmptyState,
};
