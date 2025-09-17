import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Dimensions } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
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
import { useSubscription } from '../contexts/SubscriptionContext';

const { width } = Dimensions.get('window');

const BeautifulDashboard = ({ user, onLogout, loading, styles }) => {
  const { dailyCalories, dailyMacros, mealsLoading } = useDailyCalories();
  const { isPremium } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState({
    steps: 0,
    calories: 0,
    distance: 0,
    workouts: 0
  });

  // Mock data - replace with real data
  const calorieGoal = 2000;
  const calorieProgress = (dailyCalories / calorieGoal) * 100;
  
  const todaysStats = [
    { value: '8,547', label: 'Steps', color: Colors.success },
    { value: '425', label: 'Calories', color: Colors.accent },
    { value: '6.2', label: 'Distance', color: Colors.info },
    { value: '2', label: 'Workouts', color: Colors.workout },
  ];

  const quickActions = [
    { icon: 'add-circle', label: 'Log Meal', color: Colors.nutrition },
    { icon: 'fitness', label: 'Start Workout', color: Colors.workout },
    { icon: 'camera', label: 'Scan Food', color: Colors.primary },
    { icon: 'heart', label: 'Health Data', color: Colors.health },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryLight]}
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
          <Text h4 color={Colors.white}>Welcome back!</Text>
          <Text body1 color={Colors.white} style={{ opacity: 0.9 }}>
            {user?.user_metadata?.first_name || 'User'}
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
          <Ionicons name="person" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* Premium Badge */}
      {isPremium() && (
        <View 
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: 'flex-start',
            marginTop: 12,
          }}
        >
          <View row centerV>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text body2 color="#FFD700" marginL-xs>Premium Member</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );

  const renderCalorieCard = () => (
    <BeautifulCard 
      gradient={[Colors.nutrition, Colors.secondaryLight]}
      style={{ marginHorizontal: 20, marginTop: -20, marginBottom: 24 }}
    >
      <View row centerV spread>
        <View flex>
          <Text h6 color={Colors.white}>Daily Calories</Text>
          <View row centerV marginT-sm>
            <Text h2 color={Colors.white}>{dailyCalories}</Text>
            <Text body1 color={Colors.white} style={{ opacity: 0.8 }} marginL-xs>
              / {calorieGoal}
            </Text>
          </View>
          <Text body2 color={Colors.white} style={{ opacity: 0.9 }} marginT-xs>
            {calorieGoal - dailyCalories} calories remaining
          </Text>
        </View>
        <View center>
          <View 
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text h3 color={Colors.white}>{Math.round(calorieProgress)}%</Text>
          </View>
        </View>
      </View>
    </BeautifulCard>
  );

  const renderTodaysStats = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Today's Activity"
        subtitle="Keep up the great work!"
      />
      <StatsRow stats={todaysStats} />
    </View>
  );

  const renderQuickActions = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Quick Actions"
        subtitle="What would you like to do?"
      />
      <View row spread style={{ gap: 12 }}>
        {quickActions.map((action, index) => (
          <QuickAction
            key={index}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={() => {
              // Handle action press
              console.log(`Pressed ${action.label}`);
            }}
          />
        ))}
      </View>
    </View>
  );

  const renderMacros = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Macro Breakdown"
        subtitle="Track your nutrition goals"
        action="View Details"
        onActionPress={() => {
          // Navigate to nutrition tab
        }}
      />
      <View row spread style={{ gap: 12 }}>
        <MetricCard
          icon="nutrition"
          title="Carbs"
          value={Math.round(dailyMacros.carbs)}
          unit="g"
          color={Colors.warning}
          progress={(dailyMacros.carbs / 250) * 100}
          style={{ flex: 1 }}
        />
        <MetricCard
          icon="fitness"
          title="Protein"
          value={Math.round(dailyMacros.protein)}
          unit="g"
          color={Colors.accent}
          progress={(dailyMacros.protein / 125) * 100}
          style={{ flex: 1 }}
        />
        <MetricCard
          icon="water"
          title="Fat"
          value={Math.round(dailyMacros.fat)}
          unit="g"
          color={Colors.info}
          progress={(dailyMacros.fat / 56) * 100}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View paddingH-20>
      <SectionHeader 
        title="Recent Activity"
        subtitle="Your latest achievements"
        action="View All"
      />
      
      <BeautifulCard>
        <View row centerV marginB-md>
          <View 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={20} color={Colors.white} />
          </View>
          <View flex marginL-md>
            <Text h6 color={Colors.textPrimary}>Morning Workout Completed</Text>
            <Text body2 color={Colors.textSecondary}>30 minutes • 250 calories burned</Text>
          </View>
          <Text caption color={Colors.textLight}>2h ago</Text>
        </View>
        
        <View row centerV>
          <View 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.nutrition,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="restaurant" size={20} color={Colors.white} />
          </View>
          <View flex marginL-md>
            <Text h6 color={Colors.textPrimary}>Healthy Breakfast Logged</Text>
            <Text body2 color={Colors.textSecondary}>Oatmeal with berries • 350 calories</Text>
          </View>
          <Text caption color={Colors.textLight}>3h ago</Text>
        </View>
      </BeautifulCard>
    </View>
  );

  const renderGoalCard = () => (
    <View paddingH-20>
      <SectionHeader title="Weekly Goal" />
      <BeautifulCard gradient={[Colors.workout, Colors.accentLight]}>
        <View row centerV spread>
          <View flex>
            <Text h6 color={Colors.white}>Workout Streak</Text>
            <Text h2 color={Colors.white} marginT-sm>5 Days</Text>
            <Text body2 color={Colors.white} style={{ opacity: 0.9 }} marginT-xs>
              2 more days to reach your weekly goal!
            </Text>
          </View>
          <View center>
            <Ionicons name="flame" size={48} color={Colors.white} style={{ opacity: 0.8 }} />
          </View>
        </View>
      </BeautifulCard>
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
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {renderCalorieCard()}
        {renderTodaysStats()}
        {renderQuickActions()}
        {renderMacros()}
        {renderGoalCard()}
        {renderRecentActivity()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BeautifulDashboard;
