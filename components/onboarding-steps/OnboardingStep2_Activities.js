import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Ultra-minimal activity card component
const ActivityCard = memo(({ activity, isSelected, isDisabled, onToggle }) => {
  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onToggle(activity.id);
    }
  }, [activity.id, onToggle, isDisabled]);

  return (
    <TouchableOpacity
      style={{
        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
        borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: 6,
        minHeight: 60,
        opacity: isDisabled ? 0.4 : 1,
      }}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: '300',
        textAlign: 'center',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.2,
      }}>
        {activity.title}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.isSelected === nextProps.isSelected && 
         prevProps.isDisabled === nextProps.isDisabled &&
         prevProps.activity.id === nextProps.activity.id;
});

const OnboardingStep2_Activities = memo(({ 
  onboardingData, 
  activityOptions, 
  onActivityToggle, 
  onNext, 
  onPrev 
}) => {
  const selectedActivities = useMemo(() => onboardingData.activities || [], [onboardingData.activities]);
  const canContinue = useMemo(() => selectedActivities.length > 0, [selectedActivities.length]);
  const maxSelections = 5;
  const isMaxSelected = selectedActivities.length >= maxSelections;

  const activityRows = useMemo(() => {
    if (!activityOptions || activityOptions.length === 0) return [];
    const rows = [];
    for (let i = 0; i < activityOptions.length; i += 2) {
      rows.push(activityOptions.slice(i, i + 2));
    }
    return rows;
  }, [activityOptions]);

  const renderActivityRow = useCallback((row, rowIndex) => (
    <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 12 }}>
      {row.map((activity) => {
        const isSelected = selectedActivities.includes(activity.id);
        const isDisabled = !isSelected && isMaxSelected;
        
        return (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onToggle={onActivityToggle}
          />
        );
      })}
      {row.length === 1 && <View style={{ flex: 1, margin: 6 }} />}
    </View>
  ), [selectedActivities, isMaxSelected, onActivityToggle]);

  // Debug logging
  console.log('🔍 OnboardingStep2_Activities - activityOptions:', activityOptions);
  console.log('🔍 OnboardingStep2_Activities - selectedActivities:', selectedActivities);

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
          Activities
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
            backgroundColor: 'rgba(255, 255, 255, 0.3)' 
          }} />
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
        </View>
        
        {/* Selection Counter */}
        <Text style={{
          fontSize: 12,
          color: '#ffffff',
          marginTop: 16,
          textShadowColor: 'rgba(0, 0, 0, 0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}>
          {selectedActivities.length} of {maxSelections} selected
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Activity Grid */}
        <View style={{ marginBottom: 60 }}>
          {activityRows.length > 0 ? activityRows.map(renderActivityRow) : (
            <Text style={{ color: '#ffffff', textAlign: 'center' }}>
              No activities available
            </Text>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 20,
              alignItems: 'center',
            }}
            onPress={onPrev}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 0.3,
            }}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: canContinue ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderWidth: canContinue ? 0 : 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 20,
              alignItems: 'center',
            }}
            onPress={onNext}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: canContinue ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: 0.3,
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.onboardingData.activities === nextProps.onboardingData.activities &&
         prevProps.activityOptions === nextProps.activityOptions;
});

OnboardingStep2_Activities.displayName = 'OnboardingStep2_Activities';
ActivityCard.displayName = 'ActivityCard';

export default OnboardingStep2_Activities;
