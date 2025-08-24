import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Ultra-minimal goal card component
const GoalCard = memo(({ goal, isSelected, onPress }) => {
  const handlePress = useCallback(() => onPress(goal.id), [goal.id, onPress]);
  
  return (
    <TouchableOpacity
      style={{
        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
        borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={{
        fontSize: 16,
        fontWeight: '300',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }}>
        {goal.title}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.isSelected === nextProps.isSelected && 
         prevProps.goal.id === nextProps.goal.id;
});

const OnboardingStep1_Goals = memo(({ 
  onboardingData, 
  mainGoals, 
  onGoalSelect, 
  onNext 
}) => {
  const selectedGoal = useMemo(() => onboardingData.mainGoal, [onboardingData.mainGoal]);
  const canContinue = useMemo(() => Boolean(selectedGoal), [selectedGoal]);
  
  const goalCards = useMemo(() => 
    mainGoals.map((goal) => (
      <GoalCard
        key={goal.id}
        goal={goal}
        isSelected={selectedGoal === goal.id}
        onPress={onGoalSelect}
      />
    )), [mainGoals, selectedGoal, onGoalSelect]
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 32, paddingVertical: 24 }}>
      {/* Minimal Header */}
      <View style={{ marginBottom: 48, alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '200', 
          color: '#ffffff', 
          textAlign: 'center',
          marginBottom: 12,
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
          letterSpacing: 0.5,
        }}>
          Your Goal
        </Text>
        
        {/* Minimal Progress Dots */}
        <View style={{ 
          flexDirection: 'row', 
          marginTop: 24,
          gap: 8,
        }}>
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: '#ffffff' 
          }} />
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: 'rgba(255, 255, 255, 0.3)' 
          }} />
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: 'rgba(255, 255, 255, 0.3)' 
          }} />
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: 'rgba(255, 255, 255, 0.3)' 
          }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Goal Cards */}
        <View style={{ marginBottom: 60 }}>
          {goalCards}
        </View>

        {/* Minimal Continue Button */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              backgroundColor: canContinue ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderWidth: canContinue ? 0 : 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 24,
              minWidth: 120,
              alignItems: 'center',
            }}
            onPress={onNext}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: canContinue ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: 0.5,
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.onboardingData.mainGoal === nextProps.onboardingData.mainGoal;
});

OnboardingStep1_Goals.displayName = 'OnboardingStep1_Goals';
GoalCard.displayName = 'GoalCard';

export default OnboardingStep1_Goals;
