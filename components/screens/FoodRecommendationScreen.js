import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../constants/AppColors';
import foodRecommendationService from '../../services/foodRecommendationService';

const FoodRecommendationScreen = ({ recommendation, onClose, onTryAgain }) => {
  const { food, recommendation: rec } = recommendation;
  
  const recommendationColor = foodRecommendationService.getRecommendationColor(rec.score);
  const recommendationEmoji = foodRecommendationService.getRecommendationEmoji(rec.shouldEat, rec.score);
  const recommendationTitle = foodRecommendationService.getRecommendationTitle(rec.shouldEat, rec.score);

  const renderScoreSection = () => {
    return (
      <View style={styles.scoreSection}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Health Assessment</Text>
          <View style={styles.scoreValueContainer}>
            <Text style={[styles.scoreValue, { color: recommendationColor }]}>
              {rec.score}
            </Text>
            <Text style={styles.scoreOutOf}>/10</Text>
          </View>
        </View>
        <View style={styles.scoreBar}>
          <View 
            style={[
              styles.scoreProgress, 
              { 
                width: `${(rec.score / 10) * 100}%`,
                backgroundColor: recommendationColor 
              }
            ]} 
          />
        </View>
        <Text style={[styles.recommendationStatus, { color: recommendationColor }]}>
          {recommendationTitle}
        </Text>
      </View>
    );
  };

  const renderInsights = () => (
    <View style={styles.insightsContainer}>
      {rec.pros && rec.pros.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>Nutritional Benefits</Text>
          <View style={styles.insightList}>
            {rec.pros.map((pro, index) => (
              <Text key={index} style={styles.insightText}>
                {pro}
              </Text>
            ))}
          </View>
        </View>
      )}

      {rec.cons && rec.cons.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>Considerations</Text>
          <View style={styles.insightList}>
            {rec.cons.map((con, index) => (
              <Text key={index} style={styles.insightText}>
                {con}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderNutritionInfo = () => (
    <View style={styles.nutritionSection}>
      <Text style={styles.sectionTitle}>Nutrition Facts</Text>
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Calories</Text>
          <Text style={styles.nutritionValue}>{food.calories}</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Protein</Text>
          <Text style={styles.nutritionValue}>{food.protein}g</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Carbohydrates</Text>
          <Text style={styles.nutritionValue}>{food.carbs}g</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Fat</Text>
          <Text style={styles.nutritionValue}>{food.fat}g</Text>
        </View>
        {food.fiber > 0 && (
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Fiber</Text>
            <Text style={styles.nutritionValue}>{food.fiber}g</Text>
          </View>
        )}
        {food.sugar > 0 && (
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sugar</Text>
            <Text style={styles.nutritionValue}>{food.sugar}g</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAlternatives = () => {
    if (!rec.betterAlternatives || rec.betterAlternatives.length === 0) return null;
    
    return (
      <View style={styles.alternativesSection}>
        <Text style={styles.sectionTitle}>Better Alternatives</Text>
        <View style={styles.alternativesList}>
          {rec.betterAlternatives.map((alternative, index) => (
            <Text key={index} style={styles.alternativeText}>
              {alternative}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Analysis</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Name & Analysis */}
        <View style={styles.mainSection}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.analysisReason}>{rec.reason}</Text>
        </View>

        {/* Health Score */}
        {renderScoreSection()}

        {/* Nutrition Facts */}
        {renderNutritionInfo()}

        {/* Insights */}
        {renderInsights()}

        {/* Portion Advice */}
        {rec.portionAdvice && (
          <View style={styles.portionSection}>
            <Text style={styles.sectionTitle}>Portion Guidance</Text>
            <Text style={styles.portionText}>{rec.portionAdvice}</Text>
          </View>
        )}

        {/* Better Alternatives */}
        {renderAlternatives()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onTryAgain}>
          <Text style={styles.secondaryButtonText}>Analyze Another</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainSection: {
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  foodName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  analysisReason: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  scoreSection: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreOutOf: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6C757D',
    marginLeft: 2,
  },
  scoreBar: {
    height: 6,
    backgroundColor: '#F1F3F4',
    borderRadius: 3,
    marginBottom: 12,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationStatus: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionSection: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
  },
  nutritionGrid: {
    gap: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '400',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  insightsContainer: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    gap: 32,
  },
  insightSection: {
    gap: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  insightList: {
    gap: 12,
  },
  insightText: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
    paddingLeft: 16,
  },

  portionSection: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  portionText: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  alternativesSection: {
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  alternativesList: {
    gap: 12,
  },
  alternativeText: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
    paddingLeft: 16,
  },
  bottomSpacing: {
    height: 32,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FoodRecommendationScreen;
