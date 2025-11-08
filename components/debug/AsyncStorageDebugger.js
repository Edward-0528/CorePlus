import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AsyncStorageDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);

  const checkAsyncStorage = async () => {
    try {
      const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
      const lastLoginEmail = await AsyncStorage.getItem('lastLoginEmail');
      
      const info = {
        hasLoggedInBefore_raw: hasLoggedInBefore,
        hasLoggedInBefore_type: typeof hasLoggedInBefore,
        hasLoggedInBefore_boolean: !!hasLoggedInBefore,
        lastLoginEmail,
        shouldShowLogin: !!hasLoggedInBefore,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
      console.log('🔍 AsyncStorage Debug:', info);
    } catch (error) {
      console.error('❌ AsyncStorage debug error:', error);
    }
  };

  const setTestData = async () => {
    try {
      await AsyncStorage.setItem('hasLoggedInBefore', 'true');
      await AsyncStorage.setItem('lastLoginEmail', 'test@example.com');
      Alert.alert('Success', 'Test data set! Now check values.');
      checkAsyncStorage();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearTestData = async () => {
    try {
      await AsyncStorage.removeItem('hasLoggedInBefore');
      await AsyncStorage.removeItem('lastLoginEmail');
      Alert.alert('Success', 'Test data cleared! Now check values.');
      checkAsyncStorage();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    checkAsyncStorage();
  }, []);

  if (!debugInfo) {
    return (
      <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
        <Text>Loading debug info...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>AsyncStorage Debug</Text>
      <Text>hasLoggedInBefore (raw): {JSON.stringify(debugInfo.hasLoggedInBefore_raw)}</Text>
      <Text>hasLoggedInBefore (type): {debugInfo.hasLoggedInBefore_type}</Text>
      <Text>hasLoggedInBefore (boolean): {JSON.stringify(debugInfo.hasLoggedInBefore_boolean)}</Text>
      <Text>lastLoginEmail: {JSON.stringify(debugInfo.lastLoginEmail)}</Text>
      <Text style={{ fontWeight: 'bold', color: debugInfo.shouldShowLogin ? 'green' : 'red' }}>
        Should show: {debugInfo.shouldShowLogin ? 'LOGIN SCREEN' : 'LANDING SCREEN'}
      </Text>
      <Text style={{ fontSize: 10, marginTop: 5 }}>Updated: {debugInfo.timestamp}</Text>
      
      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <TouchableOpacity 
          onPress={setTestData}
          style={{ backgroundColor: 'blue', padding: 10, marginRight: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Set Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={clearTestData}
          style={{ backgroundColor: 'red', padding: 10, marginRight: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Clear Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={checkAsyncStorage}
          style={{ backgroundColor: 'green', padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
