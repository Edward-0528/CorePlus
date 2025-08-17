import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, fonts } from '../utils/responsive';

const WorkoutsScreen = ({ user, onLogout, loading, styles }) => {
  return (
    <ScrollView style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.title}>Workouts</Text>
        <Text style={localStyles.subtitle}>Track your fitness journey</Text>
      </View>
      
      <View style={localStyles.content}>
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Today's Workout</Text>
          <Text style={localStyles.cardSubtitle}>No workout planned yet</Text>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Recent Workouts</Text>
          <Text style={localStyles.cardSubtitle}>Your workout history will appear here</Text>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Workout Plans</Text>
          <Text style={localStyles.cardSubtitle}>Browse available workout programs</Text>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Explore Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: fonts.hero,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.regular,
    color: '#8E8E93',
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fonts.regular,
    color: '#8E8E93',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WorkoutsScreen;
