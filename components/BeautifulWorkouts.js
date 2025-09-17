import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import health service for Apple Health integration
import healthService from '../services/healthService';

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
      const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      // Get health metrics
      const [steps, calories, workouts, activeMinutes] = await Promise.all([
        healthService.getSteps(startOfDay, new Date()),
        healthService.getCalories(startOfDay, new Date()),
        healthService.getWorkouts(startOfDay, new Date()),
        healthService.getActiveMinutes(startOfDay, new Date())
      ]);

      // Get weekly data for stats
      const [weeklyWorkouts, weeklyMinutes, weeklyCalories] = await Promise.all([
        healthService.getWorkouts(weekAgo, new Date()),
        healthService.getActiveMinutes(weekAgo, new Date()),
        healthService.getCalories(weekAgo, new Date())
      ]);

      const weeklyStats = [
        { value: weeklyWorkouts?.length?.toString() || '0', label: 'Workouts', color: AppColors.workout },
        { value: Math.round((weeklyMinutes || 0) / 60 * 10) / 10 + 'h', label: 'Total Time', color: AppColors.primary },
        { value: (weeklyCalories || 0).toString(), label: 'Calories', color: AppColors.nutrition },
        { value: '0%', label: 'Goal', color: AppColors.success }, // TODO: Calculate from user goals
      ];

      setHealthData(prev => ({
        ...prev,
        todayStats: [
          { value: activeMinutes?.toString() || '0', label: 'Minutes', color: AppColors.workout },
          { value: calories?.toString() || '0', label: 'Calories', color: AppColors.nutrition },
          { value: workouts?.length?.toString() || '0', label: 'Workouts', color: AppColors.primary },
          { value: steps?.toString() || '0', label: 'Steps', color: AppColors.account },
        ],
        workouts: workouts || [],
        weeklyStats,
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
