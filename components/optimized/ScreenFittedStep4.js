import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, useWindowDimensions, Modal, FlatList, ActivityIndicator } from 'react-native';

const ScreenFittedStep4 = memo(({ 
  onboardingData, 
  mainGoals,
  loading,
  setOnboardingData,
  onCompleteOnboarding,
  onPrev
}) => {
  const { height: screenHeight } = useWindowDimensions();
  
  // Adjust sizes based on screen height
  const titleSize = screenHeight < 700 ? 24 : 28;
  const subtitleSize = screenHeight < 700 ? 14 : 16;
  const labelSize = screenHeight < 700 ? 14 : 16;
  const summarySize = screenHeight < 700 ? 14 : 16;
  const inputHeight = screenHeight < 700 ? 50 : 60;
  
  const headerHeight = screenHeight < 700 ? 120 : 140;
  const buttonHeight = 130; // Increased for extra padding (50px button + 90px padding)
  const contentSpacing = screenHeight < 700 ? 16 : 24;

  const canComplete = onboardingData.goalWeight && 
                      parseFloat(onboardingData.goalWeight) > 0;

  const selectedGoal = mainGoals.find(g => g.id === onboardingData.mainGoal);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Fixed Header */}
      <View style={{ 
        height: headerHeight,
        paddingHorizontal: 20,
        paddingTop: 20,
        justifyContent: 'center'
      }}>
        <Text style={{ 
          fontSize: titleSize, 
          fontWeight: 'bold', 
          color: '#1A1A1A', 
          textAlign: 'center',
          marginBottom: 8 
        }}>
          Goal Weight 🎯
        </Text>
        <Text style={{ 
          fontSize: subtitleSize, 
          color: '#6C757D', 
          textAlign: 'center',
          marginBottom: 16 
        }}>
          Set your target weight
        </Text>
        
        {/* Progress Bar */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6C757D', marginBottom: 8 }}>
            Step 4 of 4
          </Text>
          <View style={{ 
            width: '100%', 
            height: 6, 
            backgroundColor: '#E9ECEF', 
            borderRadius: 3 
          }}>
            <View style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#007AFF', 
              borderRadius: 3 
            }} />
          </View>
        </View>
      </View>

      {/* Content Area - Fitted */}
      <View style={{ 
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between'
      }}>
        <View>
          {/* Goal Weight Input */}
          <View style={{ marginBottom: contentSpacing }}>
            <Text style={{
              fontSize: labelSize,
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 8
            }}>
              Goal Weight (lbs)
            </Text>
            <TextInput
              value={onboardingData.goalWeight}
              onChangeText={(text) => setOnboardingData({...onboardingData, goalWeight: text})}
              style={{
                backgroundColor: '#F8F9FA',
                borderColor: '#E9ECEF',
                borderWidth: 2,
                borderRadius: 12,
                height: inputHeight,
                paddingHorizontal: 16,
                fontSize: labelSize,
                color: '#1A1A1A'
              }}
              placeholder="e.g., 140"
              placeholderTextColor="#ADB5BD"
              keyboardType="numeric"
            />
          </View>

          {/* Summary - Compact */}
          <View style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            padding: 16,
            marginBottom: contentSpacing
          }}>
            <Text style={{
              fontSize: summarySize + 2,
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 12,
              textAlign: 'center'
            }}>
              Your Plan Summary
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{
                  fontSize: summarySize - 1,
                  color: '#6C757D',
                  numberOfLines: 1
                }}>
                  🎯 {selectedGoal?.title || 'Goal'}
                </Text>
              </View>
              
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{
                  fontSize: summarySize - 1,
                  color: '#6C757D',
                  numberOfLines: 1
                }}>
                  🏃‍♀️ {onboardingData.activities.length} activities
                </Text>
              </View>
              
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{
                  fontSize: summarySize - 1,
                  color: '#6C757D',
                  numberOfLines: 1
                }}>
                  📊 Current: {onboardingData.weight} lbs
                </Text>
              </View>
              
              <View style={{ width: '48%', marginBottom: 8 }}>
                <Text style={{
                  fontSize: summarySize - 1,
                  color: '#6C757D',
                  numberOfLines: 1
                }}>
                  🎯 Target: {onboardingData.goalWeight || '--'} lbs
                </Text>
              </View>
            </View>
          </View>
        </View>

  {/* Fixed Bottom Navigation - Higher up from bottom */}
        <View style={{ 
          height: buttonHeight,
          flexDirection: 'row', 
          justifyContent: 'space-between',
          paddingBottom: 60,
          paddingTop: 30,
          alignItems: 'center'
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#F8F9FA',
              borderColor: '#E9ECEF',
              borderWidth: 1,
              height: 50,
              borderRadius: 12,
              flex: 0.4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onPrev}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#6C757D'
            }}>
              Back
            </Text>
          </TouchableOpacity>
          {/* Preview button */}
          <PreviewButton
            canComplete={canComplete}
            loading={loading}
            onboardingData={onboardingData}
            onCompleteOnboarding={onCompleteOnboarding}
          />
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.onboardingData.goalWeight === nextProps.onboardingData.goalWeight &&
         prevProps.loading === nextProps.loading;
});

ScreenFittedStep4.displayName = 'ScreenFittedStep4';

export default ScreenFittedStep4;

// --- Preview button + modal component ---
const PreviewButton = ({ canComplete, loading, onboardingData, onCompleteOnboarding }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(null);

  const userId = 'preview-user'; // placeholder; planService doesn't use userId when previewing

  const handlePreview = async () => {
    if (!canComplete) return;
    setPreviewLoading(true);
    setModalVisible(true);
    try {
      const { planService } = await import('../../services/planService');
      const profileForPlan = {
        goal: onboardingData.mainGoal,
        experience: onboardingData.experience || 'beginner',
        daysAvailablePerWeek: onboardingData.daysPerWeek || 3,
        sessionLengthMinutes: onboardingData.sessionLength || 30,
        preferredSplit: onboardingData.preferredSplit || 'auto',
        equipment: onboardingData.equipment || []
      };

      const res = await planService.generatePlanForUser(userId, profileForPlan, { preview: true });
      if (res.success) setPreviewPlan(res.plan);
      else setPreviewPlan({ error: res.error || 'Failed to generate preview' });
    } catch (err) {
      setPreviewPlan({ error: err.message || String(err) });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAccept = () => {
    setModalVisible(false);
    // Proceed to complete onboarding (which will persist)
    onCompleteOnboarding();
  };

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: (canComplete && !loading) ? '#28A745' : '#E9ECEF',
          height: 50,
          borderRadius: 12,
          flex: 0.55,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={handlePreview}
        disabled={!canComplete || loading}
        activeOpacity={0.7}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: (canComplete && !loading) ? '#FFFFFF' : '#ADB5BD'
        }}>
          {loading ? 'Creating...' : 'Preview Plan'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Preview Workout Plan</Text>
            {previewLoading && <ActivityIndicator size="large" color="#007AFF" />}
            {!previewLoading && previewPlan && previewPlan.workouts && (
              <FlatList
                data={previewPlan.workouts}
                keyExtractor={(item, idx) => `${item.week}-${item.day}-${idx}`}
                renderItem={({ item }) => (
                  <View style={{ paddingVertical: 8, borderBottomColor: '#EEE', borderBottomWidth: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{item.workout.title}</Text>
                    <Text style={{ color: '#6C757D' }}>{item.workout.exercises.map(e => e.name).join(', ')}</Text>
                  </View>
                )}
              />
            )}

            {!previewLoading && previewPlan && previewPlan.error && (
              <Text style={{ color: 'red' }}>{previewPlan.error}</Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 12 }}>
                <Text style={{ color: '#6C757D' }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAccept} style={{ padding: 12 }}>
                <Text style={{ color: '#007AFF', fontWeight: '700' }}>Accept & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
