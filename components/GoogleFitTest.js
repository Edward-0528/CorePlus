import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { healthService } from '../services/healthService';

export default function SamsungHealthTest() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);
  const [healthData, setHealthData] = useState({
    steps: 0,
    calories: 0,
    distance: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeSamsungHealth();
    checkEmulatorStatus();
  }, []);

  const checkEmulatorStatus = async () => {
    const emulatorDetected = await checkIfEmulator();
    setIsEmulator(emulatorDetected);
  };

  const initializeSamsungHealth = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing Samsung Health...');
      await healthService.initialize();
      setIsInitialized(true);
      console.log('Samsung Health initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Samsung Health:', error);
      Alert.alert('Error', 'Failed to initialize Samsung Health: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      console.log('Requesting permissions...');
      const granted = await healthService.requestPermissions();
      setHasPermissions(granted);
      
      if (granted) {
        Alert.alert('Success', 'Permissions granted! If this is an emulator, you\'ll see mock data. For real health data, test on a physical Samsung device.');
        await fetchHealthData();
      } else {
        // Check if this might be an emulator
        const isLikelyEmulator = await checkIfEmulator();
        if (isLikelyEmulator) {
          Alert.alert(
            'Emulator Detected', 
            'Samsung Health permissions are not available on emulators. This is normal! You should see mock data instead. For real testing, use a physical Samsung device with Samsung Health installed.',
            [
              { text: 'Try Mock Data', onPress: () => fetchHealthData() },
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert(
            'Permissions Denied', 
            'Health data permissions were denied. Please ensure:\n\n1. Samsung Health is installed and updated\n2. You have a Samsung account signed in\n3. Your Samsung Health app is configured\n\nFor setup help, see Samsung Health documentation'
          );
        }
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      const errorMessage = error.message || 'Unknown error';
      
      // Check if this is an emulator-related error
      if (errorMessage.includes('Samsung Health') || errorMessage.includes('authorization')) {
        Alert.alert(
          'Samsung Health Error', 
          'This error often occurs on emulators. For real testing:\n\n1. Use a physical Samsung device\n2. Ensure Samsung Health is installed and updated\n3. Have a Samsung account signed in\n\nMock data should still work!'
        );
      } else {
        Alert.alert('Error', 'Failed to request permissions: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfEmulator = async () => {
    try {
      // Simple emulator detection
      const { Dimensions } = require('react-native');
      const { width, height } = Dimensions.get('window');
      
      // Common emulator resolutions
      const emulatorResolutions = [
        [360, 640], [411, 731], [320, 568], [375, 667], [414, 736],
        [480, 800], [480, 854], [540, 960], [720, 1280], [1080, 1920]
      ];
      
      return emulatorResolutions.some(([w, h]) => 
        (width === w && height === h) || (width === h && height === w)
      );
    } catch (error) {
      return false;
    }
  };

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching health data...');
      
      const [steps, calories, distance] = await Promise.all([
        healthService.getTodaysSteps(),
        healthService.getTodaysCaloriesBurned(),
        healthService.getTodaysDistance()
      ]);

      setHealthData({ steps, calories, distance });
      console.log('Health data fetched:', { steps, calories, distance });
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      Alert.alert('Error', 'Failed to fetch health data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testWorkoutSync = async () => {
    try {
      setIsLoading(true);
      console.log('Testing workout sync...');
      
      const testWorkout = {
        name: 'Test Workout',
        duration: 30, // 30 minutes
        caloriesBurned: 200,
        date: new Date()
      };

      await healthService.syncWorkout(testWorkout);
      Alert.alert('Success', 'Workout synced successfully!');
      
      // Refresh health data
      await fetchHealthData();
    } catch (error) {
      console.error('Failed to sync workout:', error);
      Alert.alert('Error', 'Failed to sync workout: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Samsung Health Integration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Device: {isEmulator ? '🤖 Emulator (Mock Data)' : '📱 Physical Device'}
        </Text>
        <Text style={styles.statusText}>
          Initialized: {isInitialized ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Permissions: {hasPermissions ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Loading: {isLoading ? '⏳' : '✅'}
        </Text>
        {isEmulator && (
          <Text style={[styles.statusText, { color: '#ff9500', fontStyle: 'italic' }]}>
            ℹ️ Emulator detected - real Samsung Health features unavailable
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <Button
          title="Initialize Samsung Health"
          onPress={initializeSamsungHealth}
          disabled={isLoading}
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="Request Permissions"
          onPress={requestPermissions}
          disabled={isLoading || !isInitialized}
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="Fetch Health Data"
          onPress={fetchHealthData}
          disabled={isLoading || !hasPermissions}
        />
        <View style={styles.buttonSpacing} />
        <Button
          title="Test Workout Sync"
          onPress={testWorkoutSync}
          disabled={isLoading || !hasPermissions}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Data</Text>
        <Text style={styles.dataText}>Steps: {healthData.steps}</Text>
        <Text style={styles.dataText}>Calories: {healthData.calories}</Text>
        <Text style={styles.dataText}>Distance: {healthData.distance} meters</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  dataText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  buttonSpacing: {
    height: 10,
  },
});
