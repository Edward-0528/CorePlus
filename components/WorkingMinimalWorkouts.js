import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { 
  View as RNUIView, 
  Text, 
  TouchableOpacity
} from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';

// Define colors directly
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

const WorkingMinimalWorkouts = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

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

  const quickWorkouts = [
    { icon: 'barbell-outline', title: 'Strength', time: '30 min', color: AppColors.workout },
    { icon: 'walk-outline', title: 'Cardio', time: '20 min', color: AppColors.primary },
    { icon: 'body-outline', title: 'Yoga', time: '45 min', color: AppColors.nutrition },
  ];

  const todayWorkouts = [
    { id: 1, name: 'Morning Strength', time: '8:00 AM', duration: '45 min', completed: true },
    { id: 2, name: 'Evening Cardio', time: '6:00 PM', duration: '30 min', completed: false },
    { id: 3, name: 'Yoga Session', time: '7:30 PM', duration: '20 min', completed: false },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <View style={minimalStyles.header}>
      <View style={minimalStyles.headerContent}>
        <View>
          <Text style={minimalStyles.title}>Workouts</Text>
          <Text style={minimalStyles.subtitle}>Track your fitness journey</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="add-outline" size={24} color={AppColors.workout} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[minimalStyles.section, { marginTop: -8 }]}>
      <View style={minimalStyles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              minimalStyles.tab,
              activeTab === tab.id && minimalStyles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text 
              style={[
                minimalStyles.tabText,
                { color: activeTab === tab.id ? AppColors.workout : AppColors.textSecondary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTodayStats = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.statsContainer}>
        {todayStats.map((stat, index) => (
          <View key={index} style={minimalStyles.statItem}>
            <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={minimalStyles.statLabel}>{stat.label}</Text>
            {index < todayStats.length - 1 && <View style={minimalStyles.statDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickWorkouts = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Quick Start</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.actionsRow}>
        {quickWorkouts.map((workout, index) => (
          <TouchableOpacity key={index} style={minimalStyles.action} onPress={() => console.log(`Start ${workout.title}`)}>
            <Ionicons name={workout.icon} size={20} color={workout.color} />
            <Text style={minimalStyles.actionText}>{workout.title}</Text>
            <Text style={minimalStyles.actionSubtext}>{workout.time}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWorkoutProgress = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Today's Progress</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.card}>
        <View style={minimalStyles.cardRow}>
          <Text style={minimalStyles.cardLabel}>Workout Duration</Text>
          <Text style={[minimalStyles.cardValue, { color: AppColors.workout }]}>45 / 60 min</Text>
        </View>
        <View style={minimalStyles.progressBar}>
          <View style={[minimalStyles.progressFill, { width: '75%', backgroundColor: AppColors.workout }]} />
        </View>
        <Text style={minimalStyles.cardSubtext}>15 minutes remaining</Text>
      </View>
    </View>
  );

  const renderTodayWorkouts = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Today's Schedule</Text>
        <TouchableOpacity>
          <Text style={minimalStyles.sectionAction}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.card}>
        {todayWorkouts.map((workout, index) => (
          <View key={workout.id}>
            <TouchableOpacity style={minimalStyles.workoutRow}>
              <View style={minimalStyles.workoutInfo}>
                <Ionicons 
                  name={workout.completed ? "checkmark-circle" : "time-outline"} 
                  size={18} 
                  color={workout.completed ? AppColors.success : AppColors.textLight} 
                />
                <View style={minimalStyles.workoutDetails}>
                  <Text style={minimalStyles.workoutName}>{workout.name}</Text>
                  <Text style={minimalStyles.workoutTime}>{workout.time} • {workout.duration}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[
                  minimalStyles.workoutButton,
                  { backgroundColor: workout.completed ? AppColors.success : AppColors.workout }
                ]}
              >
                <Text style={minimalStyles.workoutButtonText}>
                  {workout.completed ? 'Done' : 'Start'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {index < todayWorkouts.length - 1 && <View style={minimalStyles.workoutDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <>
            {renderTodayStats()}
            {renderQuickWorkouts()}
            {renderWorkoutProgress()}
            {renderTodayWorkouts()}
          </>
        );
      case 'history':
        return (
          <View style={minimalStyles.emptyState}>
            <Ionicons name="time-outline" size={64} color={AppColors.border} />
            <Text style={minimalStyles.emptyText}>Workout history will appear here</Text>
          </View>
        );
      case 'programs':
        return (
          <View style={minimalStyles.emptyState}>
            <Ionicons name="list-outline" size={64} color={AppColors.border} />
            <Text style={minimalStyles.emptyText}>Browse workout programs</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={minimalStyles.container}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    color: AppColors.primary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: AppColors.workout,
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 1,
    backgroundColor: AppColors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  action: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  actionText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: 10,
    color: AppColors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 1,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutDetails: {
    marginLeft: 12,
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  workoutTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  workoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  workoutButtonText: {
    fontSize: 12,
    color: AppColors.white,
    fontWeight: '500',
  },
  workoutDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginTop: 8,
    width: '100%',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 16,
  },
});

export default WorkingMinimalWorkouts;
