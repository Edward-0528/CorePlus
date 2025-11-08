// Concise AI Nutrition Coach Component
// Displays a simple text suggestion above the calorie section

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionCoachService } from '../../services/nutritionCoachService';
import { useAppContext } from '../../contexts/AppContext';
import { AppColors } from '../../constants/AppColors';
import { supabase } from '../../supabaseConfig';

const ConciseAICoach = () => {
  const { user } = useAppContext();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachingSuggestion();
  }, [user?.id]);

  const loadCoachingSuggestion = async () => {
    if (!user?.id) {
      console.log('🤖 ConciseAICoach: No user ID, skipping');
      return;
    }
    
    console.log('🤖 ConciseAICoach: Loading suggestion for user:', user.id);
    setLoading(true);
    try {
      // Get user data and weekly nutrition data
      const { data: userData } = await supabase.auth.getUser();
      const weeklyData = await nutritionCoachService.getWeeklyNutritionData(user.id);
      const result = await nutritionCoachService.generateConciseSuggestion(userData?.user || user, weeklyData);
      console.log('🤖 ConciseAICoach: Got result:', result);
      if (result.success && result.insight && result.insight.suggestion) {
        console.log('🤖 ConciseAICoach: Setting suggestion:', result.insight.suggestion);
        setSuggestion(result.insight.suggestion);
      } else {
        console.log('🤖 ConciseAICoach: No suggestion in result, using fallback');
        setSuggestion("Start by logging your next meal to get personalized nutrition tips!");
      }
    } catch (error) {
      console.error('🤖 ConciseAICoach: Error loading suggestion:', error);
      // Use fallback suggestion
      setSuggestion("Focus on balanced meals with protein, healthy carbs, and good fats.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.loadingText}>Getting nutrition tip...</Text>
        </View>
      </View>
    );
  }

  console.log('🤖 ConciseAICoach: Rendering with suggestion:', suggestion);

  if (!suggestion) {
    return (
      <View style={styles.container}>
        <View style={styles.suggestionContainer}>
          <Ionicons name="bulb" size={16} color="#FF8C00" style={styles.icon} />
          <Text style={styles.suggestionText}>Start logging meals to get personalized tips!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.suggestionContainer}>
        <Ionicons name="bulb" size={16} color="#FF8C00" style={styles.icon} />
        <Text style={styles.suggestionText}>{suggestion}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C00',
  },
  icon: {
    marginTop: 1,
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default ConciseAICoach;
