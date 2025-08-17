import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { spacing, fonts, scaleWidth } from '../utils/responsive';

const CircularGauge = ({ size = 140, stroke = 12, progress = 62.5, value = 1250, goal = 2000 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress)) || 0;
  const dashoffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#EAF7E6" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#34C759"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: fonts.large, fontWeight: '800', color: '#1D1D1F' }}>{value}</Text>
        <Text style={{ fontSize: fonts.small, color: '#6B7280' }}>{goal}</Text>
      </View>
    </View>
  );
};

const MacroBar = ({ label, value, goal, color = '#A3E635' }) => {
  const pct = Math.max(0, Math.min(100, (value / goal) * 100)) || 0;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ color: '#111827', fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: '#6B7280' }}>{value} / {goal} g</Text>
      </View>
      <View style={{ height: scaleWidth(6), backgroundColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 8 }} />
      </View>
    </View>
  );
};

const MealRow = ({ title, recommendation }) => (
  <View style={stylesx.mealRow}>
    <View style={stylesx.mealLeft}>
      <View style={stylesx.mealIcon}><Ionicons name="restaurant-outline" size={20} color="#34C759" /></View>
      <View>
        <Text style={stylesx.mealTitle}>{title}</Text>
        <Text style={stylesx.mealSub}>Recommended {recommendation} cal</Text>
      </View>
    </View>
    <TouchableOpacity style={stylesx.addPill}>
      <Text style={stylesx.addPillText}>+ Add</Text>
    </TouchableOpacity>
  </View>
);

const NutritionScreen = () => {
  // Placeholder demo values
  const calorieGoal = 2000;
  const calories = 1250;
  const progress = (calories / calorieGoal) * 100;

  return (
    <ScrollView style={stylesx.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {/* Header */}
      <View style={stylesx.header}>
        <Text style={stylesx.title}>Nutrition</Text>
        <Text style={stylesx.subtitle}>Today</Text>
      </View>

      {/* Hero Intake Card */}
      <View style={stylesx.heroCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Ionicons name="flash-outline" size={18} color="#111" />
          <Text style={stylesx.heroLabel}> Daily intake</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={stylesx.heroPercent}>{(Math.round(progress * 10) / 10).toFixed(1)}%</Text>
          </View>
          <CircularGauge size={scaleWidth(120)} stroke={scaleWidth(12)} progress={progress} value={calories} goal={calorieGoal} />
        </View>

        <View style={{ height: spacing.md }} />
        <MacroBar label="Carbs" value={206} goal={258} color="#A3E635" />
        <MacroBar label="Proteins" value={206} goal={258} color="#86EFAC" />
        <MacroBar label="Fats" value={206} goal={258} color="#BBF7D0" />
      </View>

      {/* Meals */}
      <View style={stylesx.card}>
        <MealRow title="Breakfast" recommendation="830-1170" />
        <MealRow title="Lunch" recommendation="830-1170" />
        <MealRow title="Salad" recommendation="830-1170" />
        <MealRow title="Dinner" recommendation="830-1170" />
      </View>

      {/* Recently Logged */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fonts.large, fontWeight: '700', color: '#111827' }}>Recently Logged</Text>
          <TouchableOpacity><Text style={{ color: '#6B7280', fontWeight: '600' }}>View All</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const stylesx = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { padding: spacing.lg, paddingTop: spacing.xl, backgroundColor: '#FFFFFF' },
  title: { fontSize: fonts.hero, fontWeight: 'bold', color: '#1D1D1F' },
  subtitle: { fontSize: fonts.regular, color: '#8E8E93', marginTop: spacing.xs },
  heroCard: {
    backgroundColor: '#D6F5B5',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  heroLabel: { fontSize: fonts.regular, color: '#111', fontWeight: '600' },
  heroPercent: { fontSize: fonts.hero, fontWeight: '800', color: '#111' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  mealLeft: { flexDirection: 'row', alignItems: 'center' },
  mealIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  mealTitle: { fontSize: fonts.large, fontWeight: '700', color: '#111827' },
  mealSub: { fontSize: fonts.small, color: '#6B7280', marginTop: 2 },
  addPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, backgroundColor: '#E8FAF0', borderWidth: 1, borderColor: '#34C759' },
  addPillText: { color: '#111827', fontWeight: '700' },
});

export default NutritionScreen;
