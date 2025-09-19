import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Text, View, TouchableOpacity } from '../UILibReplacement';
import { AppColors } from '../../constants/AppColors';
import newHealthService from '../../services/newHealthService';
import { Ionicons } from '@expo/vector-icons';

const HealthKitDebugPanel = () => {
  const [healthData, setHealthData] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const isReady = newHealthService.isReady();
      const permStatus = await newHealthService.getPermissionStatus();
      setPermissions(permStatus);
      
      if (isReady) {
        await loadHealthData();
      }
    } catch (error) {
      console.error('❌ Failed to check initial status:', error);
    }
  };

  const initializeHealthKit = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Initializing HealthKit...');
      const initialized = await newHealthService.initialize();
      
      if (initialized) {
        Alert.alert('✅ Success', 'HealthKit connected successfully!');
        await loadHealthData();
        await checkInitialStatus();
      } else {
        Alert.alert('❌ Failed', 'Could not connect to HealthKit');
      }
    } catch (error) {
      console.error('❌ HealthKit initialization failed:', error);
      Alert.alert('❌ Error', `Failed to initialize HealthKit: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading comprehensive health data...');
      const [todayData, weeklyData] = await Promise.all([
        newHealthService.getTodayHealthData(),
        newHealthService.getWeeklyHealthSummary()
      ]);

      setHealthData({ today: todayData, weekly: weeklyData });
      console.log('✅ Health data loaded:', { todayData, weeklyData });
    } catch (error) {
      console.error('❌ Failed to load health data:', error);
      Alert.alert('❌ Error', `Failed to load health data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificMetrics = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing individual health metrics...');
      const [steps, calories, distance, heartRate] = await Promise.all([
        newHealthService.getTodaySteps(),
        newHealthService.getTodayCalories(),
        newHealthService.getTodayDistance(),
        newHealthService.getCurrentHeartRate()
      ]);

      const results = { steps, calories, distance, heartRate };
      console.log('🧪 Individual metrics:', results);
      Alert.alert('🧪 Test Results', JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('❌ Failed to test metrics:', error);
      Alert.alert('❌ Error', `Failed to test metrics: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHealthData = () => {
    if (!healthData) return null;

    const { today, weekly } = healthData;

    return (
      <View marginT-lg>
        <Text h6 color={AppColors.primary} marginB-md>📊 Today's Health Data</Text>
        <View style={{ backgroundColor: AppColors.backgroundSecondary, padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <Text body2 color={AppColors.textSecondary} marginB-sm>Connected: {today.isConnected ? '✅' : '❌'}</Text>
          <Text body2 color={AppColors.textSecondary}>Source: {today.source || 'N/A'}</Text>
          <Text body2 color={AppColors.textSecondary}>Last Updated: {new Date(today.lastUpdated).toLocaleTimeString()}</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <View style={{ width: '48%', backgroundColor: AppColors.backgroundSecondary, padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <Text body2 color={AppColors.textSecondary}>Steps</Text>
            <Text h5 color={today.steps.isReal ? AppColors.success : AppColors.error}>
              {today.steps.value} {today.steps.isReal ? '✅' : '❌'}
            </Text>
          </View>
          <View style={{ width: '48%', backgroundColor: AppColors.backgroundSecondary, padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <Text body2 color={AppColors.textSecondary}>Calories</Text>
            <Text h5 color={today.calories.isReal ? AppColors.success : AppColors.error}>
              {today.calories.value} {today.calories.isReal ? '✅' : '❌'}
            </Text>
          </View>
          <View style={{ width: '48%', backgroundColor: AppColors.backgroundSecondary, padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <Text body2 color={AppColors.textSecondary}>Distance</Text>
            <Text h5 color={today.distance.isReal ? AppColors.success : AppColors.error}>
              {today.distance.value} {today.distance.unit} {today.distance.isReal ? '✅' : '❌'}
            </Text>
          </View>
          <View style={{ width: '48%', backgroundColor: AppColors.backgroundSecondary, padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <Text body2 color={AppColors.textSecondary}>Heart Rate</Text>
            <Text h5 color={today.heartRate.isReal ? AppColors.success : AppColors.error}>
              {today.heartRate.value} bpm {today.heartRate.isReal ? '✅' : '❌'}
            </Text>
          </View>
        </View>

        {weekly.isConnected && weekly.data.length > 0 && (
          <View marginT-lg>
            <Text h6 color={AppColors.primary} marginB-md>📈 Weekly Summary ({weekly.data.length} days)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weekly.data.slice(-7).map((day, index) => (
                <View key={index} style={{ 
                  backgroundColor: AppColors.backgroundSecondary, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginRight: 8,
                  minWidth: 120 
                }}>
                  <Text caption color={AppColors.textSecondary} marginB-xs>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text caption color={AppColors.textPrimary}>{day.steps} steps</Text>
                  <Text caption color={AppColors.textPrimary}>{day.calories} cal</Text>
                  <Text caption color={AppColors.textPrimary}>{day.distance.toFixed(1)} km</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderPermissions = () => {
    if (!permissions) return null;

    return (
      <View marginT-lg>
        <Text h6 color={AppColors.primary} marginB-md>🔒 Permission Status</Text>
        <View style={{ backgroundColor: AppColors.backgroundSecondary, padding: 16, borderRadius: 12 }}>
          <Text body2 color={AppColors.textSecondary}>Platform: {permissions.platform}</Text>
          <Text body2 color={AppColors.textSecondary}>Initialized: {permissions.isInitialized ? '✅' : '❌'}</Text>
          <Text body2 color={AppColors.textSecondary}>Has Permissions: {permissions.hasPermissions ? '✅' : '❌'}</Text>
          <Text body2 color={AppColors.textSecondary}>Last Checked: {new Date(permissions.lastChecked).toLocaleTimeString()}</Text>
          
          {permissions.permissions && (
            <View marginT-sm>
              <Text caption color={AppColors.textSecondary}>Individual Permissions:</Text>
              {Object.entries(permissions.permissions).map(([key, value]) => (
                <Text key={key} caption color={AppColors.textSecondary}>
                  {key}: {value}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: AppColors.background }}>
      <View paddingH-20 paddingV-24>
        <View row centerV marginB-lg>
          <Ionicons name="fitness" size={24} color={AppColors.primary} style={{ marginRight: 8 }} />
          <Text h4 color={AppColors.textPrimary}>HealthKit Debug Panel</Text>
        </View>

        <Text body2 color={AppColors.textSecondary} marginB-xl>
          Test and debug Apple Health integration with @kingstinct/react-native-healthkit
        </Text>

        <View row style={{ justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              backgroundColor: AppColors.primary,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              flex: 1,
              marginRight: 8
            }}
            onPress={initializeHealthKit}
            disabled={isLoading}
          >
            <Text body2 color={AppColors.white} style={{ textAlign: 'center', fontWeight: '600' }}>
              {isLoading ? 'Loading...' : 'Connect HealthKit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: AppColors.success,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              flex: 1,
              marginLeft: 8
            }}
            onPress={loadHealthData}
            disabled={isLoading || !newHealthService.isReady()}
          >
            <Text body2 color={AppColors.white} style={{ textAlign: 'center', fontWeight: '600' }}>
              Refresh Data
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: AppColors.warning,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 20
          }}
          onPress={testSpecificMetrics}
          disabled={isLoading || !newHealthService.isReady()}
        >
          <Text body2 color={AppColors.white} style={{ textAlign: 'center', fontWeight: '600' }}>
            Test Individual Metrics
          </Text>
        </TouchableOpacity>

        {renderPermissions()}
        {renderHealthData()}
      </View>
    </ScrollView>
  );
};

export default HealthKitDebugPanel;
