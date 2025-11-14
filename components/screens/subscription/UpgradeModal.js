import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useFeatureAccess } from '../../../hooks/useFeatureAccess';
import { AppColors } from '../../../constants/AppColors';

const { width, height } = Dimensions.get('window');

const UpgradeModal = ({ visible, onClose, triggerFeature }) => {
  const { purchaseSubscription, getAvailablePackages, restorePurchases } = useSubscription();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // Only monthly available for now

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      console.log('🔄 [UpgradeModal] Loading packages...');
      const availablePackages = await getAvailablePackages();
      console.log('📦 [UpgradeModal] Packages loaded:', availablePackages);
      console.log('📦 [UpgradeModal] Package count:', availablePackages?.length || 0);
      
      if (availablePackages?.length > 0) {
        console.log('📦 [UpgradeModal] First package:', availablePackages[0]);
        console.log('📦 [UpgradeModal] Package identifiers:', availablePackages.map(p => p.identifier));
      }
      
      setPackages(availablePackages || []);
    } catch (error) {
      console.error('❌ [UpgradeModal] Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      // The restorePurchases function handles its own success/error alerts
      onClose(); // Close the modal after successful restore
    } catch (error) {
      console.error('Error during restore:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchase = async (packageToPurchase) => {
    setPurchasing(true);
    try {
      const result = await purchaseSubscription(packageToPurchase);
      if (result.success) {
        // Subscription successful - just close modal, no redundant dialog
        onClose();
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Purchase Error', error.message || 'Unable to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const getMonthlyPackage = () => {
    console.log('🔍 [UpgradeModal] Searching for monthly package in:', packages);
    console.log('🔍 [UpgradeModal] Available package identifiers:', packages?.map(p => p.identifier) || []);
    console.log('🔍 [UpgradeModal] Package types:', packages?.map(p => p.packageType) || []);
    
    if (!packages || packages.length === 0) {
      console.warn('⚠️ [UpgradeModal] No packages available');
      return null;
    }
    
    // Look for both possible product ID formats
    let monthlyPackage = packages.find(p => p.identifier === 'coreplus_premium_monthly:corepluselite');
    if (!monthlyPackage) {
      monthlyPackage = packages.find(p => p.identifier === 'coreplus_premium_monthly');
    }
    
    console.log('🔍 [UpgradeModal] Found monthly package:', monthlyPackage);
    
    return monthlyPackage;
  };  // Note: Yearly package removed - only monthly subscription available in RevenueCat

  const renderPricingCard = (plan, packageData) => {
    if (!packageData) {
      console.warn(`Package data not found for plan: ${plan}`);
      return null;
    }

    const price = packageData.product.priceString || packageData.product.price;

    return (
      <View style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color={AppColors.primary} />
          </View>
          <View style={styles.pricingInfo}>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.price}>{price}/mth</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonCircle}>
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              Unlock unlimited access to all premium features and take your health journey to the next level
            </Text>
          </View>

          {/* Pricing Card */}
          {!loading && packages.length > 0 && (
            <View style={styles.pricingSection}>
              {renderPricingCard('monthly', getMonthlyPackage())}
            </View>
          )}

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresSectionTitle}>Everything Included</Text>
            <View style={styles.featuresGrid}>
              <FeatureItem 
                icon="infinite" 
                title="Unlimited AI Scans"
                color="#FF6B6B"
              />
              <FeatureItem 
                icon="search" 
                title="Unlimited Manual Search"
                color="#4ECDC4"
              />
              <FeatureItem 
                icon="analytics" 
                title="Advanced Analytics"
                color="#45B7D1"
              />
              <FeatureItem 
                icon="fast-food" 
                title="Meal Analysis"
                color="#FFA07A"
              />
              <FeatureItem 
                icon="nutrition" 
                title="Detailed Nutrition"
                color="#98D8C8"
              />
              <FeatureItem 
                icon="time" 
                title="Full Meal History"
                color="#F7B731"
              />
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              • Cancel anytime in your App Store settings{'\n'}
              • Subscription automatically renews unless cancelled 24 hours before end of period{'\n'}
              • Payment will be charged to your App Store account
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.continueButton, (purchasing || loading) && styles.continueButtonDisabled]}
            onPress={() => {
              const packageToPurchase = getMonthlyPackage();
              if (packageToPurchase) {
                handlePurchase(packageToPurchase);
              } else {
                Alert.alert(
                  'Product Loading Error', 
                  'No subscription products are available. Please try again or contact support.'
                );
              }
            }}
            disabled={purchasing || loading}
          >
            <Text style={styles.continueButtonText}>
              {purchasing ? 'Processing...' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={purchasing || loading}
          >
            <Text style={styles.restoreButtonText}>
              Restore purchases
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const FeatureItem = ({ icon, title, color }) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  pricingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  pricingCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: AppColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  featuresSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerInfo: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomActions: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default UpgradeModal;
