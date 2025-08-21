import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, scaleWidth } from '../utils/responsive';
import { workoutService } from '../services/workoutService';

const CircularProgress = ({ size = 80, strokeWidth = 8, progress = 0, color = '#4A90E2' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: '#F0F0F0',
        position: 'absolute'
      }} />
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        position: 'absolute',
        transform: [{ rotate: `${(progress * 3.6) - 90}deg` }]
      }} />
      <Text style={{ fontSize: fonts.medium, fontWeight: 'bold', color: '#1D1D1F' }}>
        {Math.round(progress)}%
      </Text>
    </View>
  );
};

const QuickWorkoutModal = ({ visible, onClose, onSave }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!workoutName.trim()) {
      Alert.alert('Required Field', 'Please enter a workout name.');
      return;
    }

    onSave({
      name: workoutName,
      duration: parseInt(duration) || 0,
      caloriesBurned: parseInt(caloriesBurned) || 0,
      notes: notes.trim()
    });

    // Reset form
    setWorkoutName('');
    setDuration('');
    setCaloriesBurned('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={localStyles.modalContainer}>
        <View style={localStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={localStyles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={localStyles.modalTitle}>Log Workout</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={localStyles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={localStyles.modalContent}>
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.inputLabel}>Workout Name *</Text>
            <TextInput
              style={localStyles.textInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g., Morning Run, Push Day, Yoga"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={localStyles.inputRow}>
            <View style={[localStyles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={localStyles.inputLabel}>Duration (min)</Text>
              <TextInput
                style={localStyles.textInput}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
            <View style={[localStyles.inputContainer, { flex: 1 }]}>
              <Text style={localStyles.inputLabel}>Calories Burned</Text>
              <TextInput
                style={localStyles.textInput}
                value={caloriesBurned}
                onChangeText={setCaloriesBurned}
                placeholder="200"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={localStyles.inputContainer}>
            <Text style={localStyles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[localStyles.textInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did the workout feel? Any achievements?"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const WorkoutHistoryItem = ({ workout, onDelete }) => {
  const workoutDate = new Date(workout.workout_date);
  const isToday = workoutDate.toDateString() === new Date().toDateString();
  const isYesterday = workoutDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
  
  let dateLabel = workoutDate.toLocaleDateString();
  if (isToday) dateLabel = 'Today';
  else if (isYesterday) dateLabel = 'Yesterday';

  return (
    <View style={localStyles.historyItem}>
      <View style={localStyles.historyItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={localStyles.historyItemTitle}>{workout.workout_name}</Text>
          <Text style={localStyles.historyItemDate}>{dateLabel}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(workout.id)} style={localStyles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <View style={localStyles.historyItemStats}>
        {workout.total_duration > 0 && (
          <View style={localStyles.statItem}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={localStyles.statText}>{workout.total_duration} min</Text>
          </View>
        )}
        {workout.calories_burned > 0 && (
          <View style={localStyles.statItem}>
            <Ionicons name="flame-outline" size={16} color="#8E8E93" />
            <Text style={localStyles.statText}>{workout.calories_burned} cal</Text>
          </View>
        )}
      </View>
      
      {workout.notes && (
        <Text style={localStyles.historyItemNotes}>{workout.notes}</Text>
      )}
    </View>
  );
};

const WorkoutsScreen = ({ user, onLogout, loading, styles }) => {
  const [workoutStats, setWorkoutStats] = useState(null);
  const [todaysWorkouts, setTodaysWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(true);

  const loadWorkoutData = useCallback(async () => {
    if (!mounted) return; // Prevent updates if component is unmounted
    
    try {
      setIsLoading(true);
      
      // Load all workout data in parallel
      const [statsResult, todayResult, historyResult] = await Promise.all([
        workoutService.getUserWorkoutStats(),
        workoutService.getTodaysWorkouts(),
        workoutService.getWorkoutHistory(20) // Get last 20 workouts
      ]);

      // Only update state if component is still mounted
      if (!mounted) return;

      if (statsResult.success) {
        setWorkoutStats(statsResult.stats);
      }

      if (todayResult.success) {
        setTodaysWorkouts(todayResult.workouts);
      }

      if (historyResult.success) {
        setWorkoutHistory(historyResult.workouts);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      if (mounted) {
        // Only show alert if component is still mounted
        Alert.alert('Error', 'Failed to load workout data. Please try again.');
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    loadWorkoutData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      setMounted(false);
    };
  }, []);

  const handleQuickLogSave = async (workoutData) => {
    if (!mounted) return;
    
    try {
      const result = await workoutService.logQuickWorkout(workoutData);
      
      if (!mounted) return; // Check again after async operation
      
      if (result.success) {
        // Refresh data
        await loadWorkoutData();
        Alert.alert('Success', 'Workout logged successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      if (mounted) {
        Alert.alert('Error', 'Failed to log workout');
      }
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!mounted) return;
    
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!mounted) return;
            
            try {
              const result = await workoutService.deleteWorkout(workoutId);
              
              if (!mounted) return; // Check again after async operation
              
              if (result.success) {
                await loadWorkoutData();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete workout');
              }
            } catch (error) {
              console.error('Error deleting workout:', error);
              if (mounted) {
                Alert.alert('Error', 'Failed to delete workout');
              }
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    if (!mounted) return;
    
    setRefreshing(true);
    await loadWorkoutData();
    if (mounted) {
      setRefreshing(false);
    }
  };

  // Calculate weekly progress safely
  const weeklyProgress = workoutStats && todaysWorkouts ? 
    Math.min(100, (todaysWorkouts.length / Math.max(1, workoutStats.weekly_goal || 1)) * 100) : 0;

  if (isLoading) {
    return (
      <View style={[localStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={localStyles.loadingText}>Loading your workouts...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={localStyles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        <View style={localStyles.content}>
          {/* Today's Progress Card */}
          <View style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardTitle}>Today's Progress</Text>
              <CircularProgress 
                progress={weeklyProgress} 
                color="#4A90E2"
                size={60}
                strokeWidth={6}
              />
            </View>
            
            <Text style={localStyles.cardSubtitle}>
              {todaysWorkouts?.length || 0} of {workoutStats?.weekly_goal || 3} weekly workouts
            </Text>
            
            <View style={localStyles.buttonRow}>
              <TouchableOpacity 
                style={[localStyles.button, { backgroundColor: '#4A90E2' }]}
                onPress={() => setShowQuickLog(true)}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={localStyles.buttonText}>Log Workout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Workout Stats Card */}
          {workoutStats && (
            <View style={localStyles.card}>
              <Text style={localStyles.cardTitle}>Your Stats</Text>
              <View style={localStyles.statsGrid}>
                <View style={localStyles.statBox}>
                  <Text style={localStyles.statNumber}>{workoutStats.total_workouts || 0}</Text>
                  <Text style={localStyles.statLabel}>Total Workouts</Text>
                </View>
                <View style={localStyles.statBox}>
                  <Text style={localStyles.statNumber}>{workoutStats.current_streak || 0}</Text>
                  <Text style={localStyles.statLabel}>Current Streak</Text>
                </View>
                <View style={localStyles.statBox}>
                  <Text style={localStyles.statNumber}>{Math.round((workoutStats.total_workout_time || 0) / 60)}h</Text>
                  <Text style={localStyles.statLabel}>Total Time</Text>
                </View>
                <View style={localStyles.statBox}>
                  <Text style={localStyles.statNumber}>{workoutStats.total_calories_burned || 0}</Text>
                  <Text style={localStyles.statLabel}>Calories Burned</Text>
                </View>
              </View>
            </View>
          )}

          {/* Today's Workouts */}
          {todaysWorkouts?.length > 0 && (
            <View style={localStyles.card}>
              <Text style={localStyles.cardTitle}>Today's Workouts</Text>
              {todaysWorkouts.map((workout) => (
                <WorkoutHistoryItem
                  key={workout.id}
                  workout={workout}
                  onDelete={handleDeleteWorkout}
                />
              ))}
            </View>
          )}

          {/* Workout History */}
          <View style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardTitle}>Recent Workouts</Text>
              <TouchableOpacity>
                <Text style={localStyles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {workoutHistory?.length > 0 ? (
              workoutHistory.slice(0, 5).map((workout) => (
                <WorkoutHistoryItem
                  key={workout.id}
                  workout={workout}
                  onDelete={handleDeleteWorkout}
                />
              ))
            ) : (
              <Text style={localStyles.cardSubtitle}>No workout history yet. Start your fitness journey!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {mounted && (
        <QuickWorkoutModal
          visible={showQuickLog}
          onClose={() => setShowQuickLog(false)}
          onSave={handleQuickLogSave}
        />
      )}
    </>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fonts.regular,
    color: '#8E8E93',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: fonts.medium,
    color: '#4A90E2',
    fontWeight: '600',
  },
  // History item styles
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  historyItemTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  historyItemStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  historyItemNotes: {
    fontSize: fonts.small,
    color: '#666',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  modalCancel: {
    fontSize: fonts.medium,
    color: '#8E8E93',
  },
  modalSave: {
    fontSize: fonts.medium,
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fonts.medium,
    color: '#1D1D1F',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
});

export default WorkoutsScreen;
