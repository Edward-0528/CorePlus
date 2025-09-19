import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { authService } from '../authService';
import { socialAuthService } from '../socialAuthService';
import { revenueCatService } from '../services/revenueCatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DebugAuthScreen = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [testing, setTesting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Intercept console.log to capture authentication logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (level, args) => {
      const message = args.join(' ');
      // Only capture auth-related logs
      if (message.includes('🔐') || message.includes('🔄') || message.includes('✅') || 
          message.includes('❌') || message.includes('⚠️') || message.includes('💰') ||
          message.includes('🎯') || message.includes('📡') || message.includes('⏱️')) {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-50), { // Keep last 50 logs
          timestamp,
          level,
          message,
          id: Date.now() + Math.random()
        }]);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLog('error', args);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const testInitializeSession = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      console.log('🔍 [DEBUG] Starting session initialization test...');
      const startTime = Date.now();
      
      const result = await authService.initializeSession();
      const endTime = Date.now();
      
      console.log(`🔍 [DEBUG] Session test completed in ${endTime - startTime}ms`);
      console.log('🔍 [DEBUG] Result:', JSON.stringify(result, null, 2));
      
      setSessionInfo({
        duration: endTime - startTime,
        success: result.success,
        error: result.error,
        hasUser: !!result.user,
        restored: result.restored
      });
      
    } catch (error) {
      console.error('🔍 [DEBUG] Session test failed:', error);
      setSessionInfo({
        duration: 'Failed',
        success: false,
        error: error.message,
        hasUser: false,
        restored: false
      });
    } finally {
      setTesting(false);
    }
  };

  const testRevenueCatSync = async () => {
    setTesting(true);
    try {
      console.log('🔍 [DEBUG] Testing RevenueCat user sync...');
      const startTime = Date.now();
      
      // Get current user
      const { data: { user } } = await authService.getCurrentUser();
      if (!user) {
        console.log('🔍 [DEBUG] No authenticated user found');
        return;
      }
      
      console.log('🔍 [DEBUG] Current user:', user.id, user.email);
      
      // Test RevenueCat user ID setting
      await revenueCatService.setUserID(user.id);
      console.log('🔍 [DEBUG] RevenueCat user ID set');
      
      // Test subscription service initialization
      const { default: userSubscriptionService } = await import('../services/userSubscriptionService');
      await userSubscriptionService.initializeForUser(user);
      console.log('🔍 [DEBUG] User subscription service initialized');
      
      const endTime = Date.now();
      console.log(`🔍 [DEBUG] RevenueCat sync completed in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('🔍 [DEBUG] RevenueCat sync test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const clearStoredSession = async () => {
    try {
      await AsyncStorage.multiRemove(['USER_DATA', 'AUTH_STATE']);
      console.log('🔍 [DEBUG] Cleared stored session data');
      Alert.alert('Success', 'Stored session data cleared');
    } catch (error) {
      console.error('🔍 [DEBUG] Failed to clear session:', error);
      Alert.alert('Error', 'Failed to clear session data');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      default: return '#333';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Authentication Debug</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          onPress={testInitializeSession} 
          disabled={testing}
          style={[styles.button, testing && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Test Session Init'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testRevenueCatSync} 
          disabled={testing}
          style={[styles.button, testing && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Test RC Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={clearStoredSession}
          style={[styles.button, styles.warningButton]}
        >
          <Text style={styles.buttonText}>Clear Session</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={clearLogs}
          style={[styles.button, styles.secondaryButton]}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {sessionInfo && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sectionTitle}>Last Session Test:</Text>
          <Text style={styles.infoText}>Duration: {sessionInfo.duration}ms</Text>
          <Text style={styles.infoText}>Success: {sessionInfo.success ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Has User: {sessionInfo.hasUser ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Restored: {sessionInfo.restored ? 'Yes' : 'No'}</Text>
          {sessionInfo.error && (
            <Text style={[styles.infoText, styles.errorText]}>
              Error: {sessionInfo.error}
            </Text>
          )}
        </View>
      )}

      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Authentication Logs:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.map(log => (
            <View key={log.id} style={styles.logEntry}>
              <Text style={styles.logTimestamp}>[{log.timestamp}]</Text>
              <Text style={[styles.logMessage, { color: getLevelColor(log.level) }]}>
                {log.message}
              </Text>
            </View>
          ))}
          {logs.length === 0 && (
            <Text style={styles.emptyLogs}>No authentication logs captured yet.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  warningButton: {
    backgroundColor: '#ff4444',
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  errorText: {
    color: '#ff4444',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  logsScroll: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 10,
    color: '#666',
  },
  logMessage: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyLogs: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default DebugAuthScreen;
