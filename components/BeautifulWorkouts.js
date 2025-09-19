import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import new HealthKit service for Apple Health integration
import newHealthService from '../services/newHealthService';

// Custom Components
import { 
  BeautifulCard, 
  MetricCard, 
  ActionButton, 
  SectionHeader,
  StatsRow,
  QuickAction,
  EmptyState
} from './design/Components';

const { width } = Dimensions.get('window');

const BeautifulWorkouts = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [healthData, setHealthData] = useState({
    todayStats: [],
    workouts: [],
    weeklyStats: [],
    isLoading: true,
    hasPermissions: false
  });
  
  // Initialize Apple Health on component mount
  useEffect(() => {
    initializeHealthData();
  }, []);

  const initializeHealthData = async () => {
    try {
      console.log('🏃‍♂️ Initializing HealthKit integration...');
      setHealthData(prev => ({ ...prev, isLoading: true }));
      
      // Initialize new health service
      const initialized = await newHealthService.initialize();
      if (!initialized) {
        console.warn('⚠️ HealthKit not available');
        setDefaultData();
        return;
      }

      // Load real health data
      await loadHealthData();
      setHealthData(prev => ({ ...prev, hasPermissions: true, isLoading: false }));
      
    } catch (error) {
      console.error('❌ Failed to initialize HealthKit:', error);
      setDefaultData();
    }
  };

  const loadHealthData = async () => {
    try {
      console.log('📊 Loading health data from HealthKit...');
      
      // Get comprehensive health data for today
      const [todayHealth, weeklyHealth] = await Promise.all([
        newHealthService.getTodayHealthData(),
        newHealthService.getWeeklyHealthSummary()
      ]);
      
      console.log('📈 Health data received:', { todayHealth, weeklyHealth });

      const todayStats = [
        { 
          value: Math.round(todayHealth.calories.value).toString(), 
          label: 'Calories', 
          color: AppColors.nutrition,
          isReal: todayHealth.calories.isReal 
        },
        { 
          value: todayHealth.steps.value.toString(), 
          label: 'Steps', 
          color: AppColors.account,
          isReal: todayHealth.steps.isReal 
        },
        { 
          value: `${todayHealth.distance.value}`, 
          label: 'Distance (km)', 
          color: AppColors.workout,
          isReal: todayHealth.distance.isReal 
        },
        { 
          value: todayHealth.heartRate.value ? `${todayHealth.heartRate.value}` : '0', 
          label: 'Heart Rate (bpm)', 
          color: AppColors.primary,
          isReal: todayHealth.heartRate.isReal 
        },
      ];

      // Calculate weekly averages
      const weeklyData = weeklyHealth.data || [];
      const weeklyAvg = weeklyData.reduce((acc, day) => ({
        steps: acc.steps + day.steps,
        calories: acc.calories + day.calories,
        distance: acc.distance + day.distance,
      }), { steps: 0, calories: 0, distance: 0 });

      const weeklyStats = [
        { value: Math.round(weeklyAvg.steps / Math.max(weeklyData.length, 1)).toString(), label: 'Avg Steps/Day', color: AppColors.account },
        { value: Math.round(weeklyAvg.calories / Math.max(weeklyData.length, 1)).toString(), label: 'Avg Calories/Day', color: AppColors.nutrition },
        { value: (weeklyAvg.distance / Math.max(weeklyData.length, 1)).toFixed(1), label: 'Avg Distance/Day (km)', color: AppColors.workout },
        { value: weeklyData.length.toString(), label: 'Active Days', color: AppColors.primary },
      ];

      setHealthData(prev => ({
        ...prev,
        todayStats,
        workouts: [], // Will be populated when workout data is available
        weeklyStats,
        isLoading: false,
        hasPermissions: todayHealth.isConnected
      }));

    } catch (error) {
      console.error('❌ Failed to load health data:', error);
      setDefaultData();
    }
  };

  const setDefaultData = () => {
    // Set empty default state when health data is not available
    const defaultStats = [
      { value: '0', label: 'Workouts', color: AppColors.workout },
      { value: '0h', label: 'Total Time', color: AppColors.primary },
      { value: '0', label: 'Calories', color: AppColors.nutrition },
      { value: '0%', label: 'Goal', color: AppColors.success },
    ];

    setHealthData({
      todayStats: defaultStats,
      workouts: [],
      weeklyStats: defaultStats,
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
      console.log('🏥 Requesting HealthKit permissions...');
      
      // Initialize and request permissions
      const initialized = await newHealthService.initialize();
      
      if (initialized) {
        setHealthData(prev => ({ ...prev, hasPermissions: true, isLoading: true }));
        await loadHealthData();
        console.log('✅ HealthKit connected successfully');
      } else {
        console.warn('⚠️ Failed to connect to HealthKit');
        alert('Unable to connect to Apple Health. Please check your settings and try again.');
      }
    } catch (error) {
      console.error('❌ Failed to request health permissions:', error);
      alert('Failed to connect to Apple Health. Please try again.');
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.workout, Colors.accentLight]}
      style={{
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View row centerV spread>
        <View>
          <Text h4 color={Colors.white}>Workouts</Text>
          <Text body1 color={Colors.white} style={{ opacity: 0.9 }}>
            Stay strong, stay consistent
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trophy" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View paddingH-20 style={{ marginTop: -15 }}>
      <View row spread style={{ gap: 12 }}>
        <ActionButton
          icon="add-circle"
          title="Log Workout"
          gradient={[Colors.primary, Colors.primaryLight]}
          style={{ flex: 1 }}
          onPress={() => console.log('Log workout')}
        />
        <ActionButton
          icon="flash"
          title="Quick HIIT"
          gradient={[Colors.warning, '#FFE066']}
          style={{ flex: 1 }}
          onPress={() => console.log('Quick HIIT')}
        />
        <ActionButton
          icon="library"
          title="AI Plan"
          gradient={[Colors.success, '#66BB6A']}
          style={{ flex: 1 }}
          onPress={() => console.log('AI Plan')}
        />
      </View>
    </View>
  );

  const renderWeeklyStats = () => (
    <View paddingH-20>
      <SectionHeader 
        title="This Week"
        subtitle="Your workout progress"
      />
      <StatsRow stats={weeklyStats} />
    </View>
  );

  const renderTabs = () => (
    <View paddingH-20>
      <View 
        row
        style={{
          backgroundColor: Colors.backgroundTertiary,
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {['today', 'history', 'plans'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? Colors.white : 'transparent',
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text 
              center
              color={activeTab === tab ? Colors.primary : Colors.textSecondary}
              style={{ fontWeight: activeTab === tab ? '600' : '400' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTodaysWorkouts = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Today's Schedule"
        subtitle={`${todaysWorkouts.length} workouts planned`}
      />
      {todaysWorkouts.length > 0 ? (
        todaysWorkouts.map((workout) => (
          <BeautifulCard key={workout.id} style={{ marginBottom: 12 }}>
            <View row centerV spread>
              <View row centerV flex>
                <View 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: workout.completed ? Colors.success : Colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons 
                    name={workout.completed ? "checkmark" : "fitness"} 
                    size={24} 
                    color={Colors.white} 
                  />
                </View>
                <View flex marginL-md>
                  <Text h6 color={Colors.textPrimary}>{workout.name}</Text>
                  <Text body2 color={Colors.textSecondary} marginT-xs>
                    {workout.type} • {workout.duration} min • {workout.calories} cal
                  </Text>
                </View>
              </View>
              <View center>
                <Text caption color={Colors.textLight}>{workout.time}</Text>
                {!workout.completed && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.primary,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginTop: 4,
                    }}
                  >
                    <Text caption color={Colors.white}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BeautifulCard>
        ))
      ) : (
        <EmptyState
          icon="fitness"
          title="No workouts scheduled"
          subtitle="Add a workout to get started"
          actionText="Log Workout"
          onActionPress={() => console.log('Log workout')}
        />
      )}
    </View>
  );

  const renderWorkoutHistory = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Recent Workouts"
        subtitle="Your activity history"
        action="View All"
      />
      {workoutHistory.map((workout) => (
        <BeautifulCard key={workout.id} style={{ marginBottom: 12 }}>
          <View row centerV spread>
            <View row centerV flex>
              <View 
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: Colors.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
              </View>
              <View flex marginL-md>
                <Text h6 color={Colors.textPrimary}>{workout.name}</Text>
                <Text body2 color={Colors.textSecondary} marginT-xs>
                  {workout.type} • {workout.duration} min • {workout.exercises} exercises
                </Text>
                <Text caption color={Colors.textLight} marginT-xs>
                  {new Date(workout.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View center>
              <Text h6 color={Colors.accent}>{workout.calories}</Text>
              <Text caption color={Colors.textLight}>calories</Text>
            </View>
          </View>
        </BeautifulCard>
      ))}
    </View>
  );

  const renderWorkoutPlans = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Workout Types"
        subtitle="Choose your training style"
      />
      <View row style={{ flexWrap: 'wrap', gap: 12 }}>
        {workoutTypes.map((type, index) => (
          <ActionButton
            key={index}
            icon={type.icon}
            title={type.name}
            gradient={type.gradient}
            style={{ 
              flex: 1, 
              minWidth: (width - 60) / 2,
              maxWidth: (width - 60) / 2,
            }}
            onPress={() => console.log(`Start ${type.name} workout`)}
          />
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodaysWorkouts();
      case 'history':
        return renderWorkoutHistory();
      case 'plans':
        return renderWorkoutPlans();
      default:
        return renderTodaysWorkouts();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundSecondary }}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.workout]}
            tintColor={Colors.workout}
          />
        }
      >
        {renderQuickActions()}
        {renderWeeklyStats()}
        {renderTabs()}
        {renderContent()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BeautifulWorkouts;
