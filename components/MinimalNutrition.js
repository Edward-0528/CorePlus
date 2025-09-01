import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { 
  View, 
  Text, 
  Colors, 
  TouchableOpacity
} from 'react-native-ui-lib';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TodaysMealsComponent from './TodaysMealsComponent';

// Minimal Components
import MinimalComponents from './design/MinimalComponents';
const { 
  MinimalCard,
  MinimalMetric,
  MinimalButton,
  MinimalSection,
  MinimalStats,
  MinimalProgress,
  MinimalAction
} = MinimalComponents;

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';

const MinimalNutrition = ({ user, onLogout, loading, styles }) => {
  const { dailyCalories, addCalories, foodEntries } = useDailyCalories();
  const [refreshing, setRefreshing] = useState(false);

  // Mock nutrition data
  const calorieGoal = 2000;
  const macroGoals = {
    protein: { current: 85, goal: 150, unit: 'g' },
    carbs: { current: 180, goal: 250, unit: 'g' },
    fat: { current: 45, goal: 65, unit: 'g' },
    fiber: { current: 18, goal: 25, unit: 'g' },
  };

  const nutritionStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: Colors.nutrition },
    { value: `${macroGoals.protein.current}g`, label: 'Protein', color: Colors.primary },
    { value: `${macroGoals.carbs.current}g`, label: 'Carbs', color: Colors.workout },
    { value: `${macroGoals.fat.current}g`, label: 'Fat', color: Colors.account },
  ];

  const recentMeals = foodEntries.slice(0, 5).map((entry, index) => ({
    id: index,
    name: entry.description || 'Food Item',
    calories: entry.calories || 0,
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    meal: index % 4 === 0 ? 'Breakfast' : index % 4 === 1 ? 'Lunch' : index % 4 === 2 ? 'Dinner' : 'Snack'
  }));

  const quickActions = [
    { icon: 'camera-outline', title: 'Scan Food', color: Colors.nutrition },
    { icon: 'search-outline', title: 'Search', color: Colors.primary },
    { icon: 'barcode-outline', title: 'Barcode', color: Colors.workout },
    { icon: 'restaurant-outline', title: 'Recipe', color: Colors.account },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.textPrimary}>Nutrition</Text>
          <Text body2 color={Colors.textSecondary}>Track your daily intake</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="analytics-outline" size={24} color={Colors.nutrition} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border, width: '100%' }} />
    </View>
  );

  const renderCalorieOverview = () => {
    const calorieProgress = (dailyCalories / calorieGoal) * 100;
    const remaining = Math.max(0, calorieGoal - dailyCalories);
    
    return (
      <View paddingH-20>
        <MinimalSection title="Daily Calories" action="Edit Goal" />
        <MinimalCard style={{ marginTop: 8 }}>
          <View row centerV spread marginB-sm>
            <Text h4 color={Colors.textPrimary}>{dailyCalories}</Text>
            <Text body2 color={Colors.textSecondary}>/ {calorieGoal} cal</Text>
          </View>
          <MinimalProgress progress={calorieProgress} color={Colors.nutrition} height={4} />
          <View row centerV spread marginT-sm>
            <Text caption color={Colors.textSecondary}>
              {remaining} calories remaining
            </Text>
            <Text caption color={Colors.nutrition}>
              {Math.round(calorieProgress)}%
            </Text>
          </View>
        </MinimalCard>
      </View>
    );
  };

  const renderMacroBreakdown = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Macronutrients" />
      <MinimalCard style={{ marginTop: 8 }}>
        {Object.entries(macroGoals).map(([key, macro]) => {
          const progress = (macro.current / macro.goal) * 100;
          const macroColors = {
            protein: Colors.primary,
            carbs: Colors.workout,
            fat: Colors.account,
            fiber: Colors.nutrition
          };
          
          return (
            <View key={key} style={{ marginBottom: 16 }}>
              <View row centerV spread marginB-xs>
                <Text body1 color={Colors.textPrimary} style={{ textTransform: 'capitalize' }}>
                  {key}
                </Text>
                <Text body2 color={Colors.textSecondary}>
                  {macro.current}{macro.unit} / {macro.goal}{macro.unit}
                </Text>
              </View>
              <MinimalProgress 
                progress={progress} 
                color={macroColors[key]} 
                height={3} 
              />
            </View>
          );
        })}
      </MinimalCard>
    </View>
  );

  const renderTodayStats = () => (
    <View paddingH-20 marginT-lg>
      <MinimalStats stats={nutritionStats} />
    </View>
  );

  const renderQuickActions = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Log Food" />
      <View row spread marginT-sm>
        {quickActions.map((action, index) => (
          <MinimalAction
            key={index}
            icon={action.icon}
            title={action.title}
            color={action.color}
            onPress={() => console.log(`Pressed ${action.title}`)}
          />
        ))}
      </View>
    </View>
  );

  const renderRecentMeals = () => {
    // Styles that match the minimal design system
    const minimalMealStyles = {
      section: {
        paddingHorizontal: 20,
        marginTop: 24,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary || '#1A1A1A',
      },
      sectionAction: {
        fontSize: 14,
        color: Colors.nutrition || '#50E3C2',
        fontWeight: '500',
      },
      sectionLine: {
        height: 0, // No line in minimal design
      },
      card: {
        backgroundColor: Colors.white || '#FFFFFF',
        borderRadius: 12,
        padding: 0,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
      },
      emptyStateText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary || '#6C757D',
        marginTop: 12,
      },
      emptyStateSubtext: {
        fontSize: 13,
        color: Colors.border || '#E9ECEF',
        marginTop: 4,
        textAlign: 'center',
      },
      mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      mealInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      mealDetails: {
        marginLeft: 12,
        flex: 1,
      },
      mealName: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textPrimary || '#1A1A1A',
      },
      mealTime: {
        fontSize: 13,
        color: Colors.textSecondary || '#6C757D',
        marginTop: 2,
      },
      mealCalories: {
        alignItems: 'flex-end',
      },
      mealValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary || '#1A1A1A',
      },
      mealUnit: {
        fontSize: 12,
        color: Colors.textSecondary || '#6C757D',
      },
      mealDivider: {
        height: 1,
        backgroundColor: Colors.border || '#F0F0F0',
        marginHorizontal: 16,
      },
      moreRowButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      moreRowText: {
        fontSize: 14,
        color: Colors.nutrition || '#50E3C2',
        fontWeight: '500',
        marginRight: 4,
      },
    };

    return (
      <TodaysMealsComponent 
        styles={minimalMealStyles}
        showViewAll={true}
        maxMealsToShow={3}
        onViewAllPress={() => {
          console.log('View all meals pressed from minimal nutrition');
        }}
        onMealPress={(meal) => {
          console.log('Meal pressed in minimal nutrition:', meal.name);
        }}
        emptyStateMessage="No meals logged today"
        emptyStateSubtext="Log your first meal to start tracking"
      />
    );
  };

  const renderWaterIntake = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Water Intake" />
      <MinimalCard style={{ marginTop: 8 }}>
        <View row centerV spread marginB-sm>
          <Text body1 color={Colors.textPrimary}>Daily Goal</Text>
          <Text h6 color={Colors.primary}>6 / 8 glasses</Text>
        </View>
        <MinimalProgress progress={75} color={Colors.primary} height={3} />
        <View row spread marginT-sm>
          <Text caption color={Colors.textSecondary}>2 glasses remaining</Text>
          <TouchableOpacity>
            <Text caption color={Colors.primary}>Add Glass</Text>
          </TouchableOpacity>
        </View>
      </MinimalCard>
    </View>
  );

  const renderNutritionTips = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Today's Tip" />
      <MinimalCard style={{ marginTop: 8 }}>
        <View row centerV>
          <Ionicons name="bulb-outline" size={20} color={Colors.account} />
          <Text body2 color={Colors.textPrimary} marginL-sm flex>
            Try to eat protein with every meal to help maintain stable blood sugar levels.
          </Text>
        </View>
      </MinimalCard>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundSecondary }}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.nutrition]}
            tintColor={Colors.nutrition}
          />
        }
      >
        {renderCalorieOverview()}
        {renderTodayStats()}
        {renderMacroBreakdown()}
        {renderQuickActions()}
        {renderRecentMeals()}
        {renderWaterIntake()}
        {renderNutritionTips()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalNutrition;
