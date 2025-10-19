import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import subscriptionService from '../../services/subscriptionService';
import AppColors from '../../constants/AppColors';

/**
 * Development component for testing subscription functionality
 * Shows in development AND production builds for testing RevenueCat
 */
const SubscriptionDebugger = () => {
  const { user } = useAppContext();
  const { subscriptionInfo, refreshSubscriptionInfo } = useSubscription();

  // Show in development OR production (for RevenueCat testing since it doesn't work in Expo Go)
  const shouldShowDebugger = __DEV__ || process.env.NODE_ENV !== 'test';
  
  if (!shouldShowDebugger) {
    return null;
  }

  const handleResetSubscription = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    Alert.alert(
      'Reset Subscription',
      'This will clear all subscription data for the current user. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await subscriptionService.resetSubscriptionForTesting(user.id);
              if (success) {
                await refreshSubscriptionInfo();
                Alert.alert('Success', 'Subscription reset successfully');
              } else {
                Alert.alert('Error', 'Failed to reset subscription');
              }
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset subscription');
            }
          }
        }
      ]
    );
  };

  const handleForceRefresh = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      console.log('🔄 [DEBUG] Starting force refresh...');
      
      // Step 1: Force refresh RevenueCat service
      const { revenueCatService } = require('../../services/revenueCatService');
      await revenueCatService.forceRefreshSubscriptionStatus();
      
      // Step 2: Force refresh subscription service
      await subscriptionService.forceRefreshSubscription(user.id);
      
      // Step 3: Refresh context
      await refreshSubscriptionInfo();
      
      // Step 4: Get fresh status for verification
      const freshStatus = await revenueCatService.getSubscriptionStatus();
      console.log('🔍 [DEBUG] Fresh subscription status:', freshStatus);
      
      Alert.alert('Success', `Subscription refreshed from RevenueCat\n\nNew Status: ${freshStatus.status}\nActive: ${freshStatus.isActive}`);
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', `Failed to refresh subscription: ${error.message}`);
    }
  };

  const showSubscriptionInfo = () => {
    const info = `
Current Status:
• Tier: ${subscriptionInfo.tier}
• Active: ${subscriptionInfo.isActive}
• Product ID: ${subscriptionInfo.productId || 'None'}
• Expires: ${subscriptionInfo.expiresAt || 'Never'}
• Environment: ${subscriptionService.isSandboxEnvironment() ? 'Sandbox' : 'Production'}
• User ID: ${user?.id}
    `.trim();

    Alert.alert('Subscription Debug Info', info);
  };

  const runSimpleDebug = async () => {
    try {
      const { simpleSubscriptionDebug } = await import('../../simpleSubscriptionDebug');
      const result = await simpleSubscriptionDebug();
      
      const message = result.subscribed 
        ? `✅ YES - YOU ARE SUBSCRIBED!\n\nCustomer ID: ${result.revenueCatCustomerId}\nActive: ${result.activeEntitlements?.join(', ') || 'None'}`
        : `❌ NO - NOT SUBSCRIBED\n\n${result.error || 'No active entitlements found'}`;
      
      Alert.alert('Subscription Status', message);
    } catch (error) {
      Alert.alert('Error', `Debug failed: ${error.message}`);
    }
  };

  const runRevenueCatDebug = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    try {
      console.log('🔍 [DEBUG] Starting comprehensive RevenueCat debug...');
      
      const { revenueCatService } = require('../../services/revenueCatService');
      
      // Step 1: Check initialization
      console.log('Step 1: RevenueCat initialization status:', revenueCatService.isInitialized);
      
      // Step 2: Force refresh customer info
      const customerInfo = await revenueCatService.refreshCustomerInfo();
      console.log('Step 2: Customer info:', {
        userId: customerInfo?.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo?.entitlements?.active || {}),
        hasActiveSubscription: revenueCatService.hasActiveSubscription()
      });
      
      // Step 3: Get detailed subscription status
      const status = await revenueCatService.getSubscriptionStatus();
      console.log('Step 3: Subscription status:', status);
      
      // Step 4: Check subscription service status
      const serviceInfo = subscriptionService.getSubscriptionInfo();
      console.log('Step 4: Service info:', serviceInfo);
      
      const debugInfo = `
RevenueCat Debug Results:
• Initialized: ${revenueCatService.isInitialized}
• User ID: ${customerInfo?.originalAppUserId || 'None'}
• Active Entitlements: ${Object.keys(customerInfo?.entitlements?.active || {}).join(', ') || 'None'}
• Has Active Sub: ${revenueCatService.hasActiveSubscription()}
• Status: ${status.status}
• Service Tier: ${serviceInfo.tier}
• Context Tier: ${subscriptionInfo.tier}
      `.trim();

      Alert.alert('RevenueCat Debug Results', debugInfo);
      
    } catch (error) {
      console.error('RevenueCat debug error:', error);
      Alert.alert('Debug Error', `Failed to run debug: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Subscription Debugger</Text>
      <Text style={styles.subtitle}>
        {__DEV__ ? 'Development Mode' : 'Production Testing'}
      </Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current Tier:</Text>
        <Text style={[styles.statusValue, { 
          color: subscriptionInfo.isActive ? AppColors.success : AppColors.textSecondary 
        }]}>
          {subscriptionInfo.tier.toUpperCase()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={showSubscriptionInfo}>
          <Text style={styles.buttonText}>Show Debug Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={runRevenueCatDebug}>
          <Text style={styles.buttonText}>RevenueCat Debug</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={runSimpleDebug}>
          <Text style={styles.buttonText}>SIMPLE: AM I SUBSCRIBED?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleForceRefresh}>
          <Text style={styles.buttonText}>Force Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleResetSubscription}
        >
          <Text style={[styles.buttonText, styles.dangerText]}>Reset Subscription</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.warning}>
        ⚠️ Reset clears database records but cannot cancel active sandbox purchases
        {!__DEV__ && '\n🏗️ Production build - for RevenueCat testing only'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#fd7e14',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fd7e14',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerText: {
    color: 'white',
  },
  warning: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default SubscriptionDebugger;
