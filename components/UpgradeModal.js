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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

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
      const availablePackages = await getAvailablePackages();
      setPackages(availablePackages);
    } catch (error) {
      console.error('Error loading packages:', error);
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
        Alert.alert(
          'Welcome to Core+ Pro! 🎉',
          'Your subscription is now active. Enjoy unlimited access to all premium features!',
          [{ text: 'Start Using Pro Features', onPress: onClose }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Purchase Error', error.message || 'Unable to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const getMonthlyPackage = () => packages.find(p => p.identifier === 'coreplus_premium_monthly:corepluselite');
  
  // Note: Yearly package removed - only monthly subscription available in RevenueCat

  const renderPricingCard = (plan, packageData, isRecommended = false) => {
    if (!packageData) {
      console.warn(`Package data not found for plan: ${plan}`);
      return null;
    }

    const price = packageData.product.priceString || packageData.product.price;
    const currency = packageData.product.currencyCode || '$';

    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          selectedPlan === plan && styles.selectedCard,
          isRecommended && styles.recommendedCard
        ]}
        onPress={() => setSelectedPlan(plan)}
      >
        <Text style={styles.planTitle}>Monthly Subscription</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.period}>/month</Text>
        </View>

        <Text style={styles.planDescription}>
          Full access to all Core+ Premium features
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Ionicons name="star" size={48} color="#FFD700" />
              <Text style={styles.title}>Upgrade to Core+ Pro</Text>
              <Text style={styles.subtitle}>
                {triggerFeature ? 
                  `Unlock ${triggerFeature} and all premium features` :
                  'Unlock all premium features'
                }
              </Text>
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Everything you get with Pro:</Text>
            
            <FeatureItem 
              icon="infinite" 
              title="Unlimited AI Food Scans" 
              description="Scan any food, any time"
            />
            <FeatureItem 
              icon="calendar" 
              title="Advanced Meal Planning" 
              description="Plan meals weeks in advance"
            />
            <FeatureItem 
              icon="analytics" 
              title="Detailed Nutrition Insights" 
              description="Track macros, micros, and trends"
            />
            <FeatureItem 
              icon="library" 
              title="Recipe Browser" 
              description="Access thousands of healthy recipes"
            />
            <FeatureItem 
              icon="cloud-download" 
              title="Export Your Data" 
              description="Download your nutrition history"
            />
            <FeatureItem 
              icon="construct" 
              title="Custom Macro Goals" 
              description="Set personalized nutrition targets"
            />
            <FeatureItem 
              icon="fitness" 
              title="Unlimited Workouts" 
              description="Create and track all your workouts"
            />
            <FeatureItem 
              icon="headset" 
              title="Priority Support" 
              description="Get help when you need it"
            />
          </View>

          {/* Pricing Options */}
          {!loading && packages.length > 0 && (
            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Monthly Subscription:</Text>
              
              <View style={styles.pricingCards}>
                {renderPricingCard('monthly', getMonthlyPackage())}
              </View>
            </View>
          )}

          {/* Purchase Button */}
          <View style={styles.purchaseContainer}>
            <TouchableOpacity 
              style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
              onPress={() => {
                const packageToPurchase = getMonthlyPackage();
                if (packageToPurchase) {
                  handlePurchase(packageToPurchase);
                } else {
                  Alert.alert('Error', 'Monthly subscription package not found. Please try again.');
                }
              }}
              disabled={purchasing || loading}
            >
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'Processing...' : 'Start Your Pro Subscription'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={purchasing || loading}
            >
              <Text style={styles.restoreButtonText}>
                {purchasing ? 'Restoring...' : 'Restore Previous Purchase'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              • Cancel anytime in App Store settings
            </Text>
            <Text style={styles.footerText}>
              • Subscription auto-renews unless cancelled
            </Text>
            <Text style={styles.footerText}>
              • Payment charged to App Store account
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color="#4CAF50" />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pricingContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  pricingCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  recommendedCard: {
    borderColor: '#FFD700',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 12,
    right: 12,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  period: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  planDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  effectivePrice: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  purchaseContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default UpgradeModal;
