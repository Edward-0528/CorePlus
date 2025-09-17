import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';

// Define colors directly to avoid RNUI Colors import issues
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

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

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'history', label: 'History' },
    { id: 'programs', label: 'Programs' },
  ];

  const todayStats = [
    { value: '45', label: 'Minutes', color: AppColors.workout },
    { value: '320', label: 'Calories', color: AppColors.nutrition },
    { value: '12', label: 'Exercises', color: AppColors.primary },
    { value: '3', label: 'Sets', color: AppColors.account },
  ];

  const workoutHistory = [
    { name: 'Full Body Strength', duration: '45 min', date: 'Today', calories: 320, completed: true },
    { name: 'HIIT Cardio', duration: '30 min', date: 'Yesterday', calories: 280, completed: true },
    { name: 'Upper Body', duration: '40 min', date: '2 days ago', calories: 250, completed: true },
  ];

  const workoutPrograms = [
    { name: 'Beginner Strength', weeks: 4, workouts: 12, difficulty: 'Easy' },
    { name: 'HIIT Bootcamp', weeks: 6, workouts: 18, difficulty: 'Hard' },
    { name: 'Flexibility Flow', weeks: 3, workouts: 9, difficulty: 'Medium' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.textPrimary}>Workouts</Text>
          <Text body2 color={Colors.textSecondary}>Track your fitness journey</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="add-outline" size={24} color={Colors.workout} />
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
              borderBottomColor: Colors.workout,
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text 
              body1 
              color={activeTab === tab.id ? Colors.workout : Colors.textSecondary}
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
      <View paddingH-20 marginT-lg>
        <MinimalStats stats={todayStats} />
      </View>

      <View paddingH-20 marginT-lg>
        <MinimalSection title="Quick Start" />
        <MinimalCard style={{ marginTop: 8 }}>
          <MinimalMetric
            icon="play-outline"
            title="Continue Last Workout"
            value="Full Body"
            color={Colors.workout}
            onPress={() => console.log('Continue workout')}
          />
          <MinimalMetric
            icon="flash-outline"
            title="Quick HIIT Session"
            value="15 min"
            color={Colors.primary}
            onPress={() => console.log('Quick HIIT')}
          />
          <MinimalMetric
            icon="body-outline"
            title="Stretching Routine"
            value="10 min"
            color={Colors.nutrition}
            onPress={() => console.log('Stretching')}
          />
        </MinimalCard>
      </View>

      <View paddingH-20 marginT-lg>
        <MinimalSection title="Today's Goal" />
        <MinimalCard style={{ marginTop: 8 }}>
          <View row centerV spread marginB-sm>
            <Text body1 color={Colors.textPrimary}>Workout Duration</Text>
            <Text h6 color={Colors.workout}>45 / 60 min</Text>
          </View>
          <MinimalProgress progress={75} color={Colors.workout} height={3} />
          <Text caption color={Colors.textSecondary} marginT-sm>
            15 minutes to reach daily goal
          </Text>
        </MinimalCard>
      </View>
    </View>
  );

  const renderHistoryView = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Recent Workouts" action="View All" />
      <MinimalCard style={{ marginTop: 8 }}>
        {workoutHistory.map((workout, index) => (
          <MinimalMetric
            key={index}
            icon="checkmark-circle-outline"
            title={`${workout.name} • ${workout.date}`}
            value={workout.duration}
            color={workout.completed ? Colors.success : Colors.textLight}
            onPress={() => console.log(`View ${workout.name}`)}
          />
        ))}
      </MinimalCard>
    </View>
  );

  const renderProgramsView = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Workout Programs" action="Browse All" />
      <MinimalCard style={{ marginTop: 8 }}>
        {workoutPrograms.map((program, index) => (
          <MinimalMetric
            key={index}
            icon="list-outline"
            title={`${program.name} • ${program.difficulty}`}
            value={`${program.weeks}w`}
            color={Colors.workout}
            onPress={() => console.log(`Start ${program.name}`)}
          />
        ))}
      </MinimalCard>
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
            colors={[Colors.workout]}
            tintColor={Colors.workout}
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
