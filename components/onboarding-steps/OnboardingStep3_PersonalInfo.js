import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BirthdaySelector from '../common/BirthdaySelector';
import ModernHeightSelector from '../common/ModernHeightSelector';
import ModernWeightSelector from '../common/ModernWeightSelector';
import { useAppContext } from '../../contexts/AppContext';

const OnboardingStep3_PersonalInfo = ({ 
  onboardingData, 
  formatDateForDisplay, 
  formatHeightDisplay, 
  setShowDatePicker,
  setShowHeightPicker,
  setShowWeightPicker,
  onNext, 
  onPrev, 
  styles 
}) => {
  const { selectDate, selectHeight, selectWeight } = useAppContext();

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
          textShadowColor: 'rgba(0, 0, 0, 0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
          letterSpacing: 0.5,
        }}>
          About You
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
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Form Fields */}
        <View style={{ marginBottom: 48 }}>
          {/* Birthday */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 13,
              fontWeight: '300',
              color: '#ffffff',
              marginBottom: 8,
              textShadowColor: 'rgba(0, 0, 0, 0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              Birthday
            </Text>
            <BirthdaySelector
              value={onboardingData.dateOfBirth}
              onDateSelect={selectDate}
              styles={styles}
            />
          </View>

          {/* Height */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 13,
              fontWeight: '300',
              color: '#ffffff',
              marginBottom: 8,
              textShadowColor: 'rgba(0, 0, 0, 0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              Height
            </Text>
            <ModernHeightSelector
              feet={onboardingData.heightFeet}
              inches={onboardingData.heightInches}
              onHeightSelect={selectHeight}
              styles={styles}
            />
          </View>

          {/* Weight */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ 
              fontSize: 13,
              fontWeight: '300',
              color: '#ffffff',
              marginBottom: 8,
              textShadowColor: 'rgba(0, 0, 0, 0.6)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              Weight (lbs)
            </Text>
            <ModernWeightSelector
              value={onboardingData.weight}
              onWeightSelect={selectWeight}
              styles={styles}
            />
          </View>
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
              backgroundColor: (onboardingData.dateOfBirth && onboardingData.heightFeet && onboardingData.weight) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderWidth: (onboardingData.dateOfBirth && onboardingData.heightFeet && onboardingData.weight) ? 0 : 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 20,
              alignItems: 'center',
            }}
            onPress={onNext}
            disabled={!(onboardingData.dateOfBirth && onboardingData.heightFeet && onboardingData.weight)}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: (onboardingData.dateOfBirth && onboardingData.heightFeet && onboardingData.weight) ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: 0.3,
            }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OnboardingStep3_PersonalInfo;
