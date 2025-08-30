import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { 
  View, 
  Text, 
  Colors, 
  TouchableOpacity,
  Button,
  ProgressBar
} from 'react-native-ui-lib';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Custom Components
import { 
  BeautifulCard, 
  MetricCard, 
  ActionButton, 
  SectionHeader,
  StatsRow,
  QuickAction,
  EmptyState
} from './design/Components';

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';

const { width } = Dimensions.get('window');

const BeautifulNutrition = ({ user, onLogout, loading, styles }) => {
  const { dailyCalories, dailyMacros, todaysMeals, mealsLoading } = useDailyCalories();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  
  // Goals
  const calorieGoal = 2000;
  const macroGoals = {
    carbs: 250,
    protein: 125,
    fat: 56,
    fiber: 25
  };

  // Calculate progress
  const calorieProgress = (dailyCalories / calorieGoal) * 100;
  const macroProgress = {
    carbs: (dailyMacros.carbs / macroGoals.carbs) * 100,
    protein: (dailyMacros.protein / macroGoals.protein) * 100,
    fat: (dailyMacros.fat / macroGoals.fat) * 100,
    fiber: (dailyMacros.fiber / macroGoals.fiber) * 100,
  };

  // Mock meal data
  const recentMeals = [
    {
      id: 1,
      name: 'Avocado Toast with Eggs',
      type: 'Breakfast',
      calories: 420,
      time: '8:30 AM',
      macros: { carbs: 35, protein: 18, fat: 25 }
    },
    {
      id: 2,
      name: 'Greek Yogurt Bowl',
      type: 'Snack',
      calories: 180,
      time: '10:45 AM',
      macros: { carbs: 20, protein: 15, fat: 5 }
    },
    {
      id: 3,
      name: 'Grilled Chicken Salad',
      type: 'Lunch',
      calories: 380,
      time: '1:15 PM',
      macros: { carbs: 15, protein: 35, fat: 18 }
    }
  ];

  const nutritionStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: Colors.nutrition },
    { value: `${Math.round(dailyMacros.protein)}g`, label: 'Protein', color: Colors.accent },
    { value: `${Math.round(dailyMacros.carbs)}g`, label: 'Carbs', color: Colors.warning },
    { value: `${Math.round(dailyMacros.fat)}g`, label: 'Fat', color: Colors.info },
  ];

  const quickActions = [
    { icon: 'camera', label: 'Scan Food', color: Colors.primary },
    { icon: 'search', label: 'Food Search', color: Colors.nutrition },
    { icon: 'add-circle', label: 'Quick Add', color: Colors.success },
    { icon: 'restaurant', label: 'Log Meal', color: Colors.warning },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.nutrition, Colors.secondaryLight]}
      style={{
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View row centerV spread>
        <View>
          <Text h4 color={Colors.white}>Nutrition</Text>
          <Text body1 color={Colors.white} style={{ opacity: 0.9 }}>
            Fuel your body right
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="nutrition" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderCalorieProgress = () => (
    <View paddingH-20 style={{ marginTop: -15 }}>
      <BeautifulCard gradient={[Colors.primary, Colors.primaryLight]}>
        <View center>
          <Text h6 color={Colors.white}>Daily Calories</Text>
          <View row centerV marginT-sm>
            <Text h1 color={Colors.white}>{dailyCalories}</Text>
            <Text h5 color={Colors.white} style={{ opacity: 0.8 }} marginL-xs>
              / {calorieGoal}
            </Text>
          </View>
          <Text body2 color={Colors.white} style={{ opacity: 0.9 }} marginT-xs>
            {calorieGoal - dailyCalories} calories remaining
          </Text>
          <View marginT-md width="100%">
            <ProgressBar 
              progress={calorieProgress} 
              progressColor={Colors.white}
              style={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
              }}
            />
          </View>
        </View>
      </BeautifulCard>
    </View>
  );

  const renderQuickActions = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Quick Actions"
        subtitle="Log your food intake"
      />
      <View row spread style={{ gap: 12 }}>
        {quickActions.map((action, index) => (
          <QuickAction
            key={index}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={() => console.log(`Pressed ${action.label}`)}
          />
        ))}
      </View>
    </View>
  );

  const renderMacroBreakdown = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Macro Breakdown"
        subtitle="Track your nutrition balance"
      />
      <View row spread style={{ gap: 12 }}>
        <MetricCard
          icon="nutrition"
          title="Carbs"
          value={Math.round(dailyMacros.carbs)}
          unit="g"
          color={Colors.warning}
          progress={macroProgress.carbs}
          style={{ flex: 1 }}
        />
        <MetricCard
          icon="fitness"
          title="Protein"
          value={Math.round(dailyMacros.protein)}
          unit="g"
          color={Colors.accent}
          progress={macroProgress.protein}
          style={{ flex: 1 }}
        />
      </View>
      <View row spread style={{ gap: 12, marginTop: 12 }}>
        <MetricCard
          icon="water"
          title="Fat"
          value={Math.round(dailyMacros.fat)}
          unit="g"
          color={Colors.info}
          progress={macroProgress.fat}
          style={{ flex: 1 }}
        />
        <MetricCard
          icon="leaf"
          title="Fiber"
          value={Math.round(dailyMacros.fiber)}
          unit="g"
          color={Colors.success}
          progress={macroProgress.fiber}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  const renderTodaysStats = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Today's Nutrition"
        subtitle="Your intake summary"
      />
      <StatsRow stats={nutritionStats} />
    </View>
  );

  const renderTabs = () => (
    <View paddingH-20>
      <View 
        row
        style={{
          backgroundColor: Colors.backgroundTertiary,
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {['today', 'history', 'goals'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? Colors.white : 'transparent',
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text 
              center
              color={activeTab === tab ? Colors.primary : Colors.textSecondary}
              style={{ fontWeight: activeTab === tab ? '600' : '400' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTodaysMeals = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Today's Meals"
        subtitle={`${recentMeals.length} meals logged`}
      />
      {recentMeals.length > 0 ? (
        recentMeals.map((meal) => (
          <BeautifulCard key={meal.id} style={{ marginBottom: 12 }}>
            <View row centerV spread>
              <View row centerV flex>
                <View 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: Colors.nutrition,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="restaurant" size={24} color={Colors.white} />
                </View>
                <View flex marginL-md>
                  <Text h6 color={Colors.textPrimary}>{meal.name}</Text>
                  <Text body2 color={Colors.textSecondary} marginT-xs>
                    {meal.type} • {meal.time}
                  </Text>
                  <View row marginT-xs>
                    <Text caption color={Colors.textLight}>
                      C: {meal.macros.carbs}g • P: {meal.macros.protein}g • F: {meal.macros.fat}g
                    </Text>
                  </View>
                </View>
              </View>
              <View center>
                <Text h6 color={Colors.nutrition}>{meal.calories}</Text>
                <Text caption color={Colors.textLight}>calories</Text>
              </View>
            </View>
          </BeautifulCard>
        ))
      ) : (
        <EmptyState
          icon="restaurant"
          title="No meals logged today"
          subtitle="Start tracking your nutrition"
          actionText="Log Meal"
          onActionPress={() => console.log('Log meal')}
        />
      )}
    </View>
  );

  const renderNutritionHistory = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Nutrition History"
        subtitle="Your weekly progress"
      />
      
      {/* Weekly Summary */}
      <BeautifulCard style={{ marginBottom: 16 }}>
        <Text h6 color={Colors.textPrimary} marginB-md>This Week's Average</Text>
        <View row spread>
          <View center flex>
            <Text h5 color={Colors.nutrition}>1,850</Text>
            <Text caption color={Colors.textSecondary}>Calories/day</Text>
          </View>
          <View center flex>
            <Text h5 color={Colors.accent}>110g</Text>
            <Text caption color={Colors.textSecondary}>Protein/day</Text>
          </View>
          <View center flex>
            <Text h5 color={Colors.success}>95%</Text>
            <Text caption color={Colors.textSecondary}>Goal Hit</Text>
          </View>
        </View>
      </BeautifulCard>

      {/* Recent Days */}
      {['Yesterday', 'Tuesday', 'Monday'].map((day, index) => (
        <BeautifulCard key={day} style={{ marginBottom: 12 }}>
          <View row centerV spread>
            <View flex>
              <Text h6 color={Colors.textPrimary}>{day}</Text>
              <Text body2 color={Colors.textSecondary} marginT-xs>
                {1800 + (index * 50)} calories • 4 meals
              </Text>
            </View>
            <View center>
              <View 
                style={{
                  backgroundColor: Colors.success,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text caption color={Colors.white}>Goal Met</Text>
              </View>
            </View>
          </View>
        </BeautifulCard>
      ))}
    </View>
  );

  const renderNutritionGoals = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Nutrition Goals"
        subtitle="Customize your targets"
        action="Edit"
      />
      
      <BeautifulCard>
        <Text h6 color={Colors.textPrimary} marginB-md>Daily Targets</Text>
        
        {Object.entries(macroGoals).map(([macro, goal]) => (
          <View key={macro} row centerV spread marginB-md>
            <Text body1 color={Colors.textPrimary} style={{ textTransform: 'capitalize' }}>
              {macro}
            </Text>
            <View row centerV>
              <Text body1 color={Colors.textSecondary}>{goal}g</Text>
              <TouchableOpacity marginL-md>
                <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <View 
          style={{
            height: 1,
            backgroundColor: Colors.border,
            marginVertical: 16,
          }}
        />
        
        <View row centerV spread>
          <Text body1 color={Colors.textPrimary}>Daily Calories</Text>
          <Text body1 color={Colors.textSecondary}>{calorieGoal}</Text>
        </View>
      </BeautifulCard>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodaysMeals();
      case 'history':
        return renderNutritionHistory();
      case 'goals':
        return renderNutritionGoals();
      default:
        return renderTodaysMeals();
    }
  };

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
        {renderCalorieProgress()}
        {renderQuickActions()}
        {renderMacroBreakdown()}
        {renderTodaysStats()}
        {renderTabs()}
        {renderContent()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BeautifulNutrition;
