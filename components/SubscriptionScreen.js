import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { revenueCatService } from '../services/revenueCatService';

const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  success: '#28A745',
  warning: '#FFC107',
  premium: '#FFD700',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

export default function SubscriptionScreen({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [products, setProducts] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    initializeSubscriptions();
  }, []);

  const initializeSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Initialize RevenueCat if not already done
      await revenueCatService.initialize();
      
      // Load products and customer info
      const [loadedProducts, customerData] = await Promise.all([
        revenueCatService.loadProducts(),
        revenueCatService.refreshCustomerInfo()
      ]);

      setProducts(loadedProducts);
      setCustomerInfo(customerData);
      setIsPremium(revenueCatService.hasActiveSubscription());
      
    } catch (error) {
      console.error('Failed to initialize subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId) => {
    try {
      setPurchasing(true);
      
      const result = await revenueCatService.purchaseProduct(productId);
      
      if (result.success) {
        setIsPremium(revenueCatService.hasActiveSubscription());
        Alert.alert(
          '🎉 Welcome to Premium!',
          'Your subscription is now active. Enjoy all premium features!',
          [{ text: 'Great!', onPress: () => onClose && onClose() }]
        );
      } else if (result.cancelled) {
        // User cancelled, no need to show error
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        setIsPremium(result.hasActiveSubscription);
        
        if (result.hasActiveSubscription) {
          Alert.alert('✅ Restored!', 'Your premium subscription has been restored.');
        } else {
          Alert.alert('No Purchases Found', 'No active subscriptions found to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Failed to restore purchases');
      }
      
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setPurchasing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={24} color={AppColors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Core+ Premium</Text>
      <View style={styles.headerIcon}>
        <Ionicons name="star" size={32} color={AppColors.premium} />
      </View>
    </View>
  );

  const renderCurrentStatus = () => {
    if (!customerInfo) return null;

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={isPremium ? "checkmark-circle" : "information-circle"} 
            size={24} 
            color={isPremium ? AppColors.success : AppColors.textSecondary} 
          />
          <Text style={styles.statusTitle}>
            {isPremium ? 'Premium Active' : 'Free Plan'}
          </Text>
        </View>
        
        {isPremium && (
          <Text style={styles.statusDescription}>
            You have access to all premium features including unlimited AI analysis, 
            advanced workout tracking, and personalized meal planning.
          </Text>
        )}
      </View>
    );
  };

  const renderFeatures = () => (
    <View style={styles.featuresCard}>
      <Text style={styles.featuresTitle}>Premium Features</Text>
      
      {[
        { icon: 'restaurant', text: 'Unlimited AI Food Analysis' },
        { icon: 'barbell', text: 'Advanced Workout Tracking' },
        { icon: 'analytics', text: 'Detailed Health Analytics' },
        { icon: 'heart', text: 'Apple Health Integration' },
        { icon: 'book', text: 'Personalized Meal Plans' },
        { icon: 'cloud', text: 'Cloud Sync & Backup' }
      ].map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name={feature.icon} size={20} color={AppColors.primary} />
          <Text style={styles.featureText}>{feature.text}</Text>
          <Ionicons name="checkmark" size={16} color={AppColors.success} />
        </View>
      ))}
    </View>
  );

  const renderProducts = () => {
    if (isPremium) return null;

    return (
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
        {products.map((product) => {
          const isYearly = product.identifier.includes('yearly');
          const savings = isYearly ? '2 months free!' : null;
          
          return (
            <TouchableOpacity
              key={product.identifier}
              style={[styles.productCard, isYearly && styles.popularProduct]}
              onPress={() => handlePurchase(product.identifier)}
              disabled={purchasing}
            >
              {isYearly && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              
              <View style={styles.productHeader}>
                <Text style={styles.productTitle}>
                  {isYearly ? 'Yearly' : 'Monthly'}
                </Text>
                <Text style={styles.productPrice}>{product.priceString}</Text>
              </View>
              
              <Text style={styles.productPeriod}>
                {isYearly ? 'per year' : 'per month'}
              </Text>
              
              {savings && (
                <Text style={styles.productSavings}>{savings}</Text>
              )}
              
              <View style={styles.productButton}>
                <Text style={styles.productButtonText}>
                  {purchasing ? 'Processing...' : 'Subscribe'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={purchasing}
      >
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
      
      <Text style={styles.footerNote}>
        Subscriptions auto-renew unless cancelled. Cancel anytime in your account settings.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStatus()}
        {renderFeatures()}
        {renderProducts()}
        {renderFooter()}
      </ScrollView>
      
      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={AppColors.white} />
          <Text style={styles.purchasingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  headerIcon: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
  productsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
    position: 'relative',
  },
  popularProduct: {
    borderColor: AppColors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.primary,
  },
  productPeriod: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  productSavings: {
    fontSize: 14,
    color: AppColors.success,
    fontWeight: '600',
    marginBottom: 12,
  },
  productButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  productButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  restoreText: {
    fontSize: 16,
    color: AppColors.primary,
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 12,
    color: AppColors.textLight,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingText: {
    color: AppColors.white,
    fontSize: 16,
    marginTop: 12,
  },
});
