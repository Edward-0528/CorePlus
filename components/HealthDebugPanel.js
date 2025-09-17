import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/AppColors';
import healthService from '../services/healthService';

/**
 * Health Debug Component
 * Temporary component to test Apple Health integration
 * Add this to any screen for quick health testing
 */
const HealthDebugPanel = () => {
  const [healthStatus, setHealthStatus] = useState({
    initialized: false,
    hasPermissions: false,
    loading: false,
    data: null,
    error: null
  });

  const testHealthInit = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🧪 Testing health service initialization...');
      const initialized = await healthService.initialize();
      console.log('✅ Health service initialized:', initialized);
      
      setHealthStatus(prev => ({ 
        ...prev, 
        initialized,
        loading: false 
      }));
      
    } catch (error) {
      console.error('❌ Health init failed:', error);
      setHealthStatus(prev => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };

  const testPermissions = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🧪 Testing health permissions...');
      const hasPermissions = await healthService.requestPermissions();
      console.log('✅ Health permissions granted:', hasPermissions);
      
      setHealthStatus(prev => ({ 
        ...prev, 
        hasPermissions,
        loading: false 
      }));
      
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      setHealthStatus(prev => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };

  const testHealthData = async () => {
    if (!healthStatus.hasPermissions) {
      Alert.alert('No Permissions', 'Please grant health permissions first');
      return;
    }

    setHealthStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🧪 Testing health data fetch...');
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      const [steps, calories, workouts] = await Promise.all([
        healthService.getSteps(startOfDay, new Date()),
        healthService.getCalories(startOfDay, new Date()),
        healthService.getWorkouts(startOfDay, new Date())
      ]);

      const data = { steps, calories, workouts: workouts?.length || 0 };
      console.log('✅ Health data fetched:', data);
      
      setHealthStatus(prev => ({ 
        ...prev, 
        data,
        loading: false 
      }));
      
    } catch (error) {
      console.error('❌ Health data fetch failed:', error);
      setHealthStatus(prev => ({ 
        ...prev, 
        error: error.message,
        loading: false 
      }));
    }
  };

  return (
    <View style={{
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="bug" size={20} color={AppColors.primary} />
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: AppColors.primary }}>
          Health Debug Panel
        </Text>
      </View>

      <ScrollView style={{ maxHeight: 200 }}>
        {/* Status Display */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Status:</Text>
          <Text style={{ fontSize: 14, color: healthStatus.error ? 'red' : 'green' }}>
            Initialized: {healthStatus.initialized ? '✅' : '❌'} | 
            Permissions: {healthStatus.hasPermissions ? '✅' : '❌'}
          </Text>
        </View>

        {/* Data Display */}
        {healthStatus.data && (
          <View style={{ marginBottom: 12, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Today's Data:</Text>
            <Text style={{ fontSize: 11 }}>Steps: {healthStatus.data.steps || 0}</Text>
            <Text style={{ fontSize: 11 }}>Calories: {healthStatus.data.calories || 0}</Text>
            <Text style={{ fontSize: 11 }}>Workouts: {healthStatus.data.workouts || 0}</Text>
          </View>
        )}

        {/* Error Display */}
        {healthStatus.error && (
          <View style={{ marginBottom: 12, padding: 8, backgroundColor: '#ffe6e6', borderRadius: 6 }}>
            <Text style={{ fontSize: 11, color: 'red' }}>{healthStatus.error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Test Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={{
            backgroundColor: AppColors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            flex: 1,
            marginRight: 4
          }}
          onPress={testHealthInit}
          disabled={healthStatus.loading}
        >
          <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>
            Init
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: AppColors.workout,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            flex: 1,
            marginHorizontal: 2
          }}
          onPress={testPermissions}
          disabled={healthStatus.loading}
        >
          <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>
            Permissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: AppColors.success,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            flex: 1,
            marginLeft: 4
          }}
          onPress={testHealthData}
          disabled={healthStatus.loading}
        >
          <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>
            Data
          </Text>
        </TouchableOpacity>
      </View>

      {healthStatus.loading && (
        <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#666' }}>
          Testing...
        </Text>
      )}
    </View>
  );
};

export default HealthDebugPanel;
