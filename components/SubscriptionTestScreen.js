import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import subscriptionTestingService from '../services/subscriptionTestingService';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const SubscriptionTestScreen = () => {
  const { user } = useAppContext();
  const { subscriptionStatus, isPremiumUser, checkFeatureUsage } = useFeatureAccess();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testFeature = async (featureName) => {
    setIsLoading(true);
    try {
      const result = await checkFeatureUsage(featureName, { showPaywall: false });
      addTestResult(
        `${featureName}: ${result.canUse ? 'Access Granted' : 'Access Denied'}`,
        result.canUse ? 'success' : 'error'
      );
      if (result.usageInfo) {
        addTestResult(`Usage: ${result.usageInfo.used}/${result.usageInfo.limit}`, 'info');
      }
    } catch (error) {
      addTestResult(`Error testing ${featureName}: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const simulatePremium = async () => {
    setIsLoading(true);
    try {
      const success = await subscriptionTestingService.simulatePremiumSubscription(user.id, 'pro', 30);
      addTestResult(
        success ? 'Premium subscription simulated!' : 'Failed to simulate premium',
        success ? 'success' : 'error'
      );
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const simulateExpiration = async () => {
    setIsLoading(true);
    try {
      const success = await subscriptionTestingService.simulateSubscriptionExpiration(user.id);
      addTestResult(
        success ? 'Subscription expired!' : 'Failed to simulate expiration',
        success ? 'success' : 'error'
      );
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const resetToFree = async () => {
    setIsLoading(true);
    try {
      const success = await subscriptionTestingService.resetToFreeTier(user.id);
      addTestResult(
        success ? 'Reset to free tier!' : 'Failed to reset',
        success ? 'success' : 'error'
      );
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const simulateUsage = async (featureName, count = 5) => {
    setIsLoading(true);
    try {
      const usageCount = await subscriptionTestingService.simulateDailyUsage(user.id, featureName, count);
      addTestResult(`Simulated ${count} ${featureName} uses. Total: ${usageCount}`, 'info');
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const runFullTest = async () => {
    setIsLoading(true);
    clearResults();
    addTestResult('Starting comprehensive test suite...', 'info');
    
    try {
      const success = await subscriptionTestingService.runTestSuite(user.id);
      addTestResult(
        success ? 'Test suite completed successfully!' : 'Test suite failed!',
        success ? 'success' : 'error'
      );
    } catch (error) {
      addTestResult(`Test suite error: ${error.message}`, 'error');
    }
    setIsLoading(false);
  };

  const getStatusColor = () => {
    if (isPremiumUser) return '#4CAF50';
    return '#FF9800';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription Testing</Text>
        <Text style={styles.subtitle}>Test your RevenueCat integration</Text>
      </View>

      {/* Current Status */}
      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <Text style={styles.statusTitle}>Current Status</Text>
        <Text style={styles.statusText}>
          User: {user?.email}
        </Text>
        <Text style={styles.statusText}>
          Tier: {subscriptionStatus?.tier || 'free'}
        </Text>
        <Text style={styles.statusText}>
          Status: {subscriptionStatus?.status || 'inactive'}
        </Text>
        <Text style={styles.statusText}>
          Premium: {isPremiumUser ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Tests</Text>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={simulatePremium}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Simulate Premium Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton} 
          onPress={simulateExpiration}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Simulate Subscription Expiration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton} 
          onPress={resetToFree}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Reset to Free Tier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Access Tests</Text>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={() => testFeature('ai_scans')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test AI Scans Access</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton} 
          onPress={() => testFeature('meal_planning')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Meal Planning Access</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton} 
          onPress={() => simulateUsage('ai_scans', 5)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Simulate 5 AI Scans</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comprehensive Test</Text>
        
        <TouchableOpacity 
          style={[styles.testButton, styles.primaryButton]} 
          onPress={runFullTest}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            Run Full Test Suite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <ScrollView style={styles.resultsContainer}>
            {testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
                <Text style={[
                  styles.resultText,
                  { color: result.type === 'success' ? '#4CAF50' : 
                           result.type === 'error' ? '#f44336' : '#666' }
                ]}>
                  {result.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
  },
  clearButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsSection: {
    margin: 20,
    marginTop: 0,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 300,
    padding: 16,
  },
  resultItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SubscriptionTestScreen;
