import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const MealPlanCreationScreen = ({ 
  visible, 
  onClose, 
  onCreatePlan,
  userGoals = { calories: 2000, protein: 125, carbs: 250, fat: 67 },
  isPremium = false 
}) => {
  const [selectedDuration, setSelectedDuration] = useState('week');
  const [selectedMealTypes, setSelectedMealTypes] = useState(['breakfast', 'lunch', 'dinner']);
  const [selectedDietType, setSelectedDietType] = useState('balanced');
  const [selectedComplexity, setSelectedComplexity] = useState('easy');

  const durations = [
    { id: 'week', name: '1 Week', description: 'Perfect for getting started' },
    { id: 'month', name: '1 Month', description: 'Comprehensive planning', premium: true }
  ];

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', icon: 'sunny-outline' },
    { id: 'lunch', name: 'Lunch', icon: 'partly-sunny-outline' },
    { id: 'dinner', name: 'Dinner', icon: 'moon-outline' },
    { id: 'snacks', name: 'Snacks', icon: 'nutrition-outline', premium: true }
  ];

  const dietTypes = [
    { id: 'balanced', name: 'Balanced', description: 'Variety of all food groups' },
    { id: 'high-protein', name: 'High Protein', description: 'Focus on protein-rich meals' },
    { id: 'low-carb', name: 'Low Carb', description: 'Reduced carbohydrate intake', premium: true },
    { id: 'vegetarian', name: 'Vegetarian', description: 'Plant-based options only', premium: true }
  ];

  const complexityLevels = [
    { id: 'easy', name: 'Easy', description: '15-20 min meals', time: '15-20 min' },
    { id: 'medium', name: 'Medium', description: '25-35 min meals', time: '25-35 min' },
    { id: 'complex', name: 'Complex', description: '40+ min gourmet meals', time: '40+ min', premium: true }
  ];

  const handleMealTypeToggle = (mealTypeId) => {
    const mealType = mealTypes.find(m => m.id === mealTypeId);
    if (mealType?.premium && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Pro to include snacks in your meal plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedMealTypes(prev => 
      prev.includes(mealTypeId) 
        ? prev.filter(id => id !== mealTypeId)
        : [...prev, mealTypeId]
    );
  };

  const handleCreatePlan = () => {
    const planConfig = {
      duration: selectedDuration,
      mealTypes: selectedMealTypes,
      dietType: selectedDietType,
      complexity: selectedComplexity,
      goals: userGoals
    };

    onCreatePlan(planConfig);
    onClose();
  };

  const isPlanValid = selectedMealTypes.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meal Plan</Text>
          <TouchableOpacity 
            onPress={handleCreatePlan}
            disabled={!isPlanValid}
            style={[styles.createButton, !isPlanValid && styles.createButtonDisabled]}
          >
            <Text style={[styles.createButtonText, !isPlanValid && styles.createButtonTextDisabled]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Duration</Text>
            <View style={styles.optionsGrid}>
              {durations.map((duration) => {
                const isLocked = duration.premium && !isPremium;
                const isSelected = selectedDuration === duration.id;
                
                return (
                  <TouchableOpacity
                    key={duration.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.selectedCard,
                      isLocked && styles.lockedCard
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        Alert.alert('Premium Feature', 'Upgrade to Pro for monthly meal planning.');
                        return;
                      }
                      setSelectedDuration(duration.id);
                    }}
                    disabled={isLocked}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionName, isSelected && styles.selectedText]}>
                        {duration.name}
                      </Text>
                      {duration.premium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.optionDescription, isSelected && styles.selectedDescription]}>
                      {duration.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Meal Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Include Meals</Text>
            <View style={styles.optionsGrid}>
              {mealTypes.map((mealType) => {
                const isLocked = mealType.premium && !isPremium;
                const isSelected = selectedMealTypes.includes(mealType.id);
                
                return (
                  <TouchableOpacity
                    key={mealType.id}
                    style={[
                      styles.mealTypeCard,
                      isSelected && styles.selectedCard,
                      isLocked && styles.lockedCard
                    ]}
                    onPress={() => handleMealTypeToggle(mealType.id)}
                    disabled={isLocked}
                  >
                    <Ionicons 
                      name={mealType.icon} 
                      size={24} 
                      color={isSelected ? '#FFFFFF' : '#4682B4'} 
                    />
                    <Text style={[styles.mealTypeName, isSelected && styles.selectedText]}>
                      {mealType.name}
                    </Text>
                    {mealType.premium && (
                      <View style={styles.premiumIcon}>
                        <Ionicons name="lock-closed" size={12} color={isLocked ? '#8E8E93' : '#FFD700'} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Diet Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diet Preference</Text>
            <View style={styles.optionsGrid}>
              {dietTypes.map((diet) => {
                const isLocked = diet.premium && !isPremium;
                const isSelected = selectedDietType === diet.id;
                
                return (
                  <TouchableOpacity
                    key={diet.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.selectedCard,
                      isLocked && styles.lockedCard
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        Alert.alert('Premium Feature', 'Upgrade to Pro for specialized diet plans.');
                        return;
                      }
                      setSelectedDietType(diet.id);
                    }}
                    disabled={isLocked}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionName, isSelected && styles.selectedText]}>
                        {diet.name}
                      </Text>
                      {diet.premium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.optionDescription, isSelected && styles.selectedDescription]}>
                      {diet.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Complexity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking Complexity</Text>
            <View style={styles.optionsGrid}>
              {complexityLevels.map((complexity) => {
                const isLocked = complexity.premium && !isPremium;
                const isSelected = selectedComplexity === complexity.id;
                
                return (
                  <TouchableOpacity
                    key={complexity.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.selectedCard,
                      isLocked && styles.lockedCard
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        Alert.alert('Premium Feature', 'Upgrade to Pro for gourmet meal plans.');
                        return;
                      }
                      setSelectedComplexity(complexity.id);
                    }}
                    disabled={isLocked}
                  >
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionName, isSelected && styles.selectedText]}>
                        {complexity.name}
                      </Text>
                      {complexity.premium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.optionDescription, isSelected && styles.selectedDescription]}>
                      {complexity.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Goals Summary */}
          <View style={[styles.section, styles.summarySection]}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <View style={styles.goalsContainer}>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Daily Calories</Text>
                <Text style={styles.goalValue}>{userGoals.calories}</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Protein</Text>
                <Text style={styles.goalValue}>{userGoals.protein}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Carbs</Text>
                <Text style={styles.goalValue}>{userGoals.carbs}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Fat</Text>
                <Text style={styles.goalValue}>{userGoals.fat}g</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  createButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#007AFF',
  },
  createButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.md,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  selectedCard: {
    borderColor: '#4682B4',
    backgroundColor: '#4682B4',
  },
  lockedCard: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  optionName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mealTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    position: 'relative',
  },
  mealTypeName: {
    fontSize: fonts.medium,
    fontWeight: '500',
    color: '#1D1D1F',
    marginTop: spacing.xs,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B4513',
  },
  premiumIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
  },
  goalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#4682B4',
  },
});

export default MealPlanCreationScreen;
