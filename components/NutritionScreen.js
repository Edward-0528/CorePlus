import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { spacing, fonts, scaleWidth } from '../utils/responsive';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useMealManager } from '../hooks/useMealManager';
import { formatTo12Hour } from '../utils/timeUtils';
import FoodCameraScreen from './FoodCameraScreen';
import FoodPredictionCard from './FoodPredictionCard';
import MultiFoodSelectionCard from './MultiFoodSelectionCard';
import FoodSearchModal from './FoodSearchModal';
import TodaysMealsSection from './TodaysMealsSection';
import MealHistoryCard from './MealHistoryCard';
import BarcodeScannerModal from './BarcodeScannerModal';
import MealPlanningCard from './MealPlanningCard';
import RecipeBrowserScreen from './RecipeBrowserScreen';
import DailyIntakeCard from './DailyIntakeCard';
import { generateElegantMealTitle, generateCompactFoodsList } from '../utils/mealTitleGenerator';
import { useSubscription } from '../contexts/SubscriptionContext';
import { DailyUsageButton, PremiumFeatureButton, UsageLimitDisplay, PremiumGate } from './FeatureGate';

const MealAddButton = ({ onPress }) => (
  <TouchableOpacity style={stylesx.addMealButton} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name="add-outline" size={20} color="#6B7280" />
    <Text style={stylesx.addMealTitle}>Add Meal</Text>
  </TouchableOpacity>
);

const MealAddOptions = ({ onManualAdd, onCameraAdd, onBarcodeAdd }) => {
  const { canAccessFeature } = useSubscription();
  
  return (
    <View style={stylesx.mealAddOptionsContainer}>
      <TouchableOpacity style={stylesx.addOptionButton} onPress={onManualAdd} activeOpacity={0.8}>
        <Ionicons name="create-outline" size={20} color="#007AFF" />
        <Text style={stylesx.addOptionText}>Manual Entry</Text>
      </TouchableOpacity>
      
      <DailyUsageButton 
        featureName="aiScansPerDay"
        style={[
          stylesx.addOptionButton,
          !canAccessFeature('aiScansPerDay') && stylesx.addOptionButtonPremium
        ]}
        onPress={onCameraAdd}
        showUsage={true}
      >
        <Ionicons name="camera-outline" size={20} color="#007AFF" />
        <Text style={stylesx.addOptionText}>Take Photo</Text>
        {!canAccessFeature('aiScansPerDay') && (
          <Ionicons name="star" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
        )}
      </DailyUsageButton>
      
      <TouchableOpacity style={stylesx.addOptionButton} onPress={onBarcodeAdd} activeOpacity={0.8}>
        <Ionicons name="barcode-outline" size={20} color="#007AFF" />
        <Text style={stylesx.addOptionText}>Scan Barcode</Text>
      </TouchableOpacity>
    </View>
  );
};

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
            name="bar-chart-outline" 
            size={16} 
            color="#4682B4" 
            style={{ marginRight: spacing.xs }} 
          />
          <Text style={stylesx.expandableToggleText}>
            More Nutrition Details
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
          size={16} 
          color="#8E8E93" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={stylesx.expandableContent}>
          {/* Fiber Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Fiber</Text>
              <Text style={{ fontSize: fonts.small, color: dailyMicros.fiber > nutritionGoals.fiber ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(dailyMicros.fiber)}g / {nutritionGoals.fiber}g
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: '#F2F2F7',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${Math.min((dailyMicros.fiber / nutritionGoals.fiber) * 100, 100)}%`,
                backgroundColor: dailyMicros.fiber > nutritionGoals.fiber ? "#FF6B6B" : "#90EE90",
                borderRadius: 3,
              }} />
            </View>
          </View>

          {/* Sugar Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Sugar</Text>
              <Text style={{ fontSize: fonts.small, color: dailyMicros.sugar > nutritionGoals.sugar ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(dailyMicros.sugar)}g / {nutritionGoals.sugar}g
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: '#F2F2F7',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${Math.min((dailyMicros.sugar / nutritionGoals.sugar) * 100, 100)}%`,
                backgroundColor: dailyMicros.sugar > nutritionGoals.sugar ? "#FF6B6B" : "#FFB6C1",
                borderRadius: 3,
              }} />
            </View>
          </View>

          {/* Sodium Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Sodium</Text>
              <Text style={{ fontSize: fonts.small, color: dailyMicros.sodium > nutritionGoals.sodium ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(dailyMicros.sodium)}mg / {nutritionGoals.sodium}mg
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: '#F2F2F7',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${Math.min((dailyMicros.sodium / nutritionGoals.sodium) * 100, 100)}%`,
                backgroundColor: dailyMicros.sodium > nutritionGoals.sodium ? "#FF6B6B" : "#DDA0DD",
                borderRadius: 3,
              }} />
            </View>
          </View>
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
      icon: 'camera-outline',
      color: '#FF6B6B'
    },
    {
      id: 'search',
      title: 'Search Food',
      subtitle: 'Find from database',
      icon: 'search-outline',
      color: '#4A90E2'
    },
    {
      id: 'barcode',
      title: 'Scan Barcode',
      subtitle: 'Quick product scan',
      icon: 'barcode-outline',
      color: '#FF9500'
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      subtitle: 'Add calories directly',
      icon: 'create-outline',
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
    } else if (method.id === 'barcode') {
      // For now, show manual entry form with barcode context
      // In the future, this could integrate with expo-barcode-scanner
      Alert.alert(
        'Barcode Scanner',
        'Please enter the product information manually for now. Barcode scanning feature will be added soon.',
        [{ text: 'OK' }]
      );
    } else if (method.id === 'manual') {
      // Keep modal open for manual entry
    }
  };

  const handleAddMeal = () => {
    if (mealName.trim() && calories.trim()) {
      const caloriesValue = parseInt(calories) || 0;
      
      onAddMeal({
        name: mealName,
        calories: caloriesValue,
        carbs: parseFloat(carbs) || Math.round(caloriesValue * 0.5 / 4), // Default 50% carbs if not specified
        protein: parseFloat(protein) || Math.round(caloriesValue * 0.25 / 4), // Default 25% protein if not specified
        fat: parseFloat(fat) || Math.round(caloriesValue * 0.25 / 9), // Default 25% fat if not specified
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        method: selectedMethod?.id || 'manual',
        timestamp: new Date().toISOString()
      });
      
      // Reset form
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
      Alert.alert(
        'Missing Information', 
        selectedMethod?.id === 'barcode' 
          ? 'Please enter both product name and calories.' 
          : 'Please enter both meal name and calories.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={stylesx.modalOverlay}>
        <View style={stylesx.modalContainer}>
          <View style={stylesx.modalHeader}>
            <Text style={stylesx.modalTitle}>Add Meal</Text>
          </View>

          <ScrollView style={stylesx.modalContent} showsVerticalScrollIndicator={false}>
            {!selectedMethod ? (
              // Method Selection
              <View style={stylesx.methodsList}>
                {entryMethods.map((method, index) => (
                  <View key={method.id}>
                    <TouchableOpacity
                      style={stylesx.methodButton}
                      onPress={() => handleMethodSelect(method)}
                      activeOpacity={0.7}
                    >
                      <View style={[stylesx.methodIcon, { backgroundColor: `${method.color}20` }]}>
                        <Ionicons name={method.icon} size={24} color={method.color} />
                      </View>
                      <View style={stylesx.methodTextContainer}>
                        <Text style={stylesx.methodTitle}>{method.title}</Text>
                        <Text style={stylesx.methodSubtitle}>{method.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                    {index < entryMethods.length - 1 && <View style={stylesx.methodDivider} />}
                  </View>
                ))}
              </View>
          ) : (
            // Manual Entry Form (for demonstration)
            <View>
              <TouchableOpacity 
                style={stylesx.backButton} 
                onPress={() => setSelectedMethod(null)}
              >
                <Ionicons name="arrow-back-outline" size={20} color="#4682B4" />
                <Text style={stylesx.backText}>Back to methods</Text>
              </TouchableOpacity>

              <Text style={stylesx.sectionTitle}>
                {selectedMethod?.id === 'barcode' ? 'Product Entry' : 'Manual Entry'}
              </Text>
              
              {selectedMethod?.id === 'barcode' && (
                <View style={stylesx.instructionContainer}>
                  <Text style={stylesx.instructionText}>
                    Enter the product information from the nutrition label
                  </Text>
                </View>
              )}
              
              <View style={stylesx.inputContainer}>
                <Text style={stylesx.inputLabel}>
                  {selectedMethod?.id === 'barcode' ? 'Product Name' : 'Meal Name'}
                </Text>
                <TextInput
                  style={stylesx.textInput}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder={selectedMethod?.id === 'barcode' ? "e.g., Protein Bar - Chocolate" : "e.g., Grilled Chicken Salad"}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={stylesx.inputContainer}>
                <Text style={stylesx.inputLabel}>Calories (per serving)</Text>
                <TextInput
                  style={stylesx.textInput}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g., 350"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>

              {/* Macronutrients Section */}
              <Text style={stylesx.sectionSubtitle}>Macronutrients</Text>
              <View style={stylesx.macroInputRow}>
                <View style={[stylesx.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={stylesx.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={stylesx.textInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0"
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
                    placeholder="0"
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
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Additional Nutrients Section */}
              <Text style={stylesx.sectionSubtitle}>Additional Information (Optional)</Text>
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
        
        {/* Close Button */}
        <TouchableOpacity style={stylesx.modalCloseButton} onPress={onClose}>
          <Text style={stylesx.modalCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      </View>
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

  // Get subscription info
  const { getCurrentTier, isPremium, SUBSCRIPTION_TIERS } = useSubscription();

  // Get meal history data
  const { mealHistory, historyLoading, loadMealHistory, clearMealHistory } = useMealManager();
  
  // Track if initial load has been done to prevent multiple loads
  const hasInitializedRef = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('🍽️ NutritionScreen mounted');
    console.log('📊 Daily calories:', dailyCalories);
    console.log('🥗 Today meals count:', todaysMeals?.length || 0);
  }, [dailyCalories, todaysMeals]);

  // Convert mealHistory object to array format for MealHistoryCard
  const historicalMealsArray = useMemo(() => {
    if (!mealHistory || typeof mealHistory !== 'object') return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDateStr = today.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"
    
    console.log('🍽️ Today date for filtering:', todayDateStr);
    
    const meals = [];
    Object.keys(mealHistory).forEach(date => {
      // Only include dates that are before today
      if (date !== todayDateStr && Array.isArray(mealHistory[date])) {
        console.log('🍽️ Processing date:', date, 'with', mealHistory[date].length, 'meals');
        mealHistory[date].forEach(meal => {
          meals.push({
            ...meal,
            date: date,
            meal_date: date
          });
        });
      } else if (date === todayDateStr) {
        console.log('🍽️ Skipping today\'s date:', date, 'with', mealHistory[date]?.length || 0, 'meals');
      }
    });
    
    console.log('🍽️ Final historicalMealsArray:', meals);
    return meals;
  }, [mealHistory]);

  // Load meal history progressively when component mounts
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) return;
    
    console.log('📚 Loading meal history...');
    let isActive = true; // Prevent race conditions
    
    if (loadMealHistory) {
      hasInitializedRef.current = true;
      
      // Start with just the last 7 days for quick loading
      const dates = [];
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      console.log('📅 Loading historical data for dates:', dates);
      loadMealHistory(dates);
      
      // Load more data progressively after initial load
      const timeoutId = setTimeout(() => {
        if (isActive) {
          const extendedDates = [];
          for (let i = 8; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            extendedDates.push(date.toISOString().split('T')[0]);
          }
          if (extendedDates.length > 0) {
            console.log('📅 Loading extended historical data for dates:', extendedDates);
            loadMealHistory(extendedDates);
          }
        }
      }, 2000); // Wait 2 seconds before loading extended data
      
      // Cleanup function
      return () => {
        isActive = false;
        clearTimeout(timeoutId);
      };
    }
  }, []); // Remove loadMealHistory dependency to prevent re-runs
  
  // State for UI controls
  const [isNutritionExpanded, setIsNutritionExpanded] = useState(false);
  const [todaysMealCount, setTodaysMealCount] = useState(0);
  
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
  const [showMultiSelectionCard, setShowMultiSelectionCard] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // Meal Planning States
  const [showRecipeBrowser, setShowRecipeBrowser] = useState(false);
  const [recipeBrowserConfig, setRecipeBrowserConfig] = useState({ mealType: null, targetCalories: null });
  const [hasMealPlan, setHasMealPlan] = useState(false); // Would come from user data
  const [foodPredictions, setFoodPredictions] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        calcium: meal.calcium || 0, // Micronutrient
        iron: meal.iron || 0, // Micronutrient
        vitaminC: meal.vitaminC || 0, // Micronutrient
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

  const handleCameraAnalysis = useCallback((predictions, imageUri, isLoading = false, error = null) => {
    console.log('📱 Camera analysis result received:', { predictions: predictions?.length, isLoading, error });
    
    // Always transition to multi-selection screen
    setFoodPredictions(predictions);
    setCapturedImage(imageUri);
    setShowCameraModal(false);
    setShowMultiSelectionCard(true);
    
    // Handle different states
    if (error) {
      // Analysis failed
      setTimeout(() => {
        Alert.alert(
          'Analysis Failed',
          error,
          [
            { text: 'Try Again', onPress: () => {
              setShowMultiSelectionCard(false);
              setShowCameraModal(true);
            }},
            { text: 'Add Manually', onPress: () => {
              setShowMultiSelectionCard(false);
              setShowMealModal(true);
            }}
          ]
        );
      }, 500); // Small delay to allow modal transition
    } else if (!isLoading && predictions && predictions.length > 0) {
      console.log(`📋 Showing ${predictions.length} food options for multi-selection`);
    } else if (isLoading) {
      console.log('📋 Showing loading state in multi-selection');
    }
  }, []);

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
        calcium: selectedFood.calcium || 0,
        iron: selectedFood.iron || 0,
        vitaminC: selectedFood.vitaminC || 0,
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

  const handleMultipleFoodSelection = useCallback(async (selectedFoods) => {
    if (selectedFoods === null) {
      // User chose manual entry
      setShowMultiSelectionCard(false);
      setShowMealModal(true); // Show manual entry modal
    } else if (selectedFoods && selectedFoods.length > 0) {
      // User selected multiple predictions - combine into a single elegant meal
      try {
        if (selectedFoods.length === 1) {
          // Single food - add as-is
          const mealFromPrediction = {
            name: selectedFoods[0].name,
            calories: selectedFoods[0].calories,
            carbs: selectedFoods[0].carbs,
            protein: selectedFoods[0].protein,
            fat: selectedFoods[0].fat,
            fiber: selectedFoods[0].fiber || 0,
            sugar: selectedFoods[0].sugar || 0,
            sodium: selectedFoods[0].sodium || 0,
            calcium: selectedFoods[0].calcium || 0,
            iron: selectedFoods[0].iron || 0,
            vitaminC: selectedFoods[0].vitaminC || 0,
            method: 'photo'
          };
          
          await handleAddMeal(mealFromPrediction);
        } else {
          // Multiple foods - combine into one elegant meal
          const elegantTitle = generateElegantMealTitle(selectedFoods);
          const compactDescription = generateCompactFoodsList(selectedFoods);
          
          const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
          const totalCarbs = selectedFoods.reduce((sum, food) => sum + food.carbs, 0);
          const totalProtein = selectedFoods.reduce((sum, food) => sum + food.protein, 0);
          const totalFat = selectedFoods.reduce((sum, food) => sum + food.fat, 0);
          const totalFiber = selectedFoods.reduce((sum, food) => sum + (food.fiber || 0), 0);
          const totalSugar = selectedFoods.reduce((sum, food) => sum + (food.sugar || 0), 0);
          const totalSodium = selectedFoods.reduce((sum, food) => sum + (food.sodium || 0), 0);
          const totalCalcium = selectedFoods.reduce((sum, food) => sum + (food.calcium || 0), 0);
          const totalIron = selectedFoods.reduce((sum, food) => sum + (food.iron || 0), 0);
          const totalVitaminC = selectedFoods.reduce((sum, food) => sum + (food.vitaminC || 0), 0);
          
          const combinedMeal = {
            name: elegantTitle,
            calories: Math.round(totalCalories),
            carbs: Math.round(totalCarbs),
            protein: Math.round(totalProtein),
            fat: Math.round(totalFat),
            fiber: Math.round(totalFiber),
            sugar: Math.round(totalSugar),
            sodium: Math.round(totalSodium),
            calcium: Math.round(totalCalcium),
            iron: Math.round(totalIron),
            vitaminC: Math.round(totalVitaminC),
            method: 'photo',
            description: compactDescription // Store the detailed component list
          };
          
          await handleAddMeal(combinedMeal);
        }
        
        setShowMultiSelectionCard(false);
        
        // Show success message
        const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
        const successTitle = selectedFoods.length === 1 ? selectedFoods[0].name : generateElegantMealTitle(selectedFoods);
        
        Alert.alert(
          'Meal Added!',
          `${successTitle} (${Math.round(totalCalories)} calories) has been added to your daily log.`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error adding meal:', error);
        Alert.alert('Error', 'Failed to save meal. Please try again.');
      }
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

  // Direct delete function without confirmation (for when confirmation is already handled)
  const handleDirectDeleteMeal = useCallback(async (mealId) => {
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
  }, [deleteMeal]);

  // Handle meal count changes from TodaysMealsSection
  const handleMealCountChange = useCallback((count) => {
    setTodaysMealCount(count);
  }, []);

  // Modal close handlers
  const closeMealModal = useCallback(() => setShowMealModal(false), []);
  const closeCameraModal = useCallback(() => setShowCameraModal(false), []);
  const closePredictionCard = useCallback(() => setShowPredictionCard(false), []);
  const closeBarcodeScanner = useCallback(() => setShowBarcodeScanner(false), []);

  // Handle barcode scan result
  const handleBarcodeScanned = useCallback(async (nutrition) => {
    try {
      console.log('📦 Barcode scanned nutrition data:', nutrition);
      
      // Add the scanned meal to today's meals
      const result = await addMeal(nutrition);
      
      if (result.success) {
        Alert.alert(
          'Product Added!',
          `Successfully added ${nutrition.name} to your meals.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Failed to add meal');
      }
    } catch (error) {
      console.error('Error adding barcode meal:', error);
      Alert.alert(
        'Error',
        'Failed to add scanned product to your meals. Please try manual entry.',
        [{ text: 'OK' }]
      );
    }
  }, [addMeal]);

  // Handle barcode scan error
  const handleBarcodeScanError = useCallback((error) => {
    console.log('Barcode scan error:', error);
    // Could offer manual entry or search as fallback
    Alert.alert(
      'Product Not Found',
      'Would you like to try manual entry instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manual Entry', onPress: () => setShowMealModal(true) }
      ]
    );
  }, []);

  // Refresh handler with cache clearing
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear cache and reload meal history data for fresh data
      await clearMealHistory();
      
      // Load fresh data starting with recent dates
      const dates = [];
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      await loadMealHistory(dates);
      console.log('🔄 Nutrition screen refreshed successfully with fresh data');
    } catch (error) {
      console.error('❌ Error refreshing nutrition screen:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadMealHistory, clearMealHistory]);

  // Meal Planning Handlers
  const handleViewRecipes = useCallback((mealType = null, targetCalories = null) => {
    setRecipeBrowserConfig({ mealType, targetCalories });
    setShowRecipeBrowser(true);
  }, []);

  const handleCreateMealPlan = useCallback((suggestion = null) => {
    // This would navigate to meal planning creation screen
    Alert.alert(
      'Meal Planning',
      'This would open the meal planning wizard to create a weekly plan based on your goals and preferences.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleViewMealPlan = useCallback(() => {
    // This would navigate to existing meal plan view
    Alert.alert(
      'View Meal Plan',
      'This would show your current weekly meal plan with options to modify or follow recipes.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSelectRecipe = useCallback((recipe) => {
    setShowRecipeBrowser(false);
    
    // Add the recipe as a meal
    const recipeAsMeal = {
      name: recipe.name,
      calories: recipe.calories,
      carbs: recipe.carbs,
      protein: recipe.protein,
      fat: recipe.fat,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      method: 'recipe'
    };
    
    handleAddMeal(recipeAsMeal);
    
    Alert.alert(
      'Recipe Added!',
      `${recipe.name} has been added to your daily log.`,
      [{ text: 'OK' }]
    );
  }, [handleAddMeal]);

  return (
    <>
    <ScrollView 
      style={stylesx.container} 
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#4682B4"
          colors={["#4682B4"]}
        />
      }
    >
      {/* Daily Intake Card */}
      <DailyIntakeCard
        dailyCalories={totalCalories}
        dailyMacros={dailyMacros}
        calorieGoal={calorieGoal}
        carbsGoal={carbsGoal}
        proteinGoal={proteinGoal}
        fatGoal={fatGoal}
        isLoading={mealsLoading}
        compact={false}
        showExpandButton={true}
        isExpanded={isNutritionExpanded}
        onToggleExpanded={() => setIsNutritionExpanded(!isNutritionExpanded)}
      />

      {/* Expandable Nutrition Details - Only show when expanded */}
      {isNutritionExpanded && (
        <View style={stylesx.card}>
          <ExpandableNutritionDetails 
            dailyMicros={dailyMicros}
            isExpanded={true}
            onToggle={() => setIsNutritionExpanded(false)}
          />
        </View>
      )}

      {/* Meal Planning Card - Premium Feature */}
      <PremiumGate featureName="canAccessMealPlanning">
        <MealPlanningCard
          dailyCalories={totalCalories}
          calorieGoal={calorieGoal}
          onViewRecipes={handleViewRecipes}
          onCreateMealPlan={handleCreateMealPlan}
          onViewMealPlan={handleViewMealPlan}
          hasMealPlan={hasMealPlan}
          isPremium={isPremium()}
        />
      </PremiumGate>

      {/* Meal Logging Section */}
      <View style={stylesx.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Ionicons name="restaurant-outline" size={18} color="#4682B4" />
          <Text style={stylesx.sectionHeader}>Today's Meals</Text>
        </View>
        
        {/* Meal count display */}
        {todaysMealCount > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={stylesx.mealCountText}>
              {todaysMealCount} meal{todaysMealCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        <MealAddOptions 
          onManualAdd={() => setShowMealModal(true)}
          onCameraAdd={() => setShowCameraModal(true)}
          onBarcodeAdd={() => setShowBarcodeScanner(true)}
        />
        
        {/* Re-enabling TodaysMealsSection for testing */}
        {TodaysMealsSection && (
          <TodaysMealsSection 
            meals={todaysMeals}
            onDeleteMeal={handleDirectDeleteMeal}
            onMealCountChange={handleMealCountChange}
            getMealMethodIcon={getMealMethodIcon}
            getMealMethodColor={getMealMethodColor}
            isLoading={mealsLoading}
          />
        )}
        {/* <View style={{ padding: spacing.md }}>
          <Text style={{ fontSize: fonts.medium, color: '#666' }}>
            Today's meals section temporarily disabled for debugging
          </Text>
        </View> */}
      </View>

      {/* Meal History Card */}
      <MealHistoryCard
        historicalMeals={historicalMealsArray}
        onDeleteMeal={handleDirectDeleteMeal}
        getMealMethodIcon={getMealMethodIcon}
        getMealMethodColor={getMealMethodColor}
        isLoading={historyLoading}
        daysToShow={7}
      />
    </ScrollView>

    {/* Modals */}
    <MealEntryModal
      visible={showMealModal}
      onClose={closeMealModal}
      onAddMeal={handleAddMeal}
      onOpenCamera={openCamera}
      onOpenSearch={openSearch}
    />

    {/* Camera Modal - Re-enabled for testing */}
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

    {/* Food Prediction Card - Re-enabled for testing */}
    <FoodPredictionCard
      visible={showPredictionCard}
      predictions={foodPredictions}
      imageUri={capturedImage}
      onSelectFood={handleFoodSelection}
      onClose={closePredictionCard}
    />

    {/* Multi Food Selection Card - Re-enabled for testing */}
    <MultiFoodSelectionCard
      visible={showMultiSelectionCard}
      predictions={foodPredictions}
      imageUri={capturedImage}
      onSelectFoods={handleMultipleFoodSelection}
      onClose={() => setShowMultiSelectionCard(false)}
    />

    {/* Food Search Modal - Re-enabled for testing */}
    <FoodSearchModal
      visible={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      onAddMeal={handleAddMeal}
    />

    {/* Barcode Scanner Modal */}
    <BarcodeScannerModal
      visible={showBarcodeScanner}
      onClose={closeBarcodeScanner}
      onBarcodeScanned={handleBarcodeScanned}
      onError={handleBarcodeScanError}
    />
    
    {/* Recipe Browser Modal */}
    <RecipeBrowserScreen
      visible={showRecipeBrowser}
      onClose={() => setShowRecipeBrowser(false)}
      onSelectRecipe={handleSelectRecipe}
      mealType={recipeBrowserConfig.mealType}
      targetCalories={recipeBrowserConfig.targetCalories}
      isPremium={isPremium}
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
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  heroLabel: { fontSize: fonts.regular, color: '#8E8E93', fontWeight: '600' },
  heroPercent: { fontSize: fonts.hero, fontWeight: '800', color: '#1D1D1F' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  mealCountText: { fontSize: fonts.small, color: '#8E8E93', fontWeight: '500', marginLeft: spacing.xs },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.sm,
  },
  addMealTitle: { 
    fontSize: fonts.medium, 
    fontWeight: '500', 
    color: '#6B7280',
    marginLeft: spacing.xs,
  },
  mealAddOptionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addOptionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addOptionText: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mealAddOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  addOptionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 70,
  },
  addOptionText: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fixButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  fixButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.medium,
    fontWeight: '600',
  },
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
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCloseButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
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
  sectionSubtitle: { 
    fontSize: fonts.medium, 
    fontWeight: '600', 
    color: '#1D1D1F', 
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  instructionContainer: {
    backgroundColor: '#F2F2F7',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  methodsList: {
    backgroundColor: '#FFFFFF',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  methodDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginHorizontal: spacing.md,
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
  // Premium feature styling
  addOptionButtonPremium: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});

export default NutritionScreen;
