import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { authService } from '../authService';
import { revenueCatService } from '../services/revenueCatService';

const DebugScreen = () => {
  const [supabaseUserId, setSupabaseUserId] = useState(null);
  const [revenueCatUserId, setRevenueCatUserId] = useState(null);
  const [isRevenueCatInitialized, setIsRevenueCatInitialized] = useState(false);
  const [entitlements, setEntitlements] = useState(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Fetch Supabase user ID
        const user = await authService.getCurrentUser();
        setSupabaseUserId(user?.id || 'No user logged in');

        // Check RevenueCat initialization
        setIsRevenueCatInitialized(revenueCatService.isInitialized);

        // Fetch RevenueCat user ID and entitlements
        if (revenueCatService.isInitialized) {
          const customerInfo = await revenueCatService.refreshCustomerInfo();
          setRevenueCatUserId(customerInfo?.originalAppUserId || 'No user ID');
          setEntitlements(customerInfo?.entitlements?.active || {});
        } else {
          setRevenueCatUserId('RevenueCat not initialized');
          setEntitlements(null);
        }
      } catch (error) {
        console.error('Error fetching debug info:', error);
      }
    };

    fetchDebugInfo();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Supabase User ID:</Text>
        <Text style={styles.value}>{supabaseUserId}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>RevenueCat User ID:</Text>
        <Text style={styles.value}>{revenueCatUserId}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>RevenueCat Initialized:</Text>
        <Text style={styles.value}>{isRevenueCatInitialized ? 'True' : 'False'}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Active Entitlements:</Text>
        <Text style={styles.value}>{entitlements ? JSON.stringify(entitlements, null, 2) : 'None'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  value: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
  },
});

export default DebugScreen;
