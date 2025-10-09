import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { revenueCatService } from '../../../services/revenueCatService';

// Define colors directly
const AppColors = {
  primary: '#6B8E23',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  premium: '#FFD700',
};

export default function SubscriptionScreen({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [products, setProducts] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('📱 SubscriptionScreen mounted, initializing...');
    initializeSubscriptions();
  }, []);

  // Handle app state changes (e.g., returning from purchase flow)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 Subscription screen - app became active, refreshing status');
        // App returned from background (possibly from purchase flow)
        setTimeout(() => {
          revenueCatService.refreshCustomerInfo().then((info) => {
            setCustomerInfo(info);
            setIsPremium(revenueCatService.hasActiveSubscription());
          }).catch(error => {
            console.warn('Failed to refresh customer info after app resume:', error);
          });
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeSubscriptions = async () => {
    try {
      console.log('🔧 Initializing subscription screen...');
      setLoading(true);
      setError(null);
      
      // Initialize RevenueCat with better error handling
      const initResult = await revenueCatService.initialize();
      console.log('🔧 RevenueCat init result:', initResult);
      
      if (!initResult || (!initResult.success && !initResult.expoGo)) {
        console.warn('RevenueCat initialization failed');
        setError('Unable to connect to subscription service');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Skip product loading in Expo Go
      if (initResult.expoGo) {
        console.log('Skipping RevenueCat product loading in Expo Go');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      // Load products and customer info with timeout
      console.log('📦 Loading products and customer info...');
      const loadPromise = Promise.all([
        revenueCatService.loadProducts(),
        revenueCatService.refreshCustomerInfo()
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading subscription data')), 10000)
      );

      const [loadedProducts, customerData] = await Promise.race([loadPromise, timeoutPromise]);

      console.log('📦 Loaded products:', loadedProducts);
      setProducts(loadedProducts || []);
      setCustomerInfo(customerData);
      setIsPremium(revenueCatService.hasActiveSubscription());
      
    } catch (error) {
      console.error('❌ Failed to initialize subscriptions:', error);
      setError(`Initialization failed: ${error.message}`);
      
      // Don't show alert immediately, let user see the error state first
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };  const handlePurchase = async (productId) => {
    try {
      setPurchasing(true);
      console.log('🛒 Starting purchase flow for:', productId);
      
      // Check if RevenueCat is available
      if (!revenueCatService.isInitialized) {
        console.warn('RevenueCat not initialized, attempting to initialize...');
        await revenueCatService.initialize();
        if (!revenueCatService.isInitialized) {
          Alert.alert(
            'Service Unavailable',
            'Subscription service is not available. Please try again later.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Check if product exists
      const product = products.find(p => p.identifier === productId);
      if (!product) {
        Alert.alert('Error', 'Selected subscription is not available.');
        return;
      }

      console.log('🛒 Starting purchase for:', productId);
      
      const result = await revenueCatService.purchaseProduct(productId);
      
      if (result.success) {
        console.log('✅ Purchase successful, updating UI...');
        
        // Small delay to allow RevenueCat to process
        setTimeout(async () => {
          try {
            // Refresh customer info to get latest status
            await revenueCatService.refreshCustomerInfo();
            setIsPremium(revenueCatService.hasActiveSubscription());
            
            Alert.alert(
              '🎉 Welcome to Premium!',
              'Your subscription is now active. Enjoy all premium features!',
              [{ text: 'Great!', onPress: () => onClose && onClose() }]
            );
          } catch (refreshError) {
            console.warn('Failed to refresh after purchase:', refreshError);
            // Still show success since purchase completed
            Alert.alert(
              '🎉 Welcome to Premium!',
              'Your subscription is now active. You may need to restart the app to see all features.',
              [{ text: 'OK', onPress: () => onClose && onClose() }]
            );
          }
        }, 1000);
        
      } else if (result.cancelled) {
        // User cancelled, no need to show error
        console.log('Purchase cancelled by user');
      } else if (result.timeout) {
        Alert.alert(
          'Purchase Timeout', 
          'The purchase process timed out. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handlePurchase(productId) },
            { text: 'Cancel' }
          ]
        );
      } else {
        // Show specific error message
        const errorMessage = result.error || 'Something went wrong with your purchase';
        Alert.alert(
          'Purchase Failed', 
          errorMessage,
          [
            { text: 'Retry', onPress: () => handlePurchase(productId) },
            { text: 'Cancel' }
          ]
        );
        console.error('Purchase failed:', result);
      }
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Error', 
        'Unable to process your purchase. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => handlePurchase(productId) },
          { text: 'Cancel' }
        ]
      );
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

    // Fallback when no products are available (e.g., RevenueCat not working)
    if (!products || products.length === 0) {
      return (
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Premium Plans</Text>
          
          {/* Fallback products */}
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productTitle}>Monthly</Text>
              <Text style={styles.productPrice}>$9.99</Text>
            </View>
            <Text style={styles.productPeriod}>per month</Text>
            
            <TouchableOpacity 
              style={styles.productButton}
              onPress={() => Alert.alert(
                'Service Unavailable',
                'Subscription service is temporarily unavailable. Please try again later.',
                [{ text: 'OK' }]
              )}
            >
              <Text style={styles.productButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.productCard, styles.popularProduct]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
            
            <View style={styles.productHeader}>
              <Text style={styles.productTitle}>Yearly</Text>
              <Text style={styles.productPrice}>$99.99</Text>
            </View>
            <Text style={styles.productPeriod}>per year</Text>
            <Text style={styles.productSavings}>2 months free!</Text>
            
            <TouchableOpacity 
              style={styles.productButton}
              onPress={() => Alert.alert(
                'Service Unavailable',
                'Subscription service is temporarily unavailable. Please try again later.',
                [{ text: 'OK' }]
              )}
            >
              <Text style={styles.productButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.fallbackNote}>
            💡 Prices shown are estimates. Actual prices may vary by region.
          </Text>
        </View>
      );
    }

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
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Subscriptions</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={initializeSubscriptions}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStatus()}
          {renderFeatures()}
          {renderProducts()}
          {renderFooter()}
        </ScrollView>
      )}
      
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
  fallbackNote: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 16,
    fontStyle: 'italic',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: AppColors.textSecondary,
    fontSize: 16,
  },
});
