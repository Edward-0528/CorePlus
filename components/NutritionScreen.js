import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, fonts } from '../utils/responsive';

const NutritionScreen = ({ user, onLogout, loading, styles }) => {
  return (
    <ScrollView style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.title}>Nutrition</Text>
        <Text style={localStyles.subtitle}>Track your daily nutrition</Text>
      </View>
      
      <View style={localStyles.content}>
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Daily Calories</Text>
          <View style={localStyles.calorieRow}>
            <Text style={localStyles.calorieNumber}>0</Text>
            <Text style={localStyles.calorieLabel}>/ 2000 cal</Text>
          </View>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Log Food</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Macronutrients</Text>
          <View style={localStyles.macroContainer}>
            <View style={localStyles.macroItem}>
              <Text style={localStyles.macroValue}>0g</Text>
              <Text style={localStyles.macroLabel}>Protein</Text>
            </View>
            <View style={localStyles.macroItem}>
              <Text style={localStyles.macroValue}>0g</Text>
              <Text style={localStyles.macroLabel}>Carbs</Text>
            </View>
            <View style={localStyles.macroItem}>
              <Text style={localStyles.macroValue}>0g</Text>
              <Text style={localStyles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Meal Planning</Text>
          <Text style={localStyles.cardSubtitle}>Plan your meals for the week</Text>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>View Meal Plans</Text>
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
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  calorieNumber: {
    fontSize: fonts.hero,
    fontWeight: 'bold',
    color: '#34C759',
    marginRight: spacing.xs,
  },
  calorieLabel: {
    fontSize: fonts.regular,
    color: '#8E8E93',
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  macroLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: '#34C759',
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

export default NutritionScreen;
