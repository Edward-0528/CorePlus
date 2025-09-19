import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FitnessScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [steps, setSteps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const STORAGE_KEYS = {
    IS_CONNECTED: 'fitness_is_connected',
    STEPS: 'fitness_steps',
    CALORIES: 'fitness_calories',
    LAST_UPDATE: 'fitness_last_update',
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [connected] = await AsyncStorage.multiGet([
        STORAGE_KEYS.IS_CONNECTED,
      ]);

      if (connected[1] === 'true') {
        setIsConnected(true);
        // Keep steps and calories at 0 - no mock data
        setSteps(0);
        setCaloriesBurned(0);
      }
    } catch (error) {
      console.log('Failed to load stored fitness data:', error);
    }
  };

  const checkHealthKitAvailability = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Health is only available on iOS devices');
      return false;
    }

    // Check if this is a managed Expo build or bare workflow
    const isExpoManaged = Constants.executionEnvironment === 'storeClient' || 
                          Constants.executionEnvironment === 'standalone';
    
    if (!isExpoManaged && Constants.appOwnership === 'expo') {
      Alert.alert(
        'HealthKit Unavailable', 
        'Apple HealthKit integration requires a native iOS build. This feature will be available in future updates.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  const connectToAppleHealth = async () => {
    if (!checkHealthKitAvailability()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simply mark as connected without any mock data
      setIsConnected(true);
      
      // Store only the connection state - no mock data
      await AsyncStorage.setItem(STORAGE_KEYS.IS_CONNECTED, 'true');

      Alert.alert(
        'Connected Successfully', 
        'Connected to Apple Health! Note: Full HealthKit integration is coming in a future update.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Connection Failed', 'Unable to connect to Apple Health. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (!isConnected) return;

    // Don't update data - keep at 0 as requested
    Alert.alert('Info', 'Data refresh will be available when full HealthKit integration is implemented.');
  };

  const disconnect = async () => {
    Alert.alert(
      'Disconnect from Apple Health',
      'Are you sure you want to disconnect? Your fitness data will no longer be displayed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            setIsConnected(false);
            setSteps(0);
            setCaloriesBurned(0);
            
            // Clear stored data
            await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
          }
        }
      ]
    );
  };

  const StatusIndicator = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
      <Text style={styles.statusText}>
        {isConnected ? 'Connected to Apple Health' : 'Not Connected'}
      </Text>
    </View>
  );

  const MetricCard = ({ title, value, unit, icon }) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>
        {value}
        <Text style={styles.metricUnit}> {unit}</Text>
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Fitness</Text>
        
        <StatusIndicator />

        {!isConnected && (
          <>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectToAppleHealth}
              disabled={isLoading}
            >
              <Text style={styles.connectButtonText}>
                {isLoading ? 'Connecting...' : 'Connect to Apple Health'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Note: This fitness tab shows the interface with zero values until 
                full Apple HealthKit integration is implemented.
              </Text>
            </View>
          </>
        )}

        <View style={styles.metricsContainer}>
          <MetricCard
            title="Steps"
            value={isConnected ? steps.toLocaleString() : 0}
            unit="steps"
            icon="👣"
          />
          
          <MetricCard
            title="Calories Burned"
            value={isConnected ? caloriesBurned.toLocaleString() : 0}
            unit="cal"
            icon="🔥"
          />
        </View>

        {isConnected && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshData}
            >
              <Text style={styles.refreshButtonText}>Refresh Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  connectButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    backdropFilter: 'blur(10px)',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  disconnectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
    marginHorizontal: 4,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
};

export default FitnessScreen;
