import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { spacing, fonts, scaleWidth } from '../utils/responsive';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useMealManager } from '../hooks/useMealManager';
import { formatTo12Hour } from '../utils/timeUtils';
import FoodCameraScreen from './FoodCameraScreen';
import FoodPredictionCard from './FoodPredictionCard';
import FoodSearchModal from './FoodSearchModal';

const CircularGauge = ({ size = 140, stroke = 12, progress = 62.5, value = 1250, goal = 2000 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress)) || 0;
  const dashoffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  
  // Check if over goal for color changes
  const isOverGoal = value > goal;
  const strokeColor = isOverGoal ? "#FF6B6B" : "#87CEEB";
  const valueColor = isOverGoal ? "#FF6B6B" : "#1D1D1F";

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#F2F2F7" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: fonts.large, fontWeight: '800', color: valueColor }}>
          {value}{isOverGoal && ' ⚠️'}
        </Text>
        <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>{goal}</Text>
      </View>
    </View>
  );
};

const MacroBar = ({ label, value, goal, color = '#ADD8E6', unit = 'g' }) => {
  const pct = Math.max(0, Math.min(100, (value / goal) * 100)) || 0;
  const isOverLimit = value > goal;
  const barColor = isOverLimit ? '#FF6B6B' : color; // Red if over limit, otherwise use default color
  const textColor = isOverLimit ? '#FF6B6B' : '#8E8E93'; // Red text if over limit
  
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ color: '#1D1D1F', fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: textColor, fontWeight: isOverLimit ? '600' : 'normal' }}>
          {Math.round(value)} / {goal} {unit}
          {isOverLimit && ' ⚠️'}
        </Text>
      </View>
      <View style={{ height: scaleWidth(6), backgroundColor: '#F2F2F7', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 8 }} />
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

const ExpandableNutritionDetails = ({ dailyMicros, isExpanded, onToggle }) => {
  // Nutrition goals for micronutrients (FDA recommendations)
  const nutritionGoals = {
    fiber: 25,      // FDA recommendation (grams)
    sugar: 50,      // WHO recommendation (<10% of calories for 2000 cal diet)
    sodium: 2300,   // FDA recommendation (mg)
  };

  return (
    <View style={{ marginTop: spacing.md }}>
      <TouchableOpacity 
        style={stylesx.expandableToggle} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name="nutrition" 
            size={16} 
            color="#4682B4" 
            style={{ marginRight: spacing.xs }} 
          />
          <Text style={stylesx.expandableToggleText}>
            More Nutrition Details
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#8E8E93" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={stylesx.expandableContent}>
          <MacroBar 
            label="Fiber" 
            value={dailyMicros.fiber} 
            goal={nutritionGoals.fiber} 
            color="#90EE90" 
            unit="g"
          />
          <MacroBar 
            label="Sugar" 
            value={dailyMicros.sugar} 
            goal={nutritionGoals.sugar} 
            color="#FFB6C1" 
            unit="g"
          />
          <MacroBar 
            label="Sodium" 
            value={dailyMicros.sodium} 
            goal={nutritionGoals.sodium} 
            color="#DDA0DD" 
            unit="mg"
          />
        </View>
      )}
    </View>
  );
};

const MealEntryModal = ({ visible, onClose, onAddMeal, onOpenCamera, onOpenSearch }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');

  // Reset modal state when closed
  React.useEffect(() => {
    if (!visible) {
      setSelectedMethod(null);
      setMealName('');
      setCalories('');
      setCarbs('');
      setProtein('');
      setFat('');
      setFiber('');
      setSugar('');
      setSodium('');
    }
  }, [visible]);

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
    
    if (method.id === 'photo') {
      // Open camera for food photo analysis
      onOpenCamera();
    } else if (method.id === 'search') {
      // Open food search modal
      onOpenSearch();
    } else if (method.id === 'manual') {
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
        calories: parseInt(calories) || 0,
        carbs: parseFloat(carbs) || Math.round((parseInt(calories) || 0) * 0.5 / 4),
        protein: parseFloat(protein) || Math.round((parseInt(calories) || 0) * 0.25 / 4),
        fat: parseFloat(fat) || Math.round((parseInt(calories) || 0) * 0.25 / 9),
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        method: selectedMethod?.id || 'manual',
        timestamp: new Date().toISOString()
      });
      setMealName('');
      setCalories('');
      setCarbs('');
      setProtein('');
      setFat('');
      setFiber('');
      setSugar('');
      setSodium('');
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

              {/* Basic Macros */}
              <View style={stylesx.macroInputRow}>
                <View style={[stylesx.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={stylesx.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="Auto"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[stylesx.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={stylesx.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="Auto"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[stylesx.inputContainer, { flex: 1 }]}>
                  <Text style={stylesx.inputLabel}>Fat (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="Auto"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Extended Nutrition */}
              <View style={stylesx.macroInputRow}>
                <View style={[stylesx.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={stylesx.inputLabel}>Fiber (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={fiber}
                    onChangeText={setFiber}
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[stylesx.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={stylesx.inputLabel}>Sugar (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={sugar}
                    onChangeText={setSugar}
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[stylesx.inputContainer, { flex: 1 }]}>
                  <Text style={stylesx.inputLabel}>Sodium (mg)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={sodium}
                    onChangeText={setSodium}
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
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
  // Use the enhanced meal manager
  const { 
    dailyCalories, 
    dailyMacros,
    dailyMicros, 
    todaysMeals, 
    mealsLoading,
    addMeal,
    deleteMeal 
  } = useDailyCalories();
  
  const mealManager = useMealManager();
  
  // State for UI controls
  const [isNutritionExpanded, setIsNutritionExpanded] = useState(false);
  
  // Goals
  const calorieGoal = 2000;
  const carbsGoal = 258; // ~50% of calories
  const proteinGoal = 125; // ~25% of calories  
  const fatGoal = 56; // ~25% of calories
  
  // Auto-selection logic for high confidence predictions
  const checkForAutoSelection = useCallback((predictions) => {
    if (!predictions || predictions.length === 0) return false;
    
    const topPrediction = predictions[0];
    const secondPrediction = predictions[1];
    
    // Auto-select if:
    // 1. Confidence is 90% or higher
    // 2. OR confidence is 80%+ and significantly higher than second option (20+ point difference)
    // 3. OR there's only one prediction with 70%+ confidence
    
    if (topPrediction.confidence >= 0.9) {
      console.log('🎯 Auto-selecting: High confidence (>=90%)');
      return true;
    }
    
    if (topPrediction.confidence >= 0.8 && 
        (!secondPrediction || (topPrediction.confidence - secondPrediction.confidence) >= 0.2)) {
      console.log('🎯 Auto-selecting: High confidence with clear winner');
      return true;
    }
    
    if (predictions.length === 1 && topPrediction.confidence >= 0.7) {
      console.log('🎯 Auto-selecting: Single prediction with good confidence');
      return true;
    }
    
    console.log('🤔 Showing selection card: Confidence not high enough or too many similar options');
    return false;
  }, []);
  
  // State for meal logging
  const [showMealModal, setShowMealModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPredictionCard, setShowPredictionCard] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [foodPredictions, setFoodPredictions] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);

  // No longer need local loggedMeals state - use todaysMeals from context
  // No longer need isLoading state for meals - use mealsLoading from context
  // No longer need loadTodaysMeals function - meals are loaded automatically by context

  // Memoize calculations to prevent unnecessary re-renders
  // Memoize calculations using context data
  const nutritionTotals = useMemo(() => {
    return {
      totalCalories: dailyCalories,
      totalCarbs: dailyMacros.carbs,
      totalProtein: dailyMacros.protein,
      totalFat: dailyMacros.fat,
      progress: (dailyCalories / calorieGoal) * 100
    };
  }, [dailyCalories, dailyMacros, calorieGoal]);

  const { totalCalories, totalCarbs, totalProtein, totalFat, progress } = nutritionTotals;

  const handleAddMeal = useCallback(async (meal) => {
    try {
      // Add meal using context method (handles caching automatically)
      const result = await addMeal({
        name: meal.name,
        calories: meal.calories,
        carbs: meal.carbs || Math.round(meal.calories * 0.5 / 4), // Default: 50% calories from carbs
        protein: meal.protein || Math.round(meal.calories * 0.25 / 4), // Default: 25% calories from protein
        fat: meal.fat || Math.round(meal.calories * 0.25 / 9), // Default: 25% calories from fat
        fiber: meal.fiber || 0, // Extended nutrition
        sugar: meal.sugar || 0, // Extended nutrition
        sodium: meal.sodium || 0, // Extended nutrition
        method: meal.method || 'manual',
        imageUri: meal.imageUri,
        confidence: meal.confidence
      });

      if (result.success) {
        console.log('✅ Meal added successfully with extended nutrition');
        // Context automatically updates dailyCalories, dailyMacros, dailyMicros, and todaysMeals
      } else {
        console.error('Failed to add meal:', result.error);
        Alert.alert('Error', 'Failed to save meal. Please try again.');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  }, [addMeal]);

  const handleCameraAnalysis = useCallback((predictions, imageUri) => {
    console.log('📱 Camera analysis result received:', predictions);
    
    if (predictions && predictions.length > 0) {
      // Check if we should auto-select the highest confidence prediction
      const shouldAutoSelect = checkForAutoSelection(predictions);
      
      if (shouldAutoSelect) {
        // Auto-select the highest confidence prediction
        const selectedFood = predictions[0]; // Predictions are sorted by confidence
        const mealFromPrediction = {
          name: selectedFood.name,
          calories: selectedFood.calories,
          carbs: selectedFood.carbs,
          protein: selectedFood.protein,
          fat: selectedFood.fat,
          fiber: selectedFood.fiber || 0,
          sugar: selectedFood.sugar || 0,
          sodium: selectedFood.sodium || 0,
          method: 'photo'
        };
        
        handleAddMeal(mealFromPrediction);
        setShowCameraModal(false);
        
        console.log(`✅ Auto-added: ${selectedFood.name} with ${Math.round(selectedFood.confidence * 100)}% confidence`);
      } else {
        // Show prediction card for user selection
        setFoodPredictions(predictions);
        setCapturedImage(imageUri);
        setShowCameraModal(false);
        setShowPredictionCard(true);
      }
    } else {
      // Analysis failed, show error
      Alert.alert(
        'Analysis Failed',
        'Could not identify the food. Please try again or add manually.',
        [{ text: 'OK' }]
      );
      setShowCameraModal(false);
    }
  }, [checkForAutoSelection, handleAddMeal]);

  const handleFoodSelection = useCallback((selectedFood) => {
    if (selectedFood === null) {
      // User chose manual entry
      setShowPredictionCard(false);
      setShowMealModal(true); // Show manual entry modal
    } else {
      // User selected a prediction
      const mealFromPrediction = {
        name: selectedFood.name,
        calories: selectedFood.calories,
        carbs: selectedFood.carbs,
        protein: selectedFood.protein,
        fat: selectedFood.fat,
        fiber: selectedFood.fiber || 0,
        sugar: selectedFood.sugar || 0,
        sodium: selectedFood.sodium || 0,
        method: 'photo'
      };
      
      handleAddMeal(mealFromPrediction);
      setShowPredictionCard(false);
      
      // Show success message
      Alert.alert(
        'Meal Added!',
        `${selectedFood.name} has been added to your daily log.`,
        [{ text: 'OK' }]
      );
    }
  }, [handleAddMeal]);

  const openCamera = useCallback(() => {
    setShowMealModal(false); // Close meal selection modal
    setShowCameraModal(true); // Open camera modal
  }, []);

  const openSearch = useCallback(() => {
    setShowMealModal(false); // Close meal selection modal
    setShowSearchModal(true); // Open search modal
  }, []);

  const handleDeleteMeal = useCallback(async (mealId) => {
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
          onPress: async () => {
            try {
              // Delete using context method (handles caching automatically)
              const result = await deleteMeal(mealId);
              
              if (result.success) {
                console.log('✅ Meal deleted successfully');
                // Context automatically updates dailyCalories, dailyMacros, and todaysMeals
              } else {
                console.error('Failed to delete meal:', result.error);
                Alert.alert('Error', 'Failed to delete meal. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteMeal]);

  // Modal close handlers
  const closeMealModal = useCallback(() => setShowMealModal(false), []);
  const closeCameraModal = useCallback(() => setShowCameraModal(false), []);
  const closePredictionCard = useCallback(() => setShowPredictionCard(false), []);

  return (
    <>
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
          <CircularGauge size={scaleWidth(120)} stroke={scaleWidth(12)} progress={progress} value={totalCalories} goal={calorieGoal} />
        </View>

        <View style={{ height: spacing.md }} />
        <MacroBar label="Carbs" value={totalCarbs} goal={carbsGoal} color="#87CEEB" />
        <MacroBar label="Proteins" value={totalProtein} goal={proteinGoal} color="#B0E0E6" />
        <MacroBar label="Fats" value={totalFat} goal={fatGoal} color="#ADD8E6" />
        
        {/* Expandable Nutrition Details */}
        <ExpandableNutritionDetails 
          dailyMicros={dailyMicros}
          isExpanded={isNutritionExpanded}
          onToggle={() => setIsNutritionExpanded(!isNutritionExpanded)}
        />
      </View>

      {/* Meal Logging Section */}
      <View style={stylesx.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Ionicons name="restaurant" size={18} color="#4682B4" />
          <Text style={stylesx.sectionHeader}>Today's Meals</Text>
        </View>
        
        <MealAddButton onPress={() => setShowMealModal(true)} />
        
        {mealsLoading ? (
          <View style={stylesx.emptyStateContainer}>
            <View style={stylesx.emptyStateIcon}>
              <Ionicons name="restaurant-outline" size={48} color="#C7C7CC" />
            </View>
            <Text style={stylesx.emptyStateTitle}>Loading your meals...</Text>
            <Text style={stylesx.emptyStateSubtitle}>
              Please wait while we fetch your nutrition data
            </Text>
          </View>
        ) : todaysMeals.length > 0 ? (
          <View style={{ marginTop: spacing.md }}>
            <View style={stylesx.mealsHeader}>
              <Text style={stylesx.mealsHeaderText}>Logged Today</Text>
            </View>
            {todaysMeals.map((meal) => (
              <View key={meal.id} style={stylesx.loggedMealRow}>
                <View style={stylesx.mealLeft}>
                  <View style={[stylesx.mealMethodIcon, { backgroundColor: getMealMethodColor(meal.method) }]}>
                    <Ionicons name={getMealMethodIcon(meal.method)} size={16} color="#FFF" />
                  </View>
                  <View style={stylesx.mealTextContainer}>
                    <View style={stylesx.mealTitleRow}>
                      <Text style={stylesx.loggedMealName} numberOfLines={2} ellipsizeMode="tail">
                        {meal.name}
                      </Text>
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
        ) : (
          <View style={stylesx.emptyStateContainer}>
            <View style={stylesx.emptyStateIcon}>
              <Ionicons name="restaurant-outline" size={48} color="#C7C7CC" />
            </View>
            <Text style={stylesx.emptyStateTitle}>No meals logged yet</Text>
            <Text style={stylesx.emptyStateSubtitle}>
              Start tracking your nutrition by logging your first meal!
            </Text>
          </View>
        )}
      </View>

      <MealEntryModal
        visible={showMealModal}
        onClose={closeMealModal}
        onAddMeal={handleAddMeal}
        onOpenCamera={openCamera}
        onOpenSearch={openSearch}
      />

      {/* Recently Logged */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fonts.large, fontWeight: '700', color: '#1D1D1F' }}>Meal History</Text>
          
        </View>
      </View>
    </ScrollView>

    {/* Camera Modal */}
    <Modal
      visible={showCameraModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <FoodCameraScreen
        onPhotoTaken={(photoUri) => {
          console.log('📸 Photo taken:', photoUri);
        }}
        onAnalysisComplete={handleCameraAnalysis}
        onClose={closeCameraModal}
      />
    </Modal>

    {/* Food Prediction Card */}
    <FoodPredictionCard
      visible={showPredictionCard}
      predictions={foodPredictions}
      imageUri={capturedImage}
      onSelectFood={handleFoodSelection}
      onClose={closePredictionCard}
    />

    {/* Food Search Modal */}
    <FoodSearchModal
      visible={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      onAddMeal={handleAddMeal}
    />
    </>
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
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  deleteButton: {
    padding: 2,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    marginLeft: spacing.sm,
    flexShrink: 0, // Prevent shrinking
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
    flex: 1, // Allow text to take available space
    marginRight: spacing.xs, // Small gap from delete button
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
  macroInputRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
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
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: fonts.medium,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  // New styles for expandable nutrition
  expandableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  expandableToggleText: {
    fontSize: fonts.medium,
    fontWeight: '500',
    color: '#4682B4',
  },
  expandableContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});

export default NutritionScreen;
