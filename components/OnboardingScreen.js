import React, { memo, useRef, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Dimensions } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../contexts/AppContext';
import ParticleBackground from './common/ParticleBackground';
import OnboardingStep1_Goals from './onboarding-steps/OnboardingStep1_Goals';
import OnboardingStep2_Activities from './onboarding-steps/OnboardingStep2_Activities';
import OnboardingStep3_PersonalInfo from './onboarding-steps/OnboardingStep3_PersonalInfo';
import OnboardingStep4_Summary from './onboarding-steps/OnboardingStep4_Summary';
import ImprovedDatePickerModal from './modals/ImprovedDatePickerModal';
import ImprovedHeightPickerModal from './modals/ImprovedHeightPickerModal';
import ImprovedWeightPickerModal from './modals/ImprovedWeightPickerModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OnboardingScreen = memo(({ 
  onboardingStep,
  showDatePicker,
  showHeightPicker,
  showWeightPicker,
  loading,
  onCompleteOnboarding,
  formatDateForDisplay,
  formatHeightDisplay,
  mainGoals: propsMainGoals,
  activityOptions: propsActivityOptions,
  styles 
}) => {
  const { 
    onboardingData,
    mainGoals: contextMainGoals,
    activityOptions: contextActivityOptions,
    nextOnboardingStep,
    prevOnboardingStep,
    selectGoal,
    toggleActivity,
    selectDate,
    selectHeight,
    selectWeight,
    setShowDatePicker,
    setShowHeightPicker,
    setShowWeightPicker,
    setOnboardingData
  } = useAppContext();

  // Use props if provided, otherwise fall back to context
  const mainGoals = propsMainGoals || contextMainGoals;
  const activityOptions = propsActivityOptions || contextActivityOptions;

  return (
    <PaperProvider>
      <SafeAreaView style={styles.landingContainer}>
        {/* Motion Particle Background */}
        <ParticleBackground />
        
        {/* Content Overlay */}
        <View style={[styles.videoOverlay, { opacity: 1 }]}>
          {/* Enhanced Gradient Overlay for better text readability */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.2)',
              'rgba(0,0,0,0.4)',
              'rgba(0,0,0,0.6)',
              'rgba(0,0,0,0.8)'
            ]}
            style={styles.gradientOverlay}
            locations={[0, 0.3, 0.7, 1]}
          />
          
          <View style={styles.overlay}>
            <ScrollView 
              contentContainerStyle={styles.onboardingScrollContent} 
              showsVerticalScrollIndicator={false}
            >
          
          {onboardingStep === 1 && (
            <OnboardingStep1_Goals
              onboardingData={onboardingData}
              mainGoals={mainGoals}
              onGoalSelect={selectGoal}
              onNext={nextOnboardingStep}
            />
          )}

          {onboardingStep === 2 && (
            <OnboardingStep2_Activities
              onboardingData={onboardingData}
              activityOptions={activityOptions}
              onActivityToggle={toggleActivity}
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
            />
          )}

          {onboardingStep === 3 && (
            <OnboardingStep3_PersonalInfo
              onboardingData={onboardingData}
              formatDateForDisplay={formatDateForDisplay}
              formatHeightDisplay={formatHeightDisplay}
              setShowDatePicker={setShowDatePicker}
              setShowHeightPicker={setShowHeightPicker}
              setShowWeightPicker={setShowWeightPicker}
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
              styles={styles}
            />
          )}

          {onboardingStep === 4 && (
            <OnboardingStep4_Summary
              onboardingData={onboardingData}
              mainGoals={mainGoals}
              loading={loading}
              setOnboardingData={setOnboardingData}
              onCompleteOnboarding={onCompleteOnboarding}
              onPrev={prevOnboardingStep}
              styles={styles}
            />
          )}

            </ScrollView>
          </View>
        </View>
        
        <ImprovedDatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={selectDate}
          styles={styles}
        />

        <ImprovedHeightPickerModal
          visible={showHeightPicker}
          onClose={() => setShowHeightPicker(false)}
          onHeightSelect={selectHeight}
          styles={styles}
        />

        <ImprovedWeightPickerModal
          visible={showWeightPicker}
          onClose={() => setShowWeightPicker(false)}
          onWeightSelect={selectWeight}
          styles={styles}
        />
        
        <StatusBar style="light" />
      </SafeAreaView>
    </PaperProvider>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the current step changes or related modals change
  return prevProps.onboardingStep === nextProps.onboardingStep &&
         prevProps.showDatePicker === nextProps.showDatePicker &&
         prevProps.showHeightPicker === nextProps.showHeightPicker &&
         prevProps.showWeightPicker === nextProps.showWeightPicker &&
         prevProps.loading === nextProps.loading;
});

OnboardingScreen.displayName = 'OnboardingScreen';

export default OnboardingScreen;
