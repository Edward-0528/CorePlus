import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';

// Import health service for Apple Health integration
import healthService from '../services/healthService';

// Minimal Components
import MinimalComponents from './design/MinimalComponents';
const { 
  MinimalCard,
  MinimalMetric,
  MinimalButton,
  MinimalSection,
  MinimalStats,
  MinimalProgress,
  MinimalAction
} = MinimalComponents;

const MinimalWorkouts = ({ user, onLogout, loading, styles }) => {
  const [activeTab, setActiveTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState({
    todayStats: [],
    workouts: [],
    isLoading: true,
    hasPermissions: false
  });

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'history', label: 'History' },
    { id: 'programs', label: 'Programs' },
  ];

  // Initialize Apple Health on component mount
  useEffect(() => {
    initializeHealthData();
  }, []);

  const initializeHealthData = async () => {
    try {
      console.log('🏃‍♂️ Initializing Apple Health integration...');
      
      // Initialize health service
      const initialized = await healthService.initialize();
      if (!initialized) {
        console.warn('⚠️ Health service not available');
        setDefaultData();
        return;
      }

      // Request permissions
      const hasPermissions = await healthService.requestPermissions();
      if (!hasPermissions) {
        console.warn('⚠️ Health permissions denied');
        setDefaultData();
        return;
      }

      // Load real health data
      await loadHealthData();
      setHealthData(prev => ({ ...prev, hasPermissions: true, isLoading: false }));
      
    } catch (error) {
      console.error('❌ Failed to initialize health data:', error);
      setDefaultData();
    }
  };

  const loadHealthData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      // Get today's health metrics
      const [steps, calories, workouts, activeMinutes] = await Promise.all([
        healthService.getSteps(startOfDay, new Date()),
        healthService.getCalories(startOfDay, new Date()),
        healthService.getWorkouts(startOfDay, new Date()),
        healthService.getActiveMinutes(startOfDay, new Date())
      ]);

      const todayStats = [
        { value: activeMinutes?.toString() || '0', label: 'Minutes', color: AppColors.workout },
        { value: calories?.toString() || '0', label: 'Calories', color: AppColors.nutrition },
        { value: workouts?.length?.toString() || '0', label: 'Workouts', color: AppColors.primary },
        { value: steps?.toString() || '0', label: 'Steps', color: AppColors.account },
      ];

      setHealthData(prev => ({
        ...prev,
        todayStats,
        workouts: workouts || [],
        isLoading: false
      }));

    } catch (error) {
      console.error('❌ Failed to load health data:', error);
      setDefaultData();
    }
  };

  const setDefaultData = () => {
    // Set empty default state when health data is not available
    const defaultStats = [
      { value: '0', label: 'Minutes', color: AppColors.workout },
      { value: '0', label: 'Calories', color: AppColors.nutrition },
      { value: '0', label: 'Workouts', color: AppColors.primary },
      { value: '0', label: 'Steps', color: AppColors.account },
    ];

    setHealthData({
      todayStats: defaultStats,
      workouts: [],
      isLoading: false,
      hasPermissions: false
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing workout data...');
    
    if (healthData.hasPermissions) {
      await loadHealthData();
    }
    
    setRefreshing(false);
  };

  const requestHealthPermissions = async () => {
    try {
      console.log('🏥 Requesting Apple Health permissions...');
      const granted = await healthService.requestPermissions();
      
      if (granted) {
        setHealthData(prev => ({ ...prev, hasPermissions: true }));
        await loadHealthData();
      }
    } catch (error) {
      console.error('❌ Failed to request health permissions:', error);
    }
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.textPrimary}>Workouts</Text>
          <Text body2 color={Colors.textSecondary}>Track your fitness journey</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="add-outline" size={24} color={AppColors.workout} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border, width: '100%' }} />
    </View>
  );

  const renderTabs = () => (
    <View paddingH-20>
      <View row style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginRight: 20,
              borderBottomWidth: activeTab === tab.id ? 2 : 0,
              borderBottomColor: AppColors.workout,
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text 
              body1 
              color={activeTab === tab.id ? AppColors.workout : Colors.textSecondary}
              style={{ fontWeight: activeTab === tab.id ? '600' : '400' }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTodayView = () => (
    <View>
      {/* Health Permissions Notice */}
      {!healthData.hasPermissions && (
        <View paddingH-20 marginT-lg>
          <View style={{
            backgroundColor: AppColors.warning + '20',
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: AppColors.warning
          }}>
            <View row centerV marginB-sm>
              <Ionicons name="fitness-outline" size={20} color={AppColors.warning} style={{ marginRight: 8 }} />
              <Text h6 color={AppColors.warning}>Connect Apple Health</Text>
            </View>
            <Text body2 color={AppColors.textSecondary} marginB-md>
              Enable Apple Health integration to track your workouts, steps, and calories automatically.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: AppColors.warning,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={requestHealthPermissions}
            >
              <Text body2 color={AppColors.white} style={{ fontWeight: '600' }}>
                Connect Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Today's Stats */}
      <View paddingH-20 marginT-lg>
        <Text h6 color={Colors.textPrimary} marginB-md>Today's Activity</Text>
        {healthData.isLoading ? (
          <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <Text body2 color={Colors.textSecondary}>Loading health data...</Text>
          </View>
        ) : (
          <MinimalStats stats={healthData.todayStats} />
        )}
      </View>

      {/* Recent Workouts */}
      <View paddingH-20 marginT-xl>
        <Text h6 color={Colors.textPrimary} marginB-md>Recent Workouts</Text>
        {healthData.workouts.length > 0 ? (
          healthData.workouts.slice(0, 3).map((workout, index) => (
            <MinimalCard key={index} style={{ marginBottom: 12 }}>
              <View row centerV spread>
                <View>
                  <Text body1 color={Colors.textPrimary}>{workout.name || 'Workout'}</Text>
                  <Text caption color={Colors.textSecondary}>
                    {workout.duration} min • {workout.calories} cal
                  </Text>
                </View>
                <View>
                  <Ionicons 
                    name={workout.completed ? "checkmark-circle" : "time-outline"} 
                    size={20} 
                    color={workout.completed ? AppColors.success : AppColors.textSecondary} 
                  />
                </View>
              </View>
            </MinimalCard>
          ))
        ) : (
          <View style={{
            padding: 24,
            alignItems: 'center',
            backgroundColor: AppColors.backgroundSecondary,
            borderRadius: 12
          }}>
            <Ionicons name="barbell-outline" size={32} color={AppColors.textSecondary} style={{ marginBottom: 8 }} />
            <Text body2 color={AppColors.textSecondary} style={{ textAlign: 'center' }}>
              {healthData.hasPermissions ? 'No workouts recorded today' : 'Connect Apple Health to see your workouts'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHistoryView = () => (
    <View paddingH-20 marginT-lg>
      <Text h6 color={Colors.textPrimary} marginB-md>Workout History</Text>
      {healthData.hasPermissions ? (
        <View style={{
          padding: 24,
          alignItems: 'center',
          backgroundColor: AppColors.backgroundSecondary,
          borderRadius: 12
        }}>
          <Ionicons name="construction-outline" size={32} color={AppColors.textSecondary} style={{ marginBottom: 8 }} />
          <Text body2 color={AppColors.textSecondary} style={{ textAlign: 'center', marginBottom: 8 }}>
            Workout history coming soon
          </Text>
          <Text caption color={AppColors.textSecondary} style={{ textAlign: 'center' }}>
            We're building integration with your Apple Health workout history
          </Text>
        </View>
      ) : (
        <View style={{
          padding: 24,
          alignItems: 'center',
          backgroundColor: AppColors.backgroundSecondary,
          borderRadius: 12
        }}>
          <Ionicons name="time-outline" size={32} color={AppColors.textSecondary} style={{ marginBottom: 8 }} />
          <Text body2 color={AppColors.textSecondary} style={{ textAlign: 'center' }}>
            Connect Apple Health to view your workout history
          </Text>
        </View>
      )}
    </View>
  );

  const renderProgramsView = () => (
    <View paddingH-20 marginT-lg>
      <Text h6 color={Colors.textPrimary} marginB-md>Workout Programs</Text>
      <View style={{
        padding: 24,
        alignItems: 'center',
        backgroundColor: AppColors.backgroundSecondary,
        borderRadius: 12
      }}>
        <Ionicons name="library-outline" size={32} color={AppColors.textSecondary} style={{ marginBottom: 8 }} />
        <Text body2 color={AppColors.textSecondary} style={{ textAlign: 'center', marginBottom: 8 }}>
          Custom workout programs coming soon
        </Text>
        <Text caption color={AppColors.textSecondary} style={{ textAlign: 'center' }}>
          Create personalized workout routines and track your progress
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodayView();
      case 'history':
        return renderHistoryView();
      case 'programs':
        return renderProgramsView();
      default:
        return renderTodayView();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundSecondary }}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.workout]}
            tintColor={AppColors.workout}
          />
        }
      >
        {renderContent()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalWorkouts;
