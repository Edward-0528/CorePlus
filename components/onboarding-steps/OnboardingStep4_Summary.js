import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import ModernWeightSelector from '../common/ModernWeightSelector';

const OnboardingStep4_Summary = ({ 
  onboardingData, 
  mainGoals,
  loading,
  setOnboardingData,
  onCompleteOnboarding,
  onPrev, 
  styles 
}) => {
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
          Goal Weight
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
            backgroundColor: 'rgba(255, 255, 255, 0.3)' 
          }} />
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: '#ffffff' 
          }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Goal Weight Input */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ 
            fontSize: 13,
            fontWeight: '300',
            color: '#ffffff',
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Target Weight (lbs)
          </Text>
          <ModernWeightSelector
            value={onboardingData.goalWeight}
            onWeightSelect={(weight) => setOnboardingData({...onboardingData, goalWeight: weight.toString()})}
            styles={styles}
          />
        </View>

        {/* Affiliate Code Input */}
        <View style={{ marginBottom: 48 }}>
          <Text style={{ 
            fontSize: 13,
            fontWeight: '300',
            color: '#ffffff',
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Affiliate Code (Optional)
          </Text>
          <TextInput
            value={onboardingData.affiliateCode}
            onChangeText={(text) => setOnboardingData({...onboardingData, affiliateCode: text.toUpperCase()})}
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              fontSize: 14,
              color: '#ffffff',
              fontWeight: '300',
              textAlign: 'center',
              letterSpacing: 1,
            }}
            placeholder="ENTER CODE"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            marginTop: 6,
            fontWeight: '300',
          }}>
            Have a code from your favorite influencer? Enter it above
          </Text>
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
              backgroundColor: (onboardingData.goalWeight && !loading) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderWidth: (onboardingData.goalWeight && !loading) ? 0 : 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 20,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
            }}
            onPress={onCompleteOnboarding}
            disabled={!onboardingData.goalWeight || loading}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: (onboardingData.goalWeight && !loading) ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              letterSpacing: 0.3,
            }}>
              {loading ? 'Creating...' : 'Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OnboardingStep4_Summary;
