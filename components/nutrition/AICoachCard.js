// AI Nutrition Coach Card Component
// Displays weekly insights and recommendations

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionCoachService } from '../../services/nutritionCoachService';
import { useAppContext } from '../../contexts/AppContext';
import { AppColors } from '../../constants/AppColors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AICoachCard = ({ onPress, style }) => {
  const { user } = useAppContext();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadCoachingInsight();
  }, [user?.id]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const loadCoachingInsight = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await nutritionCoachService.getCachedOrFreshInsight(user.id);
      if (result.success) {
        setInsight(result.insight);
      }
    } catch (error) {
      console.error('Error loading coaching insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Clear cache and get fresh insight
    setLoading(true);
    try {
      const weeklyData = await nutritionCoachService.getWeeklyNutritionData(user.id);
      const result = await nutritionCoachService.generateWeeklyCoachingInsight(user, weeklyData);
      if (result.success) {
        setInsight(result.insight);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh coaching insight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#28A745'; // Green
    if (score >= 70) return '#FFC107'; // Yellow  
    if (score >= 50) return '#FF8C00'; // Orange
    return '#DC3545'; // Red
  };

  const renderQuickInsight = () => (
    <TouchableOpacity 
      style={styles.quickInsightContainer}
      onPress={toggleExpanded}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="fitness" size={20} color={AppColors.primary} />
          <Text style={styles.title}>AI Nutrition Coach</Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={AppColors.primary}
            style={styles.headerChevron}
          />
        </View>
        {insight?.weeklyScore && (
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(insight.weeklyScore) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(insight.weeklyScore) }]}>
              {insight.weeklyScore}
            </Text>
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.loadingText}>Analyzing your nutrition...</Text>
        </View>
      ) : insight ? (
        <>
          <Text style={styles.weeklyInsight}>{insight.weeklyInsight}</Text>
          
          {insight.achievements && insight.achievements.length > 0 && (
            <View style={styles.achievementContainer}>
              <Ionicons name="trophy" size={16} color="#28A745" />
              <Text style={styles.achievementText}>
                {insight.achievements[0]}
              </Text>
            </View>
          )}
          
          {insight.concerns && insight.concerns.length > 0 && (
            <View style={styles.concernContainer}>
              <Ionicons name="warning" size={16} color="#FF8C00" />
              <Text style={styles.concernText}>
                {insight.concerns[0]}
              </Text>
            </View>
          )}
          
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>
              Tap for {expanded ? 'less' : 'detailed analysis'}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>
          Unable to load coaching insights. Tap to refresh.
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderDetailedInsight = () => (
    <View style={styles.detailedContainer}>
      {/* Collapsible Header */}
      <TouchableOpacity 
        style={styles.detailedHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <Ionicons name="fitness" size={20} color={AppColors.primary} />
          <Text style={styles.title}>AI Nutrition Coach</Text>
          <Ionicons 
            name="chevron-up" 
            size={18} 
            color={AppColors.primary}
            style={styles.headerChevron}
          />
        </View>
        {insight?.weeklyScore && (
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(insight.weeklyScore) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(insight.weeklyScore) }]}>
              {insight.weeklyScore}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollableContent} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Simple action-focused summary */}
        <View style={styles.section}>
          <Text style={styles.compactSummary}>
            {insight.weeklyInsight || insight.suggestion || "Keep tracking your meals for personalized insights!"}
          </Text>
        </View>

        {/* Quick wins and concerns in compact format */}
        <View style={styles.quickTipsContainer}>
          {insight.achievements && insight.achievements.length > 0 && (
            <View style={styles.quickTipItem}>
              <Text style={styles.quickTipEmoji}>✅</Text>
              <Text style={styles.quickTipText}>{insight.achievements[0]}</Text>
            </View>
          )}

          {insight.concerns && insight.concerns.length > 0 && (
            <View style={styles.quickTipItem}>
              <Text style={styles.quickTipEmoji}>⚠️</Text>
              <Text style={styles.quickTipText}>{insight.concerns[0]}</Text>
            </View>
          )}

          {/* Top 2 actionable recommendations only */}
          {insight.recommendations?.calories && (
            <View style={styles.quickTipItem}>
              <Text style={styles.quickTipEmoji}>💡</Text>
              <Text style={styles.quickTipText}>{insight.recommendations.calories}</Text>
            </View>
          )}

          {insight.recommendations?.macros && (
            <View style={styles.quickTipItem}>
              <Text style={styles.quickTipEmoji}>🥗</Text>
              <Text style={styles.quickTipText}>{insight.recommendations.macros}</Text>
            </View>
          )}
        </View>

        {/* Health alerts if any */}
        {insight.redFlags && insight.redFlags.length > 0 && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>🚨 Important</Text>
            <Text style={styles.alertText}>{insight.redFlags[0]}</Text>
          </View>
        )}

        {insight.encouragement && (
          <View style={styles.encouragementSection}>
            <Text style={styles.encouragementText}>{insight.encouragement}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={16} color={AppColors.primary} />
          <Text style={styles.refreshButtonText}>Get Fresh Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, style, expanded && styles.expandedContainer]}>
      {expanded ? renderDetailedInsight() : renderQuickInsight()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedContainer: {
    maxHeight: 500, // Max height with proper scrolling
    minHeight: 300, // Minimum height for content
  },
  quickInsightContainer: {
    padding: 16,
  },
  detailedContainer: {
    flex: 1,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: '#F8F9FA',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 40, // More padding at bottom for better scroll experience
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  headerChevron: {
    marginLeft: 8,
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  weeklyInsight: {
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 13,
    color: '#28A745',
    marginLeft: 6,
    flex: 1,
  },
  concernContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  concernText: {
    fontSize: 13,
    color: '#FF8C00',
    marginLeft: 6,
    flex: 1,
  },
  tapHint: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    marginTop: 8,
  },
  tapHintText: {
    fontSize: 12,
    color: AppColors.primary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  bulletPoint: {
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  recommendationText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  redFlagSection: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  redFlagTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 8,
  },
  redFlagText: {
    fontSize: 14,
    color: '#DC3545',
    lineHeight: 20,
  },
  encouragementSection: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 14,
    color: AppColors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // New compact styles
  compactSummary: {
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  quickTipsContainer: {
    marginTop: 16,
  },
  quickTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  quickTipEmoji: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  quickTipText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  alertContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C00',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 18,
  },
});

export default AICoachCard;
