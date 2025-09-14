import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import PaywallModal from './PaywallModal';

const FoodCameraExample = () => {
  const { checkFeatureUsage, isPremiumUser } = useFeatureAccess();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallData, setPaywallData] = useState(null);

  const handleAIScan = async () => {
    // Check if user can use AI scan feature
    const result = await checkFeatureUsage('ai_scans', {
      featureDescription: 'AI-powered food recognition gives you instant nutrition information from photos. Upgrade to get unlimited scans and detailed macro breakdowns.',
      onPaywallShow: (data) => {
        setPaywallData(data);
        setShowPaywall(true);
      }
    });

    if (result.canUse) {
      // User can use the feature - proceed with AI scan
      performAIScan();
    }
    // If can't use, paywall is already shown
  };

  const performAIScan = () => {
    // Your existing AI scan logic here
    console.log('Performing AI scan...');
    
    // Track usage for free users
    if (!isPremiumUser) {
      trackFeatureUsage('ai_scans');
    }
  };

  const trackFeatureUsage = async (featureName) => {
    try {
      // This would increment the daily usage counter
      const { supabase } = await import('../supabaseConfig');
      await supabase.rpc('increment_daily_usage', { 
        feature_name: featureName 
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const handleUpgrade = () => {
    setShowPaywall(false);
    // Navigate to subscription screen
    // navigation.navigate('SubscriptionPlans');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleAIScan}>
        <Text>Scan Food with AI</Text>
      </TouchableOpacity>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
        featureName={paywallData?.featureName}
        featureDescription={paywallData?.featureDescription}
        usageInfo={paywallData?.usageInfo}
      />
    </View>
  );
};

export default FoodCameraExample;
