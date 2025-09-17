import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Simple test dashboard to isolate render issues
const TestDashboard = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderSimpleHeader = () => (
    <View style={testStyles.header}>
      <View style={testStyles.headerContent}>
        <View>
          <Text style={testStyles.title}>
            Good morning, {user?.user_metadata?.first_name || 'User'}
          </Text>
          <Text style={testStyles.subtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#6C757D" />
        </TouchableOpacity>
      </View>
      <View style={testStyles.separator} />
    </View>
  );

  const renderSimpleCard = () => (
    <View style={testStyles.card}>
      <Text style={testStyles.cardTitle}>Daily Calories</Text>
      <View style={testStyles.cardContent}>
        <Text style={testStyles.cardValue}>1,850</Text>
        <Text style={testStyles.cardUnit}>/ 2,000 cal</Text>
      </View>
      <View style={testStyles.progressBar}>
        <View style={[testStyles.progressFill, { width: '75%' }]} />
      </View>
      <Text style={testStyles.cardSubtext}>150 calories remaining</Text>
    </View>
  );

  return (
    <SafeAreaView style={testStyles.container}>
      {renderSimpleHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        <View style={testStyles.content}>
          {renderSimpleCard()}
          
          <View style={testStyles.card}>
            <Text style={testStyles.cardTitle}>Quick Actions</Text>
            <View style={testStyles.actionRow}>
              <TouchableOpacity style={testStyles.action}>
                <Ionicons name="restaurant-outline" size={20} color="#50E3C2" />
                <Text style={testStyles.actionText}>Log Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={testStyles.action}>
                <Ionicons name="fitness-outline" size={20} color="#FF6B6B" />
                <Text style={testStyles.actionText}>Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={testStyles.action}>
                <Ionicons name="water-outline" size={20} color="#4A90E2" />
                <Text style={testStyles.actionText}>Water</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const testStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E9ECEF',
    width: '100%',
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 4,
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  cardUnit: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E9ECEF',
    borderRadius: 1,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#50E3C2',
    borderRadius: 1,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6C757D',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  action: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  actionText: {
    fontSize: 11,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TestDashboard;
