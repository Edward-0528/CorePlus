import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import SwipeToDeleteWrapper from './SwipeToDeleteWrapper';
import MinimalisticDeleteModal from './MinimalisticDeleteModal';

const TimeGroupedMealCard = ({ timeGroup, meals, totalCalories, onDeleteMeal, mealMethodIcon, mealMethodColor }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Only reset state when the group is empty (all meals deleted)
  useEffect(() => {
    if (meals.length === 0) {
      setEditMode(false);
      setExpanded(false);
      setSelectedMeals([]);
      rotateAnim.setValue(0);
    }
  }, [meals.length]);

  // Clear selected meals when exiting edit mode
  useEffect(() => {
    if (!editMode) {
      setSelectedMeals([]);
    }
  }, [editMode]);

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
    
    // Exit edit mode when collapsing
    if (expanded && editMode) {
      setEditMode(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    // Auto-expand when entering edit mode
    if (!editMode && !expanded) {
      toggleExpanded();
    }
  };

  const toggleMealSelection = (mealId) => {
    setSelectedMeals(current => {
      if (current.includes(mealId)) {
        return current.filter(id => id !== mealId);
      } else {
        return [...current, mealId];
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedMeals.length === 0) return;
    
    setIsBulkDelete(true);
    setDeleteModalVisible(true);
  };

  const confirmBulkDelete = () => {
    selectedMeals.forEach(mealId => onDeleteMeal(mealId));
    setSelectedMeals([]);
    if (selectedMeals.length === meals.length) {
      setEditMode(false);
    }
  };

  const handleDeleteMeal = (mealId, mealName) => {
    setMealToDelete({ id: mealId, name: mealName });
    setIsBulkDelete(false);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMeal = () => {
    if (isBulkDelete) {
      confirmBulkDelete();
    } else if (mealToDelete) {
      onDeleteMeal(mealToDelete.id);
      // If this was the last meal in the group, exit edit mode
      if (meals.length === 1) {
        setEditMode(false);
      }
    }
    setMealToDelete(null);
  };

  const formatTime = (timeStr) => {
    try {
      // Handle undefined, null, or "Unknown" time
      if (!timeStr || timeStr === 'Unknown') {
        return 'No time recorded';
      }
      
      // Handle various time formats
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch (error) {
      return 'No time recorded';
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Calculate total nutrition for the group
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  // If single meal, show simplified view
  if (meals.length === 1) {
    const meal = meals[0];
    return (
      <View style={styles.listGroupContainer}>
        <SwipeToDeleteWrapper
          onDelete={() => handleDeleteMeal(meal.id, meal.name)}
          itemName={meal.name}
          disabled={editMode}
        >
          <View style={styles.singleMealHeader}>
            <View style={styles.singleMealLeft}>
              <View style={[styles.methodIcon, { backgroundColor: mealMethodColor(meal.method) }]}>
                <Ionicons name={mealMethodIcon(meal.method)} size={16} color="#FFF" />
              </View>
              <View style={styles.singleMealInfo}>
                <Text style={styles.singleMealName} numberOfLines={2}>
                  {meal.name}
                </Text>
                <Text style={styles.singleMealTime}>{formatTime(meal.time)}</Text>
                <View style={styles.singleNutritionRow}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{meal.calories}</Text>
                    <Text style={styles.nutritionLabel}>cal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                    <Text style={styles.nutritionLabel}>protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{meal.fat}g</Text>
                    <Text style={styles.nutritionLabel}>fat</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SwipeToDeleteWrapper>
        <View style={styles.divider} />
        
        {/* Minimalistic Delete Modal */}
        <MinimalisticDeleteModal
          visible={deleteModalVisible}
          onClose={() => {
            setDeleteModalVisible(false);
            setMealToDelete(null);
            setIsBulkDelete(false);
          }}
          onConfirm={confirmDeleteMeal}
          title="Delete Meal"
          message="Remove this meal from your log?"
          mealName={mealToDelete ? mealToDelete.name : null}
          confirmText="Delete"
          isMultiple={false}
        />
      </View>
    );
  }

  // Multiple meals - show grouped view
  return (
    <View style={styles.listGroupContainer}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.leftSection}>
          <View style={styles.timeSection}>
            <Text style={styles.timeText}>{formatTime(timeGroup)}</Text>
            <Text style={styles.mealCountText}>
              {meals.length} items • {totalCalories} calories
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          {editMode && selectedMeals.length > 0 && (
            <TouchableOpacity 
              style={styles.bulkDeleteButton}
              onPress={handleBulkDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.bulkDeleteText}>{selectedMeals.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={toggleEditMode}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={editMode ? "checkmark" : "create-outline"} 
              size={18} 
              color={editMode ? "#34C759" : "#8E8E93"} 
            />
          </TouchableOpacity>
          <Animated.View style={[styles.chevron, { transform: [{ rotate: rotateInterpolate }] }]}>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.summaryRow}>
            <View style={styles.nutritionSummary}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalCarbs)}g</Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalProtein)}g</Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalFat)}g</Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.mealsList}>
            {meals.map((meal, index) => (
              <SwipeToDeleteWrapper
                key={meal.id || index}
                onDelete={() => handleDeleteMeal(meal.id, meal.name)}
                itemName={meal.name}
                disabled={editMode} // Disable swipe when in edit mode
              >
                <TouchableOpacity 
                  style={[
                    styles.mealItem,
                    editMode && selectedMeals.includes(meal.id) && styles.selectedMealItem
                  ]}
                  onPress={editMode ? () => toggleMealSelection(meal.id) : undefined}
                  activeOpacity={editMode ? 0.7 : 1}
                >
                  {editMode && (
                    <TouchableOpacity 
                      style={styles.checkbox}
                      onPress={() => toggleMealSelection(meal.id)}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Ionicons 
                        name={selectedMeals.includes(meal.id) ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={selectedMeals.includes(meal.id) ? "#34C759" : "#C7C7CC"} 
                      />
                    </TouchableOpacity>
                  )}
                  <View style={[styles.mealMethodIcon, { backgroundColor: mealMethodColor(meal.method) }]}>
                    <Ionicons name={mealMethodIcon(meal.method)} size={12} color="#FFF" />
                  </View>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <Text style={styles.mealCalories}>
                    {meal.calories} cal
                  </Text>
                </TouchableOpacity>
              </SwipeToDeleteWrapper>
            ))}
          </View>
        </View>
      )}
      <View style={styles.divider} />
      
      {/* Minimalistic Delete Modal */}
      <MinimalisticDeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setMealToDelete(null);
          setIsBulkDelete(false);
        }}
        onConfirm={confirmDeleteMeal}
        title={isBulkDelete ? "Delete Meals" : "Delete Meal"}
        message={
          isBulkDelete 
            ? `Remove ${selectedMeals.length} meal${selectedMeals.length > 1 ? 's' : ''} from your log?`
            : "Remove this meal from your log?"
        }
        mealName={!isBulkDelete && mealToDelete ? mealToDelete.name : null}
        confirmText={isBulkDelete ? "Delete All" : "Delete"}
        isMultiple={isBulkDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listGroupContainer: {
    backgroundColor: '#FFFFFF',
    // Removed card styling - no margins, border radius, shadows
  },
  container: {
    backgroundColor: '#FFFFFF',
    // Removed card styling - no margins, border radius, shadows
  },
  singleMealContainer: {
    backgroundColor: '#FFFFFF',
    // Removed card styling - no margins, border radius, shadows
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  singleMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  singleMealLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSection: {
    flex: 1,
  },
  timeText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  mealCountText: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FAFAFA',
    marginHorizontal: spacing.md,
  },
  summaryRow: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mealsList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: 8,
  },
  selectedMealItem: {
    backgroundColor: '#E8F5E8',
  },
  mealMethodIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  methodIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  singleMealInfo: {
    flex: 1,
  },
  singleMealName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  singleMealTime: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginBottom: spacing.xs,
  },
  singleNutritionRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  mealName: {
    flex: 1,
    fontSize: fonts.small,
    color: '#1D1D1F',
    marginRight: spacing.sm,
  },
  mealCalories: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  nutritionItem: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  nutritionValue: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
    marginTop: 1,
  },
  checkbox: {
    marginRight: spacing.sm,
    padding: 2,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  bulkDeleteText: {
    color: '#FFFFFF',
    fontSize: fonts.small,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TimeGroupedMealCard;
