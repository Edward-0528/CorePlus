import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, SafeAreaView, Alert } from 'react-native';
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
        <Circle cx={center} cy={center} r={radius} stroke="#F2F2F7" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#87CEEB"
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
        <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>{goal}</Text>
      </View>
    </View>
  );
};

const MacroBar = ({ label, value, goal, color = '#ADD8E6' }) => {
  const pct = Math.max(0, Math.min(100, (value / goal) * 100)) || 0;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ color: '#1D1D1F', fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: '#8E8E93' }}>{value} / {goal} g</Text>
      </View>
      <View style={{ height: scaleWidth(6), backgroundColor: '#F2F2F7', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 8 }} />
      </View>
    </View>
  );
};

const MealAddButton = ({ onPress }) => (
  <TouchableOpacity style={stylesx.addMealButton} onPress={onPress}>
    <View style={stylesx.addMealIcon}>
      <Ionicons name="add" size={24} color="#4682B4" />
    </View>
    <View style={stylesx.addMealTextContainer}>
      <Text style={stylesx.addMealTitle}>Log a Meal</Text>
      <Text style={stylesx.addMealSubtitle}>Photo, search, or manual entry</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
  </TouchableOpacity>
);

const MealEntryModal = ({ visible, onClose, onAddMeal }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');

  const entryMethods = [
    {
      id: 'photo',
      title: 'Take Photo',
      subtitle: 'Capture your meal',
      icon: 'camera',
      color: '#FF6B6B'
    },
    {
      id: 'search',
      title: 'Search Food',
      subtitle: 'Find from database',
      icon: 'search',
      color: '#4A90E2'
    },
    {
      id: 'barcode',
      title: 'Scan Barcode',
      subtitle: 'Quick product scan',
      icon: 'barcode',
      color: '#FF9500'
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      subtitle: 'Add calories directly',
      icon: 'create',
      color: '#34C759'
    }
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    // For now, just show a simple manual entry for demonstration
    if (method === 'manual') {
      // Keep modal open for manual entry
    } else {
      // For other methods, show placeholder alert
      Alert.alert(
        method.title,
        `${method.subtitle} feature coming soon!`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddMeal = () => {
    if (mealName.trim() && calories.trim()) {
      onAddMeal({
        name: mealName,
        calories: parseInt(calories),
        method: selectedMethod?.id || 'manual',
        timestamp: new Date().toISOString()
      });
      setMealName('');
      setCalories('');
      setSelectedMethod(null);
      onClose();
    } else {
      Alert.alert('Missing Information', 'Please enter both meal name and calories.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={stylesx.modalContainer}>
        <View style={stylesx.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={stylesx.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={stylesx.modalTitle}>Add Meal</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={stylesx.modalContent}>
          {!selectedMethod ? (
            // Method Selection
            <View>
              <Text style={stylesx.sectionTitle}>How would you like to log this meal?</Text>
              {entryMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={stylesx.methodButton}
                  onPress={() => handleMethodSelect(method)}
                >
                  <View style={[stylesx.methodIcon, { backgroundColor: `${method.color}20` }]}>
                    <Ionicons name={method.icon} size={24} color={method.color} />
                  </View>
                  <View style={stylesx.methodTextContainer}>
                    <Text style={stylesx.methodTitle}>{method.title}</Text>
                    <Text style={stylesx.methodSubtitle}>{method.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Manual Entry Form (for demonstration)
            <View>
              <TouchableOpacity 
                style={stylesx.backButton} 
                onPress={() => setSelectedMethod(null)}
              >
                <Ionicons name="chevron-back" size={20} color="#4682B4" />
                <Text style={stylesx.backText}>Back to methods</Text>
              </TouchableOpacity>

              <Text style={stylesx.sectionTitle}>Manual Entry</Text>
              
              <View style={stylesx.inputContainer}>
                <Text style={stylesx.inputLabel}>Meal Name</Text>
                <TextInput
                  style={stylesx.textInput}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="e.g., Grilled Chicken Salad"
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={stylesx.inputContainer}>
                <Text style={stylesx.inputLabel}>Calories</Text>
                <TextInput
                  style={stylesx.textInput}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g., 350"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={stylesx.addButton} onPress={handleAddMeal}>
                <Text style={stylesx.addButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const NutritionScreen = () => {
  // Placeholder demo values
  const calorieGoal = 2000;
  const calories = 1250;
  const progress = (calories / calorieGoal) * 100;
  
  // State for meal logging
  const [showMealModal, setShowMealModal] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState([
    { 
      id: 1, 
      name: 'Oatmeal with Berries', 
      calories: 280, 
      carbs: 45, 
      protein: 8, 
      fat: 6, 
      time: '8:30 AM', 
      method: 'photo' 
    },
    { 
      id: 2, 
      name: 'Grilled Chicken Wrap', 
      calories: 420, 
      carbs: 35, 
      protein: 32, 
      fat: 18, 
      time: '12:45 PM', 
      method: 'search' 
    },
  ]);

  const handleAddMeal = (meal) => {
    const newMeal = {
      id: Date.now(),
      ...meal,
      // Add default nutrition values if not provided
      carbs: meal.carbs || Math.round(meal.calories * 0.5 / 4), // Default: 50% calories from carbs
      protein: meal.protein || Math.round(meal.calories * 0.25 / 4), // Default: 25% calories from protein
      fat: meal.fat || Math.round(meal.calories * 0.25 / 9), // Default: 25% calories from fat
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLoggedMeals([...loggedMeals, newMeal]);
  };

  const handleDeleteMeal = (mealId) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to remove this meal from your log?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLoggedMeals(loggedMeals.filter(meal => meal.id !== mealId));
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={stylesx.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
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
        <MacroBar label="Carbs" value={206} goal={258} color="#87CEEB" />
        <MacroBar label="Proteins" value={206} goal={258} color="#B0E0E6" />
        <MacroBar label="Fats" value={206} goal={258} color="#ADD8E6" />
      </View>

      {/* Meal Logging Section */}
      <View style={stylesx.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Ionicons name="restaurant" size={18} color="#4682B4" />
          <Text style={stylesx.sectionHeader}>Today's Meals</Text>
        </View>
        
        <MealAddButton onPress={() => setShowMealModal(true)} />
        
        {loggedMeals.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <View style={stylesx.mealsHeader}>
              <Text style={stylesx.mealsHeaderText}>Logged Today</Text>
            </View>
            {loggedMeals.map((meal) => (
              <View key={meal.id} style={stylesx.loggedMealRow}>
                <View style={stylesx.mealLeft}>
                  <View style={[stylesx.mealMethodIcon, { backgroundColor: getMealMethodColor(meal.method) }]}>
                    <Ionicons name={getMealMethodIcon(meal.method)} size={16} color="#FFF" />
                  </View>
                  <View style={stylesx.mealTextContainer}>
                    <View style={stylesx.mealTitleRow}>
                      <Text style={stylesx.loggedMealName}>{meal.name}</Text>
                      <TouchableOpacity 
                        style={stylesx.deleteButton}
                        onPress={() => handleDeleteMeal(meal.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="remove-circle" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                    <Text style={stylesx.loggedMealTime}>{meal.time}</Text>
                    <View style={stylesx.nutritionRow}>
                      <View style={stylesx.nutritionItem}>
                        <Text style={stylesx.nutritionValue}>{meal.calories}</Text>
                        <Text style={stylesx.nutritionLabel}>cal</Text>
                      </View>
                      <View style={stylesx.nutritionItem}>
                        <Text style={stylesx.nutritionValue}>{meal.carbs}g</Text>
                        <Text style={stylesx.nutritionLabel}>carbs</Text>
                      </View>
                      <View style={stylesx.nutritionItem}>
                        <Text style={stylesx.nutritionValue}>{meal.protein}g</Text>
                        <Text style={stylesx.nutritionLabel}>protein</Text>
                      </View>
                      <View style={stylesx.nutritionItem}>
                        <Text style={stylesx.nutritionValue}>{meal.fat}g</Text>
                        <Text style={stylesx.nutritionLabel}>fat</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <MealEntryModal
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onAddMeal={handleAddMeal}
      />

      {/* Recently Logged */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fonts.large, fontWeight: '700', color: '#1D1D1F' }}>Meal History</Text>
          <TouchableOpacity><Text style={{ color: '#8E8E93', fontWeight: '600' }}>View All</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper functions for meal method display
const getMealMethodIcon = (method) => {
  switch (method) {
    case 'photo': return 'camera';
    case 'search': return 'search';
    case 'barcode': return 'barcode';
    case 'manual': return 'create';
    default: return 'restaurant';
  }
};

const getMealMethodColor = (method) => {
  switch (method) {
    case 'photo': return '#FF6B6B';
    case 'search': return '#4A90E2';
    case 'barcode': return '#FF9500';
    case 'manual': return '#34C759';
    default: return '#87CEEB';
  }
};

const stylesx = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  heroCard: {
    backgroundColor: '#FFFFFF',
    margin: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  heroLabel: { fontSize: fonts.regular, color: '#8E8E93', fontWeight: '600' },
  heroPercent: { fontSize: fonts.hero, fontWeight: '800', color: '#1D1D1F' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F2F2F7' },
  mealLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  mealTextContainer: { flex: 1 },
  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  deleteButton: {
    padding: 2,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  mealIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  mealTitle: { fontSize: fonts.large, fontWeight: '700', color: '#1D1D1F' },
  mealSub: { fontSize: fonts.small, color: '#8E8E93', marginTop: 2 },
  sectionHeader: { fontSize: fonts.large, fontWeight: '700', color: '#1D1D1F', marginLeft: spacing.xs },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E6F3FF',
    borderStyle: 'dashed',
  },
  addMealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addMealTextContainer: { flex: 1 },
  addMealTitle: { fontSize: fonts.medium, fontWeight: '600', color: '#1D1D1F' },
  addMealSubtitle: { fontSize: fonts.small, color: '#8E8E93', marginTop: 2 },
  mealsHeader: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  mealsHeaderText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loggedMealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginVertical: 2,
    backgroundColor: '#FBFBFB',
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  mealMethodIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  loggedMealName: { 
    fontSize: fonts.medium, 
    fontWeight: '600', 
    color: '#1D1D1F',
    marginBottom: 2,
  },
  loggedMealTime: { 
    fontSize: fonts.small, 
    color: '#8E8E93', 
    marginBottom: spacing.xs 
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 45,
  },
  nutritionValue: {
    fontSize: fonts.small,
    fontWeight: '700',
    color: '#4682B4',
    marginBottom: 1,
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalContainer: { flex: 1, backgroundColor: '#F5F5F7' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancel: { fontSize: fonts.medium, color: '#4682B4' },
  modalTitle: { fontSize: fonts.large, fontWeight: '600', color: '#1D1D1F' },
  modalContent: { flex: 1, padding: spacing.md },
  sectionTitle: { fontSize: fonts.large, fontWeight: '700', color: '#1D1D1F', marginBottom: spacing.md },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodTextContainer: { flex: 1 },
  methodTitle: { fontSize: fonts.medium, fontWeight: '600', color: '#1D1D1F' },
  methodSubtitle: { fontSize: fonts.small, color: '#8E8E93', marginTop: 2 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: { fontSize: fonts.medium, color: '#4682B4', marginLeft: spacing.xs },
  inputContainer: { marginBottom: spacing.md },
  inputLabel: { fontSize: fonts.medium, fontWeight: '600', color: '#1D1D1F', marginBottom: spacing.xs },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fonts.medium,
    color: '#1D1D1F',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NutritionScreen;
