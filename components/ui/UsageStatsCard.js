import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppContext } from '../../contexts/AppContext';
import { AppColors } from '../../constants/AppColors';
import usageTrackingService from '../../services/usageTrackingService';
import subscriptionService from '../../services/subscriptionService';

const UsageStatsCard = ({ onUpgradePress }) => {
  const { isPremium, subscriptionInfo, refreshSubscriptionInfo } = useSubscription();
  const { user } = useAppContext();
  const [usageStats, setUsageStats] = useState({
    aiScans: { used: 0, limit: 20, remaining: 20 },
    manualSearches: { used: 0, limit: 20, remaining: 20 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, [subscriptionInfo.limits, isPremium]); // Also refresh when isPremium changes

  useEffect(() => {
    // Add debug logging
    console.log('🔍 [UsageStatsCard] Subscription status:', {
      isPremium,
      tier: subscriptionInfo.tier,
      isActive: subscriptionInfo.isActive,
      limits: subscriptionInfo.limits
    });
  }, [isPremium, subscriptionInfo]);

    const loadUsageStats = useCallback(async () => {
    try {
      console.log('📊 [UsageStatsCard] Loading usage stats...');
      console.log('📊 [UsageStatsCard] Current subscription from context:', subscriptionInfo);
      
      // Get current usage limits based on subscription
      const usageLimits = subscriptionService.getUsageLimits();
      console.log('📊 [UsageStatsCard] Got usage limits from service:', usageLimits);
      
      const stats = await usageTrackingService.getUsageStats(usageLimits);
      console.log('📊 [UsageStatsCard] Got usage stats:', stats);
      
      setUsageStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('📊 [UsageStatsCard] Error loading usage stats:', error);
      setLoading(false);
    }
  }, [subscriptionInfo]);

  const renderProgressBar = (used, limit, color = AppColors.primary) => {
    if (limit === -1) {
      // Unlimited - show infinity symbol
      return (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFull, { backgroundColor: color }]} />
          <View style={styles.infinityContainer}>
            <Ionicons name="infinite" size={16} color={AppColors.white} />
          </View>
        </View>
      );
    }

    const percentage = Math.min((used / limit) * 100, 100);
    const isNearLimit = percentage > 80;
    const barColor = isNearLimit ? AppColors.error : color;

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${percentage}%`, 
                backgroundColor: barColor 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {used}/{limit}
        </Text>
      </View>
    );
  };

  const renderUsageItem = (title, icon, used, limit, remaining) => {
    const isNearLimit = limit !== -1 && remaining <= 5;
    const isAtLimit = limit !== -1 && remaining === 0;

    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <View style={styles.usageIconContainer}>
            <Ionicons name={icon} size={20} color={AppColors.primary} />
          </View>
          <View style={styles.usageInfo}>
            <Text style={styles.usageTitle}>{title}</Text>
            {limit === -1 ? (
              <Text style={styles.usageSubtitle}>Unlimited</Text>
            ) : (
              <Text style={[
                styles.usageSubtitle,
                isAtLimit && { color: AppColors.error },
                isNearLimit && !isAtLimit && { color: AppColors.warning }
              ]}>
                {remaining} remaining this month
              </Text>
            )}
          </View>
        </View>
        {renderProgressBar(used, limit)}
        {isAtLimit && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={onUpgradePress}
          >
            <Text style={styles.upgradeButtonText}>Upgrade for Unlimited</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading usage stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Usage</Text>
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={14} color={AppColors.white} />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.upgradeHeaderButton}
            onPress={onUpgradePress}
          >
            <Text style={styles.upgradeHeaderText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderUsageItem(
        "AI Food Scans",
        "camera",
        usageStats.aiScans.used,
        usageStats.aiScans.limit,
        usageStats.aiScans.remaining
      )}

      {renderUsageItem(
        "AI Manual Searches",
        "search",
        usageStats.manualSearches.used,
        usageStats.manualSearches.limit,
        usageStats.manualSearches.remaining
      )}

      {!isPremium && (
        <View style={styles.upgradePrompt}>
          <Text style={styles.upgradePromptText}>
            Get unlimited scans and searches with Core+ Pro
          </Text>
        </View>
      )}

      {/* Debug buttons - only show in development */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug (Dev Only)</Text>
          <View style={styles.debugButtons}>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={async () => {
                await usageTrackingService.setUsageForTesting('ai_scans', 18);
                loadUsageStats();
              }}
            >
              <Text style={styles.debugButtonText}>Set Scans: 18/20</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={async () => {
                await usageTrackingService.setUsageForTesting('manual_searches', 19);
                loadUsageStats();
              }}
            >
              <Text style={styles.debugButtonText}>Set Searches: 19/20</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={() => {
                console.log('🔄 [UsageStatsCard] Force refreshing...');
                loadUsageStats();
              }}
            >
              <Text style={styles.debugButtonText}>Refresh Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Production refresh button for subscription testing */}
      {!__DEV__ && (
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={async () => {
            console.log('🔄 [UsageStatsCard] Manual refresh requested');
            
            // Debug: Show current subscription service state
            const debugInfo = subscriptionService.getDebugInfo();
            console.log('🔍 [UsageStatsCard] Current service state:', debugInfo);
            
            // First refresh subscription status
            await refreshSubscriptionInfo();
            // Then refresh usage stats
            loadUsageStats();
          }}
        >
          <Ionicons name="refresh" size={16} color={AppColors.primary} />
          <Text style={styles.refreshText}>Refresh Usage</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeHeaderButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeHeaderText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usageInfo: {
    flex: 1,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.text,
    marginBottom: 2,
  },
  usageSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  progressBarContainer: {
    position: 'relative',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: AppColors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarFull: {
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  infinityContainer: {
    position: 'absolute',
    top: 0,
    right: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    position: 'absolute',
    top: -20,
    right: 0,
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  upgradePrompt: {
    backgroundColor: AppColors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradePromptText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  debugContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.lightGray,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: AppColors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
  },
  debugButtonText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: AppColors.lightGray,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 12,
    color: AppColors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
};

export default UsageStatsCard;
