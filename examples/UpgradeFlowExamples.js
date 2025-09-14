// Example: How to add upgrade prompts to your existing components

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import UpgradePromptCard from './UpgradePromptCard';

// Example 1: In your FoodCameraScreen
const FoodCameraScreen = () => {
  const { checkFeatureUsage, isPremiumUser } = useFeatureAccess();

  const handleAIScan = async () => {
    const result = await checkFeatureUsage('ai_scans', {
      featureDescription: 'AI-powered food recognition with detailed nutrition analysis'
    });

    if (result.canUse) {
      // Proceed with AI scan
      performAIScan();
    }
    // Paywall will be shown automatically if needed
  };

  return (
    <View>
      {/* Your existing camera UI */}
      
      {/* Show upgrade prompt for free users approaching limits */}
      {!isPremiumUser && (
        <UpgradePromptCard 
          featureName="AI Scans"
          featureDescription="Get unlimited AI food recognition"
        />
      )}
      
      <TouchableOpacity onPress={handleAIScan}>
        <Text>Scan Food</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 2: In your MealPlanningScreen
const MealPlanningScreen = () => {
  const { canAccessFeature, isPremiumUser } = useFeatureAccess();

  const handleMealPlanAccess = async () => {
    const hasAccess = await canAccessFeature('meal_planning');
    if (!hasAccess) {
      // Show upgrade modal
      showUpgradeModal();
    } else {
      // Access meal planning
      navigateToMealPlanning();
    }
  };

  if (!isPremiumUser) {
    return (
      <View>
        <Text>Meal Planning requires Core+ Pro</Text>
        <UpgradePromptCard 
          featureName="Meal Planning"
          featureDescription="Plan your meals weeks in advance with our advanced meal planning tools"
        />
      </View>
    );
  }

  return (
    <View>
      {/* Your meal planning content */}
    </View>
  );
};

// Example 3: In your DashboardScreen
const DashboardScreen = () => {
  const { isPremiumUser, subscriptionStatus, getDaysUntilExpiration } = useFeatureAccess();

  return (
    <View>
      {/* Your existing dashboard content */}
      
      {/* Show upgrade prompt strategically */}
      {!isPremiumUser && (
        <UpgradePromptCard 
          style={{ marginTop: 20 }}
          featureName="Premium Features"
          featureDescription="Unlock the full potential of Core+"
        />
      )}

      {/* Show subscription status for pro users */}
      {isPremiumUser && getDaysUntilExpiration() < 7 && (
        <View style={styles.renewalReminder}>
          <Text>Your Core+ Pro subscription expires in {getDaysUntilExpiration()} days</Text>
        </View>
      )}
    </View>
  );
};

export { FoodCameraScreen, MealPlanningScreen, DashboardScreen };
