import React from 'react';
import { View, Alert, Platform } from 'react-native';
import { Text, TouchableOpacity } from '../UILibReplacement';
import { AppColors } from '../../constants/AppColors';
import { Ionicons } from '@expo/vector-icons';

// Import HealthKit hooks and types
let useHealthkitAuthorization = null;
let HKQuantityTypeIdentifier = null;
let useMostRecentQuantitySample = null;
let useStatisticsForQuantity = null;

try {
  if (Platform.OS === 'ios') {
    const healthKitModule = require('@kingstinct/react-native-healthkit');
    useHealthkitAuthorization = healthKitModule.useHealthkitAuthorization;
    HKQuantityTypeIdentifier = healthKitModule.HKQuantityTypeIdentifier;
    useMostRecentQuantitySample = healthKitModule.useMostRecentQuantitySample;
    useStatisticsForQuantity = healthKitModule.useStatisticsForQuantity;
  }
} catch (error) {
  console.warn('HealthKit hooks not available:', error.message);
}

const HealthKitConnector = ({ onConnectionChange }) => {
  // Define the health data types we want to access
  const healthPermissions = React.useMemo(() => {
    if (!HKQuantityTypeIdentifier) return [];
    
    return [
      HKQuantityTypeIdentifier.stepCount,
      HKQuantityTypeIdentifier.activeEnergyBurned,
      HKQuantityTypeIdentifier.basalEnergyBurned,
      HKQuantityTypeIdentifier.distanceWalkingRunning,
      HKQuantityTypeIdentifier.heartRate,
    ];
  }, []);

  // Use the HealthKit authorization hook
  const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization ? 
    useHealthkitAuthorization(healthPermissions) : [null, null];

  // Get health data samples
  const stepsData = useMostRecentQuantitySample ? 
    useMostRecentQuantitySample(HKQuantityTypeIdentifier?.stepCount) : null;
  
  const caloriesData = useMostRecentQuantitySample ? 
    useMostRecentQuantitySample(HKQuantityTypeIdentifier?.activeEnergyBurned) : null;

  // Check if we have authorization
  const isAuthorized = authorizationStatus === 'authorized';

  React.useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isAuthorized);
    }
  }, [isAuthorized, onConnectionChange]);

  const handleRequestAuthorization = async () => {
    if (!requestAuthorization) {
      Alert.alert(
        'HealthKit Not Available',
        'HealthKit requires a development build on a physical iOS device.'
      );
      return;
    }

    try {
      console.log('🏥 Requesting HealthKit authorization...');
      await requestAuthorization();
      console.log('✅ HealthKit authorization requested');
    } catch (error) {
      console.error('❌ Failed to request authorization:', error);
      Alert.alert('Error', `Failed to request Apple Health permission: ${error.message}`);
    }
  };

  // If not on iOS or HealthKit not available, show not available message
  if (Platform.OS !== 'ios' || !useHealthkitAuthorization) {
    return (
      <View style={{
        backgroundColor: AppColors.backgroundSecondary,
        padding: 16,
        borderRadius: 12,
        margin: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="information-circle-outline" size={20} color={AppColors.textSecondary} style={{ marginRight: 8 }} />
          <Text body2 color={AppColors.textSecondary}>HealthKit Not Available</Text>
        </View>
        <Text caption color={AppColors.textSecondary}>
          {Platform.OS !== 'ios' 
            ? 'Apple Health is only available on iOS devices.'
            : 'HealthKit requires a development build on a physical device.'
          }
        </Text>
      </View>
    );
  }

  // If already authorized, show connection status
  if (isAuthorized) {
    return (
      <View style={{
        backgroundColor: AppColors.success + '20',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        borderLeftWidth: 4,
        borderLeftColor: AppColors.success
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="checkmark-circle" size={20} color={AppColors.success} style={{ marginRight: 8 }} />
          <Text body2 color={AppColors.success} style={{ fontWeight: '600' }}>Apple Health Connected</Text>
        </View>
        <Text caption color={AppColors.textSecondary} style={{ marginBottom: 12 }}>
          Successfully connected to Apple Health. Your health data is now being synced.
        </Text>
        
        {/* Show some sample data */}
        {(stepsData || caloriesData) && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {stepsData && (
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text caption color={AppColors.textSecondary}>Steps</Text>
                <Text body2 color={AppColors.textPrimary}>{Math.round(stepsData.quantity || 0)}</Text>
              </View>
            )}
            {caloriesData && (
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text caption color={AppColors.textSecondary}>Calories</Text>
                <Text body2 color={AppColors.textPrimary}>{Math.round(caloriesData.quantity || 0)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Show connect button
  return (
    <View style={{
      backgroundColor: AppColors.warning + '20',
      padding: 16,
      borderRadius: 12,
      margin: 16,
      borderLeftWidth: 4,
      borderLeftColor: AppColors.warning
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="fitness-outline" size={20} color={AppColors.warning} style={{ marginRight: 8 }} />
        <Text body2 color={AppColors.warning} style={{ fontWeight: '600' }}>Connect Apple Health</Text>
      </View>
      <Text caption color={AppColors.textSecondary} style={{ marginBottom: 16 }}>
        Enable Apple Health integration to track your workouts, steps, and calories automatically.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: AppColors.warning,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={handleRequestAuthorization}
      >
        <Text body2 color={AppColors.white} style={{ fontWeight: '600' }}>
          Connect Now
        </Text>
      </TouchableOpacity>
      
      <Text caption color={AppColors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
        Authorization Status: {authorizationStatus || 'Unknown'}
      </Text>
    </View>
  );
};

export default HealthKitConnector;
