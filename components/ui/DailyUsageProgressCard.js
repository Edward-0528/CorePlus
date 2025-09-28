import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, responsivePadding } from '../utils/responsive';
import { useSubscription } from '../contexts/SubscriptionContext';

const DailyUsageProgressCard = () => {
  const { subscriptionInfo, checkDailyUsage, getCurrentTier, SUBSCRIPTION_TIERS } = useSubscription();
  const [usageData, setUsageData] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Features that have daily limits to track
  const dailyLimitFeatures = [
    {
      name: 'aiScansPerDay',
      displayName: 'AI Food Scans',
      icon: 'camera-outline',
      color: '#007AFF',
      description: 'Daily photo scans for nutrition analysis'
    },
    // Add more features with daily limits here as needed
  ];

  useEffect(() => {
    loadUsageData();
  }, [subscriptionInfo]);

  const loadUsageData = async () => {
    setLoading(true);
    const newUsageData = {};
    
    for (const feature of dailyLimitFeatures) {
      try {
        const usage = await checkDailyUsage(feature.name, false);
        newUsageData[feature.name] = usage;
      } catch (error) {
        console.error(`Error loading usage for ${feature.name}:`, error);
        newUsageData[feature.name] = { used: 0, limit: 0, canUse: true };
      }
    }
    
    setUsageData(newUsageData);
    setLoading(false);
  };

  const getCurrentTierName = () => {
    const tier = getCurrentTier();
    switch (tier) {
      case SUBSCRIPTION_TIERS.PRO:
        return 'Pro';
      case SUBSCRIPTION_TIERS.ELITE:
        return 'Elite';
      default:
        return 'Free';
    }
  };

  const renderProgressBar = (used, limit, color) => {
    if (limit === -1) {
      // Unlimited - show full green bar
      return (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: '#34C759', width: '100%' }]} />
        </View>
      );
    }

    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = used >= limit;

    let progressColor = color;
    if (isAtLimit) {
      progressColor = '#FF3B30';
    } else if (isNearLimit) {
      progressColor = '#FF9500';
    }

    return (
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: progressColor, 
              width: `${percentage}%` 
            }
          ]} 
        />
      </View>
    );
  };

  const renderFeatureUsage = (feature) => {
    const usage = usageData[feature.name];
    if (!usage) return null;

    const { used, limit } = usage;
    const isUnlimited = limit === -1;
    const isAtLimit = used >= limit && limit !== -1;

    return (
      <View key={feature.name} style={styles.featureContainer}>
        <View style={styles.featureHeader}>
          <View style={styles.featureInfo}>
            <Ionicons 
              name={feature.icon} 
              size={20} 
              color={feature.color} 
              style={styles.featureIcon}
            />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureName}>{feature.displayName}</Text>
              {expanded && (
                <Text style={styles.featureDescription}>{feature.description}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.usageCountContainer}>
            <Text style={[
              styles.usageCount,
              isAtLimit && styles.limitReachedText
            ]}>
              {isUnlimited ? 'Unlimited' : `${used}/${limit}`}
            </Text>
            {!isUnlimited && isAtLimit && (
              <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {renderProgressBar(used, limit, feature.color)}

        {/* Limit reached message */}
        {!isUnlimited && isAtLimit && (
          <Text style={styles.limitMessage}>
            Daily limit reached! Upgrade to unlock unlimited access.
          </Text>
        )}
      </View>
    );
  };

  // Don't show if user has unlimited access to all features
  const hasLimitsToShow = dailyLimitFeatures.some(feature => {
    const usage = usageData[feature.name];
    return usage && usage.limit !== -1;
  });

  if (!hasLimitsToShow && !loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="speedometer-outline" size={20} color="#007AFF" />
          <Text style={styles.headerTitle}>Daily Usage</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{getCurrentTierName()}</Text>
          </View>
        </View>
        
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#8E8E93" 
        />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading usage data...</Text>
        </View>
      ) : (
        <>
          {/* Always show first feature in collapsed view */}
          {!expanded && dailyLimitFeatures.length > 0 && (
            renderFeatureUsage(dailyLimitFeatures[0])
          )}

          {/* Show all features when expanded */}
          {expanded && (
            <View style={styles.expandedContent}>
              {dailyLimitFeatures.map(renderFeatureUsage)}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.9)',
    marginLeft: spacing.sm,
  },
  tierBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  tierText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.small,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '300',
  },
  expandedContent: {
    padding: 0,
    paddingTop: 0,
  },
  featureContainer: {
    marginBottom: spacing.md,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureName: {
    fontSize: fonts.small,
    fontWeight: '300',
    color: 'rgba(0, 0, 0, 0.85)',
  },
  featureDescription: {
    fontSize: fonts.tiny,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 2,
    fontWeight: '300',
  },
  usageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageCount: {
    fontSize: fonts.small,
    fontWeight: '300',
    color: 'rgba(0, 0, 0, 0.7)',
    marginRight: spacing.xs,
  },
  limitReachedText: {
    color: '#FF3B30',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  limitMessage: {
    fontSize: fonts.tiny,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default DailyUsageProgressCard;
