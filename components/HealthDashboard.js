import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { healthService } from '../services/healthService';

const HealthMetricCard = ({ icon, title, value, unit, color = '#4A90E2', onPress }) => (
  <TouchableOpacity 
    style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: spacing.md,
      margin: spacing.xs,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={28} color={color} />
    <Text style={{
      fontSize: fonts.small,
      color: '#666',
      marginTop: spacing.xs,
      textAlign: 'center'
    }}>
      {title}
    </Text>
    <Text style={{
      fontSize: fonts.large,
      fontWeight: 'bold',
      color: '#1D1D1F',
      marginTop: spacing.xs
    }}>
      {value}
    </Text>
    <Text style={{
      fontSize: fonts.small,
      color: '#666'
    }}>
      {unit}
    </Text>
  </TouchableOpacity>
);

const WorkoutCard = ({ workout }) => (
  <View style={{
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: fonts.medium,
          fontWeight: '600',
          color: '#1D1D1F'
        }}>
          {workout.type}
        </Text>
        <Text style={{
          fontSize: fonts.small,
          color: '#666',
          marginTop: spacing.xs
        }}>
          {new Date(workout.date).toLocaleDateString()} • {workout.duration} min
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: fonts.medium,
          fontWeight: '600',
          color: '#FF6B6B'
        }}>
          {workout.calories} cal
        </Text>
        {workout.distance > 0 && (
          <Text style={{
            fontSize: fonts.small,
            color: '#666'
          }}>
            {workout.distance} km
          </Text>
        )}
      </View>
    </View>
  </View>
);

const HealthDashboard = ({ refreshControl }) => {
  const [healthData, setHealthData] = useState({
    steps: 0,
    caloriesBurned: 0,
    distance: 0,
    lastUpdated: null
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isHealthAvailable, setIsHealthAvailable] = useState(false);

  useEffect(() => {
    initializeHealth();
  }, []);

  const initializeHealth = async () => {
    try {
      setLoading(true);
      
      // Check if health data is available
      const available = await healthService.isHealthDataAvailable();
      setIsHealthAvailable(available);
      
      if (!available) {
        setLoading(false);
        return;
      }

      // Initialize health service
      const initialized = await healthService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize health service');
      }

      // Request permissions
      const permissionsGranted = await healthService.requestPermissions();
      setHasPermissions(permissionsGranted);

      if (permissionsGranted) {
        await loadHealthData();
      }
    } catch (error) {
      console.error('Health initialization failed:', error);
      Alert.alert(
        'Health Integration Error',
        'Failed to connect to health services. Some features may not be available.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      const [summary, workouts] = await Promise.all([
        healthService.getHealthSummary(),
        healthService.getWeeklyWorkouts()
      ]);

      setHealthData(summary);
      setRecentWorkouts(workouts);
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  };

  const handleRefresh = async () => {
    if (hasPermissions) {
      await loadHealthData();
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await healthService.requestPermissions();
      setHasPermissions(granted);
      
      if (granted) {
        await loadHealthData();
        Alert.alert(
          'Permissions Granted',
          `Successfully connected to ${healthService.getHealthPlatformName()}!`
        );
      } else {
        Alert.alert(
          'Permissions Denied',
          'Health data permissions are required to track your fitness metrics.'
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert(
        'Error',
        'Failed to request health permissions. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: spacing.lg 
      }}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{
          fontSize: fonts.medium,
          color: '#666',
          marginTop: spacing.md,
          textAlign: 'center'
        }}>
          Connecting to {healthService.getHealthPlatformName()}...
        </Text>
      </View>
    );
  }

  if (!isHealthAvailable) {
    return (
      <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: spacing.lg,
        margin: spacing.md,
        alignItems: 'center'
      }}>
        <Ionicons name="heart-outline" size={48} color="#ccc" />
        <Text style={{
          fontSize: fonts.medium,
          fontWeight: '600',
          color: '#1D1D1F',
          marginTop: spacing.md,
          textAlign: 'center'
        }}>
          Health Data Not Available
        </Text>
        <Text style={{
          fontSize: fonts.small,
          color: '#666',
          marginTop: spacing.sm,
          textAlign: 'center'
        }}>
          Health tracking is not supported on this device or platform.
        </Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: spacing.lg,
        margin: spacing.md,
        alignItems: 'center'
      }}>
        <Ionicons name="heart-outline" size={48} color="#4A90E2" />
        <Text style={{
          fontSize: fonts.medium,
          fontWeight: '600',
          color: '#1D1D1F',
          marginTop: spacing.md,
          textAlign: 'center'
        }}>
          Connect to {healthService.getHealthPlatformName()}
        </Text>
        <Text style={{
          fontSize: fonts.small,
          color: '#666',
          marginTop: spacing.sm,
          textAlign: 'center'
        }}>
          Track your steps, calories burned, and sync your workouts automatically.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#4A90E2',
            borderRadius: 8,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            marginTop: spacing.lg
          }}
          onPress={requestPermissions}
          activeOpacity={0.8}
        >
          <Text style={{
            color: 'white',
            fontSize: fonts.medium,
            fontWeight: '600'
          }}>
            Grant Permissions
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Health Metrics */}
      <View style={{
        backgroundColor: '#f8f9fa',
        padding: spacing.md,
        marginBottom: spacing.md
      }}>
        <Text style={{
          fontSize: fonts.large,
          fontWeight: 'bold',
          color: '#1D1D1F',
          marginBottom: spacing.md
        }}>
          Today's Activity
        </Text>
        
        <View style={{ flexDirection: 'row' }}>
          <HealthMetricCard
            icon="walk-outline"
            title="Steps"
            value={healthData.steps.toLocaleString()}
            unit="steps"
            color="#4A90E2"
            onPress={() => Alert.alert('Steps', `You've walked ${healthData.steps} steps today!`)}
          />
          <HealthMetricCard
            icon="flame-outline"
            title="Calories Burned"
            value={healthData.caloriesBurned}
            unit="kcal"
            color="#FF6B6B"
            onPress={() => Alert.alert('Calories', `You've burned ${healthData.caloriesBurned} calories today!`)}
          />
        </View>
        
        <View style={{ flexDirection: 'row' }}>
          <HealthMetricCard
            icon="location-outline"
            title="Distance"
            value={healthData.distance}
            unit="km"
            color="#50E3C2"
            onPress={() => Alert.alert('Distance', `You've traveled ${healthData.distance} km today!`)}
          />
          <HealthMetricCard
            icon="refresh-outline"
            title="Sync Data"
            value="Tap to"
            unit="refresh"
            color="#9013FE"
            onPress={handleRefresh}
          />
        </View>

        {healthData.lastUpdated && (
          <Text style={{
            fontSize: fonts.small,
            color: '#666',
            textAlign: 'center',
            marginTop: spacing.sm
          }}>
            Last updated: {new Date(healthData.lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <View style={{ padding: spacing.md }}>
          <Text style={{
            fontSize: fonts.large,
            fontWeight: 'bold',
            color: '#1D1D1F',
            marginBottom: spacing.md
          }}>
            Recent Workouts
          </Text>
          
          {recentWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </View>
      )}
    </View>
  );
};

export default HealthDashboard;
