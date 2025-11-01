// Emergency debug test for immediate AsyncStorage checking
// Add this to a component temporarily to test current values

import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EmergencyAsyncStorageTest = () => {
  const [debugData, setDebugData] = useState(null);

  const checkNow = async () => {
    try {
      const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
      const lastLoginEmail = await AsyncStorage.getItem('lastLoginEmail');
      
      const data = {
        hasLoggedInBefore_raw: hasLoggedInBefore,
        hasLoggedInBefore_type: typeof hasLoggedInBefore,
        hasLoggedInBefore_boolean: !!hasLoggedInBefore,
        lastLoginEmail,
        shouldShowLogin: !!hasLoggedInBefore,
        timestamp: new Date().toISOString()
      };
      
      setDebugData(data);
      console.log('🚨 EMERGENCY DEBUG:', data);
      
      Alert.alert(
        'AsyncStorage Debug', 
        `hasLoggedInBefore: ${JSON.stringify(hasLoggedInBefore)}\n` +
        `Boolean: ${!!hasLoggedInBefore}\n` +
        `Should show: ${!!hasLoggedInBefore ? 'LOGIN' : 'LANDING'}`
      );
    } catch (error) {
      console.error('❌ Emergency debug error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const forceSetFlag = async () => {
    try {
      await AsyncStorage.setItem('hasLoggedInBefore', 'true');
      await AsyncStorage.setItem('lastLoginEmail', 'debug@test.com');
      Alert.alert('Success', 'Flag set! Now restart the app to test.');
      checkNow();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearFlag = async () => {
    try {
      await AsyncStorage.removeItem('hasLoggedInBefore');
      await AsyncStorage.removeItem('lastLoginEmail');
      Alert.alert('Success', 'Flag cleared! Now restart the app to test.');
      checkNow();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    checkNow();
  }, []);

  return (
    <View style={{ 
      position: 'absolute', 
      top: 100, 
      left: 10, 
      right: 10, 
      backgroundColor: 'rgba(255,0,0,0.9)', 
      padding: 15,
      zIndex: 9999,
      borderRadius: 10
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 10 }}>
        🚨 EMERGENCY DEBUG
      </Text>
      
      {debugData && (
        <View>
          <Text style={{ color: 'white', fontSize: 12 }}>
            hasLoggedInBefore: {JSON.stringify(debugData.hasLoggedInBefore_raw)}
          </Text>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Boolean: {debugData.hasLoggedInBefore_boolean ? 'true' : 'false'}
          </Text>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            Should show: {debugData.shouldShowLogin ? 'LOGIN' : 'LANDING'}
          </Text>
        </View>
      )}
      
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <Button title="Check" onPress={checkNow} />
        <Button title="Set Flag" onPress={forceSetFlag} />
        <Button title="Clear Flag" onPress={clearFlag} />
      </View>
    </View>
  );
};
