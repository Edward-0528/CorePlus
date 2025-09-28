import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, fonts } from '../../../utils/responsive';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionPlansScreen = ({ navigation }) => {
  const {
    subscriptionInfo,
    purchaseSubscription,
    restorePurchases,
    getAvailablePackages,
    SUBSCRIPTION_TIERS
  } = useSubscription();

  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro_yearly'); // Default to best value

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const availablePackages = await getAvailablePackages();
      setPackages(availablePackages);
    } catch (error) {
      console.error('Error loading packages:', error);
      Alert.alert('Error', 'Unable to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase) => {
    setPurchasing(true);
    try {
      const result = await purchaseSubscription(packageToPurchase);
      if (result.success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const plans = [
    {
      id: 'pro_monthly',
      tier: 'pro',
      title: 'Core+ Pro',
      subtitle: 'Monthly',
      price: '$9.99', // Updated price
      period: '/month',
      description: 'Perfect for serious fitness enthusiasts',
      savings: null,
      features: [
        'Unlimited AI food scans',
        'Advanced meal planning',
        'Recipe browser with 1000+ recipes',
        'Personalized workout plans',
        'Detailed micro-nutrient tracking',
        'Export nutrition data',
        'Priority customer support'
      ]
    },
    {
      id: 'pro_yearly',
      tier: 'pro',
      title: 'Core+ Pro',
      subtitle: 'Annual',
      price: '$79.99',
      period: '/year',
      description: 'Best value - Save 33%!',
      savings: 'Save $39.89',
      popular: true,
      features: [
        'Unlimited AI food scans',
        'Advanced meal planning',
        'Recipe browser with 1000+ recipes',
        'Personalized workout plans',
        'Detailed micro-nutrient tracking',
        'Export nutrition data',
        'Priority customer support',
        'Save $39.89 vs monthly'
      ]
    },
    {
      id: 'elite_monthly',
      tier: 'elite',
      title: 'Core+ Elite',
      subtitle: 'Monthly',
      price: '$19.99',
      period: '/month',
      description: 'Ultimate wellness experience',
      savings: null,
      features: [
        'Everything in Pro',
        'Nutritionist consultations',
        'Advanced analytics & trends',
        'Bulk meal prep planning',
        'Custom macro targets',
        'Early access to new features',
        'Premium customer support'
      ]
    },
    {
      id: 'elite_yearly',
      tier: 'elite',
      title: 'Core+ Elite',
      subtitle: 'Annual',
      price: '$199.99',
      period: '/year',
      description: 'Premium experience - Save 17%!',
      savings: 'Save $39.89',
      features: [
        'Everything in Pro',
        'Nutritionist consultations',
        'Advanced analytics & trends',
        'Bulk meal prep planning',
        'Custom macro targets',
        'Early access to new features',
        'Premium customer support',
        'Save $39.89 vs monthly'
      ]
    }
  ];

  const PlanCard = ({ plan }) => {
    const isSelected = selectedPlan === plan.id;
    const isCurrentTier = subscriptionInfo.tier === plan.tier;
    
    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          plan.popular && styles.popularPlan
        ]}
        onPress={() => setSelectedPlan(plan.id)}
        disabled={purchasing || isCurrentTier}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
            {plan.savings && (
              <Text style={styles.savingsText}>{plan.savings}</Text>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>{plan.period}</Text>
          </View>
        </View>
        
        <Text style={styles.planDescription}>{plan.description}</Text>
        
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        {isCurrentTier && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanText}>Current Plan</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4682B4" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const selectedPackage = packages?.packages?.find(p => 
    p.identifier.includes(selectedPlan.replace('_', '.'))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#1D1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Join thousands of users who've transformed their health with Core+ Pro
          </Text>
        </View>

        {/* Current Plan Info */}
        {subscriptionInfo.tier !== SUBSCRIPTION_TIERS.FREE && (
          <View style={styles.currentSubscriptionCard}>
            <View style={styles.currentSubscriptionHeader}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.currentSubscriptionTitle}>
                Current: Core+ {subscriptionInfo.tier === 'pro' ? 'Pro' : 'Elite'}
              </Text>
            </View>
            {subscriptionInfo.expiresAt && (
              <Text style={styles.expirationText}>
                Expires: {new Date(subscriptionInfo.expiresAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Free Tier Summary */}
        {subscriptionInfo.tier === SUBSCRIPTION_TIERS.FREE && (
          <View style={styles.freeTrialCard}>
            <Text style={styles.freeTrialTitle}>You're currently on the Free plan</Text>
            <Text style={styles.freeTrialText}>
              • 5 AI food scans per day{'\n'}
              • Basic nutrition tracking{'\n'}
              • 7-day meal history{'\n'}
              • 1 workout plan
            </Text>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>

        {/* Purchase Button */}
        {subscriptionInfo.tier === SUBSCRIPTION_TIERS.FREE && selectedPackage && (
          <TouchableOpacity
            style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
            onPress={() => handlePurchase(selectedPackage)}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.purchaseButtonText}>
                  Start {selectedPlanData?.title} - {selectedPlanData?.price}{selectedPlanData?.period}
                </Text>
                {selectedPlanData?.savings && (
                  <Text style={styles.purchaseButtonSavings}>{selectedPlanData.savings}</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            Subscriptions automatically renew unless cancelled 24 hours before the end of the current period. 
            You can manage your subscription in your device's Settings.
          </Text>
          <View style={styles.termsLinks}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}> • </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.medium,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  restoreButton: {
    padding: spacing.xs,
  },
  restoreText: {
    fontSize: fonts.medium,
    color: '#4682B4',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: fonts.xlarge,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentSubscriptionCard: {
    backgroundColor: '#F2F2F7',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currentSubscriptionTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: spacing.xs,
  },
  expirationText: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  freeTrialCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  freeTrialTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  freeTrialText: {
    fontSize: fonts.small,
    color: '#34C759',
    lineHeight: 20,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#4682B4',
    backgroundColor: '#F8FBFF',
  },
  popularPlan: {
    borderColor: '#34C759',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: spacing.lg,
    backgroundColor: '#34C759',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  popularText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planTitle: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  planSubtitle: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginTop: 2,
  },
  savingsText: {
    fontSize: fonts.small,
    color: '#34C759',
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: fonts.xlarge,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  period: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  planDescription: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginBottom: spacing.md,
  },
  featuresContainer: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fonts.small,
    color: '#1D1D1F',
    flex: 1,
  },
  currentPlanBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  currentPlanText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  purchaseButton: {
    backgroundColor: '#4682B4',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  purchaseButtonSavings: {
    fontSize: fonts.small,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  termsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  termsText: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  termsLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: fonts.tiny,
    color: '#4682B4',
  },
  linkSeparator: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
  },
});

export default SubscriptionPlansScreen;
