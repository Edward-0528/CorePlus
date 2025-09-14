import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import DailyUsageProgressCard from './DailyUsageProgressCard';
import WhiteMotionBackground from './common/WhiteMotionBackground';
import UpgradeModal from './UpgradeModal';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const AccountScreen = ({ user, onLogout, loading, styles }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { 
    isPremiumUser, 
    subscriptionTier, 
    subscriptionStatus, 
    daysUntilExpiration 
  } = useFeatureAccess();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const handleUpgradePress = () => {
    setShowUpgradeModal(true);
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, go to your App Store account settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open App Store', onPress: () => {
          // This would open the App Store subscription management
          console.log('Opening App Store subscription management');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WhiteMotionBackground>
        <ScrollView style={localStyles.container}>
          <View style={localStyles.content}>
            {/* Daily Usage Section */}
            <DailyUsageProgressCard />
            
            {/* Subscription Section */}
            <View style={localStyles.section}>
              <Text style={localStyles.cardTitle}>Subscription</Text>
              
              {/* Current Plan Status */}
              <View style={localStyles.subscriptionCard}>
                <View style={localStyles.subscriptionHeader}>
                  <View style={localStyles.planInfo}>
                    <Text style={localStyles.planName}>
                      {isPremiumUser ? 'Core+ Pro' : 'Core+ Free'}
                    </Text>
                    <Text style={localStyles.planStatus}>
                      {isPremiumUser ? 'Active' : 'Free Plan'}
                    </Text>
                  </View>
                  <View style={[
                    localStyles.planBadge, 
                    isPremiumUser ? localStyles.proBadge : localStyles.freeBadge
                  ]}>
                    <Ionicons 
                      name={isPremiumUser ? "star" : "lock-closed"} 
                      size={16} 
                      color={isPremiumUser ? "#FFD700" : "#999"} 
                    />
                  </View>
                </View>

                {/* Subscription Details */}
                {isPremiumUser && daysUntilExpiration !== null && (
                  <Text style={localStyles.expirationText}>
                    {daysUntilExpiration > 0 
                      ? `Renews in ${daysUntilExpiration} days`
                      : 'Subscription expired'
                    }
                  </Text>
                )}

                {/* Action Button */}
                <TouchableOpacity 
                  style={[
                    localStyles.subscriptionButton,
                    isPremiumUser ? localStyles.manageButton : localStyles.upgradeButton
                  ]}
                  onPress={isPremiumUser ? handleManageSubscription : handleUpgradePress}
                >
                  <Text style={[
                    localStyles.subscriptionButtonText,
                    isPremiumUser ? localStyles.manageButtonText : localStyles.upgradeButtonText
                  ]}>
                    {isPremiumUser ? 'Manage Subscription' : 'Upgrade to Pro'}
                  </Text>
                  <Ionicons 
                    name={isPremiumUser ? "settings" : "arrow-forward"} 
                    size={16} 
                    color={isPremiumUser ? "#666" : "white"} 
                  />
                </TouchableOpacity>

                {/* Pro Features Preview for Free Users */}
                {!isPremiumUser && (
                  <View style={localStyles.featuresPreview}>
                    <Text style={localStyles.featuresTitle}>Pro features include:</Text>
                    <View style={localStyles.featuresList}>
                      <Text style={localStyles.featureItem}>• Unlimited AI food scans</Text>
                      <Text style={localStyles.featureItem}>• Advanced meal planning</Text>
                      <Text style={localStyles.featureItem}>• Detailed nutrition insights</Text>
                      <Text style={localStyles.featureItem}>• Recipe browser access</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            <View style={localStyles.section}>
          <Text style={localStyles.cardTitle}>Profile Information</Text>
          <View style={localStyles.profileRow}>
            <Text style={localStyles.profileLabel}>Email:</Text>
            <Text style={localStyles.profileValue}>{user?.email || 'Not available'}</Text>
          </View>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.section}>
          <Text style={localStyles.cardTitle}>Preferences</Text>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Notifications</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Units & Measurements</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Privacy</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Support</Text>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Help Center</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Contact Support</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Terms of Service</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[localStyles.button, localStyles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[localStyles.buttonText, localStyles.logoutText]}>Logout</Text>
        </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </WhiteMotionBackground>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  section: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  profileValue: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.9)',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuText: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.85)',
  },
  menuArrow: {
    fontSize: fonts.large,
    color: 'rgba(0, 0, 0, 0.3)',
  },
  button: {
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FFB6C1',
    marginTop: spacing.lg,
  },
  logoutText: {
    color: '#FFFFFF',
  },
  subscriptionSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  freeBadge: {
    backgroundColor: '#e3f2fd',
  },
  proBadge: {
    backgroundColor: '#e8f5e8',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  freeText: {
    color: '#1976d2',
  },
  proText: {
    color: '#2e7d32',
  },
  upgradeButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 15,
  },
  manageButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  proFeaturesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  proFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkIconText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  proFeatureText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
});

export default AccountScreen;
