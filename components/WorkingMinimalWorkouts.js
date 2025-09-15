import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Modal, Alert, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthService } from '../services/healthService';
import { localWorkoutService } from '../services/localWorkoutService';
import { WorkoutSessionProvider, useWorkoutSession } from '../contexts/WorkoutSessionContext';
import NumberPadModal from './NumberPadModal';

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
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthPlatform, setHealthPlatform] = useState('');
  const { startTemplate, activeSession, currentItem, timer, advance, logSet, getExerciseSetLogs, performedSets, stopSession, completeSession, progress } = useWorkoutSession();
  const [padVisible, setPadVisible] = useState(false);
  const [padField, setPadField] = useState(null);

  // Check health connection status on component mount
  useEffect(() => {
    checkHealthConnection();
  }, []);

  const checkHealthConnection = async () => {
    try {
      setHealthLoading(true);
      const platformName = healthService.getHealthPlatformName();
      setHealthPlatform(platformName);
      
      const isAvailable = await healthService.isHealthDataAvailable();
      if (isAvailable) {
        // Check if already initialized and has permissions
        setHealthConnected(healthService.isInitialized && healthService.hasPermissions);
      } else {
        setHealthConnected(false);
      }
    } catch (error) {
      console.error('Error checking health connection:', error);
      setHealthConnected(false);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleHealthConnect = async () => {
    try {
      setHealthLoading(true);
      await healthService.initialize();
      const hasPermissions = await healthService.requestAppleHealthPermissions();
      setHealthConnected(hasPermissions);
    } catch (error) {
      console.error('Error connecting to health:', error);
      setHealthConnected(false);
    } finally {
      setHealthLoading(false);
    }
  };

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

  const quickWorkouts = localWorkoutService.listTemplates().map(t => ({
    id: t.id,
    icon: t.category === 'Strength' ? 'barbell-outline' : t.category === 'Cardio' ? 'walk-outline' : 'body-outline',
    title: t.title,
    time: `${t.EstimatedDurationMinutes} min`,
    color: t.category === 'Strength' ? AppColors.workout : t.category === 'Cardio' ? AppColors.primary : AppColors.nutrition
  }));

  const todayWorkouts = [
    { id: 1, name: 'Morning Strength', time: '8:00 AM', duration: '45 min', completed: true },
    { id: 2, name: 'Evening Cardio', time: '6:00 PM', duration: '30 min', completed: false },
    { id: 3, name: 'Yoga Session', time: '7:30 PM', duration: '20 min', completed: false },
  ];

  const [setInputs, setSetInputs] = useState({ reps: '', weight: '' });

  const handleLogCurrentSet = () => {
    if (!currentItem?.exerciseId) return;
    logSet({ exerciseId: currentItem.exerciseId, setIndex: activeSession.setIndex, reps: Number(setInputs.reps)||0, weight: Number(setInputs.weight)||0, durationMs: (currentItem.holdSeconds||0)*1000 });
    setSetInputs({ reps: '', weight: '' });
  };

  const renderMiniSessionBar = () => {
    if (!activeSession || activeSession.completed) return null;
    return (
      <TouchableOpacity style={minimalStyles.sessionBar} onPress={()=>{ /* Could expand future modal */ }} activeOpacity={0.8}>
        <Text style={minimalStyles.sessionBarText}>Session: Block {progress?.block}/{progress?.totalBlocks} • {progress?.currentBlockType} • Ex {progress?.exerciseIndex}</Text>
        {timer.mode !== 'idle' && <Text style={minimalStyles.sessionBarTimer}>{Math.ceil(timer.remaining/1000)}s</Text>}
      </TouchableOpacity>
    );
  };

  const renderActiveSessionDetails = () => (
    <View style={minimalStyles.card}>
      <Text style={minimalStyles.cardLabel}>{currentItem?.exercise?.name || currentItem?.exerciseId || 'Loading...'}</Text>
      {timer?.mode !== 'idle' && (
        <Text style={minimalStyles.cardSubtext}>{timer.mode.toUpperCase()} • {Math.ceil((timer.remaining||0)/1000)}s remaining</Text>
      )}
      {currentItem?.mode === 'strength' && (
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              <Text style={minimalStyles.inputLabel}>Reps</Text>
              <TouchableOpacity style={minimalStyles.inputBox} onPress={()=>openPad('reps')}><Text>{setInputs.reps || 'Tap'}</Text></TouchableOpacity>
            </View>
            <View style={{ flex:1 }}>
              <Text style={minimalStyles.inputLabel}>Weight</Text>
              <TouchableOpacity style={minimalStyles.inputBox} onPress={()=>openPad('weight')}><Text>{setInputs.weight || 'Tap'}</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={[minimalStyles.logButton]} onPress={handleLogCurrentSet}>
            <Text style={minimalStyles.logButtonText}>Log Set</Text>
          </TouchableOpacity>
          {getExerciseSetLogs(currentItem.exerciseId).length > 0 && (
            <Text style={minimalStyles.cardSubtext}>{getExerciseSetLogs(currentItem.exerciseId).length} sets logged</Text>
          )}
        </View>
      )}
      <View style={{ flexDirection:'row', marginTop:16, gap:12 }}>
        <TouchableOpacity style={[minimalStyles.action, { flex:1 }]} onPress={advance}>
          <Text style={minimalStyles.actionText}>{currentItem ? 'Next' : 'Finish'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[minimalStyles.action, { flex:1, backgroundColor:'#eee' }]} onPress={stopSession}>
          <Text style={[minimalStyles.actionText,{ color:'#444' }]}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleStartQuickWorkout = (templateId) => {
    if (startTemplate) startTemplate(templateId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => {
    const getSubtitleText = () => {
      if (healthLoading) {
        return "Checking health connection...";
      }
      if (healthConnected) {
        return `Connected to ${healthPlatform}`;
      }
      return `Tap to connect to ${healthPlatform}`;
    };

    const getSubtitleColor = () => {
      if (healthLoading) {
        return AppColors.textSecondary;
      }
      if (healthConnected) {
        return AppColors.success;
      }
      return AppColors.workout;
    };

    return (
      <View style={minimalStyles.header}>
        <View style={minimalStyles.headerContent}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={healthConnected ? null : handleHealthConnect}
            activeOpacity={healthConnected ? 1 : 0.7}
          >
            <Text style={minimalStyles.title}>Workouts</Text>
            <Text style={[minimalStyles.subtitle, { color: getSubtitleColor(), fontSize: 12 }]}>
              {getSubtitleText()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="add-outline" size={24} color={AppColors.workout} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={minimalStyles.sectionTitle}>{activeSession ? 'Active Session' : 'Quick Start'}</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      {activeSession ? renderActiveSessionDetails() : (
        <View style={minimalStyles.actionsRow}>
          {quickWorkouts.map((workout) => (
            <TouchableOpacity key={workout.id} style={minimalStyles.action} onPress={() => handleStartQuickWorkout(workout.id)}>
              <Ionicons name={workout.icon} size={20} color={workout.color} />
              <Text style={minimalStyles.actionText}>{workout.title}</Text>
              <Text style={minimalStyles.actionSubtext}>{workout.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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

  const openPad = (field) => { setPadField(field); setPadVisible(true); };
  const closePad = () => { setPadVisible(false); setPadField(null); };

  const confirmPad = () => { closePad(); };

  return (
    <View style={minimalStyles.container}>
      {renderHeader()}
      {renderMiniSessionBar()}
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
      <NumberPadModal 
        visible={padVisible}
        label={padField === 'reps' ? 'Reps' : 'Weight'}
        value={padField ? (padField === 'reps' ? setInputs.reps : setInputs.weight) : ''}
        onChange={(v)=> setSetInputs(prev => ({ ...prev, [padField]: v }))}
        onClose={closePad}
        onConfirm={confirmPad}
      />
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
  sessionBar: {
    marginHorizontal:20,
    marginTop:8,
    backgroundColor: AppColors.white,
    borderWidth:1,
    borderColor: AppColors.border,
    borderRadius:6,
    padding:10,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center'
  },
  sessionBarText: { fontSize:12, color:AppColors.textPrimary, fontWeight:'500' },
  sessionBarTimer: { fontSize:12, color:AppColors.workout, fontWeight:'600' },
  inputLabel: { fontSize:11, color:AppColors.textSecondary, marginBottom:4 },
  inputBox: { backgroundColor:'#F2F2F2', borderRadius:4, padding:12, alignItems:'center' },
  logButton: { marginTop:12, backgroundColor:AppColors.workout, borderRadius:4, paddingVertical:10, alignItems:'center' },
  logButtonText: { color:'#fff', fontWeight:'600', fontSize:13 },
});

export default function WrappedWorkouts(props){
  return (
    <WorkoutSessionProvider>
      <WorkingMinimalWorkouts {...props} />
    </WorkoutSessionProvider>
  );
}

export { WorkingMinimalWorkouts };
