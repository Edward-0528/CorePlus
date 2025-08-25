import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { useSubscription } from '../contexts/SubscriptionContext';

// Higher-order component for premium feature gating
export const withPremiumAccess = (Component, featureName, options = {}) => {
  return (props) => {
    const { requiresPremium } = useSubscription();
    
    const handlePress = (originalOnPress) => {
      const hasAccess = requiresPremium(featureName, options.showAlert !== false);
      
      if (hasAccess && originalOnPress) {
        originalOnPress();
      }
    };

    // If component has onPress, wrap it with premium check
    if (props.onPress) {
      return (
        <Component 
          {...props} 
          onPress={() => handlePress(props.onPress)}
        />
      );
    }

    return <Component {...props} />;
  };
};

// Premium Feature Gate Component
export const PremiumGate = ({ 
  children, 
  featureName, 
  showUpgrade = true,
  upgradeText = "Upgrade to unlock this feature",
  fallback = null
}) => {
  const { canAccessFeature, showUpgradeModal } = useSubscription();
  
  const hasAccess = canAccessFeature(featureName);
  
  if (hasAccess) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  if (!showUpgrade) {
    return null;
  }
  
  return (
    <View style={styles.premiumGateContainer}>
      <View style={styles.premiumGateContent}>
        <Ionicons name="star-outline" size={24} color="#FFD700" />
        <Text style={styles.premiumGateTitle}>Premium Feature</Text>
        <Text style={styles.premiumGateText}>{upgradeText}</Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={showUpgradeModal}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Usage Limit Display Component
export const UsageLimitDisplay = ({ 
  featureName, 
  displayName,
  compact = false 
}) => {
  const { subscriptionInfo, checkDailyUsage } = useSubscription();
  const [usage, setUsage] = React.useState(null);
  
  React.useEffect(() => {
    const loadUsage = async () => {
      const usageData = await checkDailyUsage(featureName, false);
      setUsage(usageData);
    };
    
    loadUsage();
  }, [featureName]);
  
  const limits = subscriptionInfo.limits;
  const limit = limits[featureName];
  
  if (limit === -1 || !usage) {
    return null; // Unlimited or loading
  }
  
  const percentage = (usage.used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.used >= limit;
  
  if (compact) {
    return (
      <View style={styles.compactUsageContainer}>
        <Text style={[
          styles.compactUsageText,
          isAtLimit && styles.limitReachedText
        ]}>
          {usage.used}/{limit}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.usageContainer}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageTitle}>{displayName}</Text>
        <Text style={[
          styles.usageCount,
          isAtLimit && styles.limitReachedText
        ]}>
          {usage.used}/{limit}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${Math.min(percentage, 100)}%` },
            isAtLimit && styles.progressFillDanger,
            isNearLimit && !isAtLimit && styles.progressFillWarning
          ]} 
        />
      </View>
      
      {isAtLimit && (
        <Text style={styles.limitMessage}>
          Daily limit reached. Upgrade for unlimited access!
        </Text>
      )}
    </View>
  );
};

// Premium Feature Button
export const PremiumFeatureButton = ({ 
  onPress, 
  featureName, 
  children, 
  style,
  disabled = false,
  ...props 
}) => {
  const { canAccessFeature, showUpgradeModal } = useSubscription();
  
  const hasAccess = canAccessFeature(featureName);
  
  const handlePress = () => {
    if (hasAccess) {
      onPress && onPress();
    } else {
      showUpgradeModal();
    }
  };
  
  return (
    <TouchableOpacity
      style={[style, (!hasAccess || disabled) && styles.disabledButton]}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      <View style={styles.buttonContent}>
        {children}
        {!hasAccess && (
          <Ionicons 
            name="star" 
            size={16} 
            color="#FFD700" 
            style={styles.premiumIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Daily Usage Feature Button (for features with daily limits)
export const DailyUsageButton = ({ 
  onPress, 
  featureName, 
  children, 
  style,
  disabled = false,
  showUsage = false,
  ...props 
}) => {
  const { useFeature } = useSubscription();
  
  const handlePress = async () => {
    const result = await useFeature(featureName);
    
    if (result.success && onPress) {
      onPress();
    }
  };
  
  return (
    <View>
      <TouchableOpacity
        style={[style, disabled && styles.disabledButton]}
        onPress={handlePress}
        disabled={disabled}
        {...props}
      >
        {children}
      </TouchableOpacity>
      
      {showUsage && (
        <UsageLimitDisplay featureName={featureName} compact />
      )}
    </View>
  );
};

// Subscription Status Badge
export const SubscriptionBadge = ({ size = 'normal' }) => {
  const { subscriptionInfo, getCurrentTier, SUBSCRIPTION_TIERS } = useSubscription();
  
  const tier = getCurrentTier();
  
  if (tier === SUBSCRIPTION_TIERS.FREE) {
    return null;
  }
  
  const isSmall = size === 'small';
  
  return (
    <View style={[
      styles.subscriptionBadge,
      tier === SUBSCRIPTION_TIERS.PRO && styles.proBadge,
      tier === SUBSCRIPTION_TIERS.ELITE && styles.eliteBadge,
      isSmall && styles.smallBadge
    ]}>
      <Ionicons 
        name="star" 
        size={isSmall ? 10 : 12} 
        color="#FFFFFF" 
      />
      <Text style={[
        styles.badgeText,
        isSmall && styles.smallBadgeText
      ]}>
        {tier.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  premiumGateContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    margin: spacing.md,
    overflow: 'hidden',
  },
  premiumGateContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  premiumGateTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  premiumGateText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usageContainer: {
    padding: spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  usageTitle: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  usageCount: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  limitReachedText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressFillWarning: {
    backgroundColor: '#FF9500',
  },
  progressFillDanger: {
    backgroundColor: '#FF6B6B',
  },
  limitMessage: {
    fontSize: fonts.tiny,
    color: '#FF6B6B',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactUsageContainer: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  compactUsageText: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIcon: {
    marginLeft: spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  proBadge: {
    backgroundColor: '#4682B4',
  },
  eliteBadge: {
    backgroundColor: '#9B59B6',
  },
  smallBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  smallBadgeText: {
    fontSize: 8,
    marginLeft: 2,
  },
});

export default {
  withPremiumAccess,
  PremiumGate,
  UsageLimitDisplay,
  PremiumFeatureButton,
  DailyUsageButton,
  SubscriptionBadge
};
