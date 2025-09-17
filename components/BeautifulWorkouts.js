import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // Mock data - replace with real data
  const weeklyStats = [
    { value: '5', label: 'Workouts', color: Colors.workout },
    { value: '2.5h', label: 'Total Time', color: Colors.primary },
    { value: '1,250', label: 'Calories', color: Colors.accent },
    { value: '85%', label: 'Goal', color: Colors.success },
  ];

  const todaysWorkouts = [
    {
      id: 1,
      name: 'Morning Cardio',
      type: 'Cardio',
      duration: 30,
      calories: 250,
      completed: true,
      time: '7:00 AM'
    },
    {
      id: 2,
      name: 'Upper Body Strength',
      type: 'Strength',
      duration: 45,
      calories: 180,
      completed: false,
      time: '6:00 PM'
    }
  ];

  const workoutHistory = [
    {
      id: 1,
      name: 'Full Body HIIT',
      type: 'HIIT',
      duration: 25,
      calories: 300,
      date: '2025-08-28',
      exercises: 8
    },
    {
      id: 2,
      name: 'Yoga Flow',
      type: 'Flexibility',
      duration: 60,
      calories: 150,
      date: '2025-08-27',
      exercises: 12
    },
    {
      id: 3,
      name: 'Leg Day',
      type: 'Strength',
      duration: 50,
      calories: 220,
      date: '2025-08-26',
      exercises: 6
    }
  ];

  const workoutTypes = [
    { name: 'Strength', icon: 'barbell', color: Colors.workout, gradient: [Colors.workout, Colors.accentLight] },
    { name: 'Cardio', icon: 'heart', color: Colors.accent, gradient: [Colors.accent, Colors.accentLight] },
    { name: 'HIIT', icon: 'flash', color: Colors.warning, gradient: [Colors.warning, '#FFE066'] },
    { name: 'Yoga', icon: 'leaf', color: Colors.success, gradient: [Colors.success, '#66BB6A'] },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
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
