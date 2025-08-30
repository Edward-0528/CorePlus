import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StyleSheet,
  RefreshControl,
  Platform
} from 'react-native';
import { healthService } from '../services/healthService';

const HealthServiceTest = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    initializeHealthService();
  }, []);

  const initializeHealthService = async () => {
    try {
      setLoading(true);
      console.log('Initializing health service...');
      
      const initialized = await healthService.initialize();
      setIsInitialized(initialized);
      
      if (initialized) {
        const permissions = await healthService.requestPermissions();
        setPermissionsGranted(permissions);
        
        if (permissions) {
          await fetchHealthData();
        }
      }
    } catch (error) {
      console.error('Health service initialization error:', error);
      showErrorDialog('Initialization Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      console.log('Fetching health data...');
      
      const healthSummary = await healthService.getHealthSummary();
      console.log('Health summary received:', healthSummary);
      
      setHealthData(healthSummary);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      showErrorDialog('Data Fetch Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testWorkoutSync = async () => {
    try {
      setLoading(true);
      
      const workoutData = {
        name: 'Test Workout',
        type: 'running',
        duration: 30,
        caloriesBurned: 250,
        distance: 3.5,
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString()
      };
      
      const result = await healthService.syncWorkout(workoutData);
      
      Alert.alert(
        'Workout Synced Successfully',
        `Platform: ${result.platform}\nWorkout ID: ${result.workoutId}`,
        [{ text: 'OK', onPress: () => fetchHealthData() }]
      );
    } catch (error) {
      console.error('Workout sync failed:', error);
      showErrorDialog('Workout Sync Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showErrorDialog = (title, message) => {
    const errorInfo = getErrorMessage(message);
    
    Alert.alert(
      title,
      errorInfo.message,
      [
        { 
          text: 'Troubleshoot', 
          onPress: () => Alert.alert('Troubleshooting Tips', errorInfo.troubleshooting)
        },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const getErrorMessage = (error) => {
    const errorString = error?.toString() || 'Unknown error';
    
    if (errorString.includes('SAMSUNG_HEALTH_API_UNAVAILABLE')) {
      return {
        message: 'Samsung Health API methods are not available on this device or in this environment.',
        troubleshooting: '• This is normal in Expo Go or emulators\n• The app will use manual tracking instead\n• On real Samsung devices, ensure Samsung Health is installed and updated'
      };
    } else if (errorString.includes('SAMSUNG_HEALTH_NO_DATA')) {
      return {
        message: 'Samsung Health returned no data for the requested period.',
        troubleshooting: '• Try walking a few steps and check again\n• Open Samsung Health app and sync data\n• Grant all permissions in Samsung Health settings'
      };
    } else if (errorString.includes('PERMISSION_DENIED')) {
      return {
        message: 'Health data permissions were not granted.',
        troubleshooting: '• Open app settings and grant health permissions\n• Check Samsung Health permissions\n• Restart the app after granting permissions'
      };
    } else if (errorString.includes('undefined is not a function')) {
      return {
        message: 'Health service method not available in current environment.',
        troubleshooting: '• This is expected in Expo Go\n• The app will use estimated data instead\n• Full functionality available in production builds'
      };
    } else {
      return {
        message: `Health service error: ${errorString}`,
        troubleshooting: '• Check if health apps are installed\n• Restart the health service\n• Contact support if issue persists'
      };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Unified Health Service Test</Text>
        <Text style={styles.subtitle}>
          Platform: {Platform.OS === 'ios' ? 'iOS (Apple Health)' : 'Android (Samsung Health)'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Service Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Initialized:</Text>
          <Text style={[styles.statusValue, { color: isInitialized ? '#4CAF50' : '#F44336' }]}>
            {isInitialized ? '✅ Yes' : '❌ No'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permissions:</Text>
          <Text style={[styles.statusValue, { color: permissionsGranted ? '#4CAF50' : '#F44336' }]}>
            {permissionsGranted ? '✅ Granted' : '❌ Denied'}
          </Text>
        </View>
      </View>

      {healthData && (
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Today's Health Data</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Steps:</Text>
            <Text style={styles.metricValue}>
              {healthData.today?.steps?.toLocaleString() || 'N/A'}
            </Text>
            <Text style={styles.sourceText}>
              ({healthData.today?.stepsSource || 'Unknown'})
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Calories:</Text>
            <Text style={styles.metricValue}>
              {healthData.today?.calories || 'N/A'} kcal
            </Text>
            <Text style={styles.sourceText}>
              ({healthData.today?.caloriesSource || 'Unknown'})
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Distance:</Text>
            <Text style={styles.metricValue}>
              {healthData.today?.distance || 'N/A'} km
            </Text>
            <Text style={styles.sourceText}>
              ({healthData.today?.distanceSource || 'Unknown'})
            </Text>
          </View>
        </View>
      )}

      {healthData?.thisWeek && (
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>This Week's Workouts</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Workouts:</Text>
            <Text style={styles.metricValue}>
              {healthData.thisWeek.workouts || 0}
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Calories:</Text>
            <Text style={styles.metricValue}>
              {healthData.thisWeek.totalCalories || 0} kcal
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Duration:</Text>
            <Text style={styles.metricValue}>
              {healthData.thisWeek.totalDuration || 0} min
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={initializeHealthService}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Initializing...' : 'Reinitialize Health Service'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={fetchHealthData}
          disabled={loading || !isInitialized}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Refresh Health Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.accentButton]} 
          onPress={testWorkoutSync}
          disabled={loading || !isInitialized}
        >
          <Text style={styles.buttonText}>
            Test Workout Sync
          </Text>
        </TouchableOpacity>
      </View>

      {healthData && (
        <View style={styles.debugCard}>
          <Text style={styles.cardTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Platform: {healthData.platform}
          </Text>
          <Text style={styles.debugText}>
            Last Updated: {new Date(healthData.lastUpdated).toLocaleString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  accentButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default HealthServiceTest;
