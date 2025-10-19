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

  const renderScoreBar = () => {
    const percentage = (rec.score / 10) * 100;
    
    return (
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Health Score</Text>
        <View style={styles.scoreBarContainer}>
          <View style={styles.scoreBarBackground}>
            <View 
              style={[
                styles.scoreBarFill, 
                { 
                  width: `${percentage}%`,
                  backgroundColor: recommendationColor 
                }
              ]} 
            />
          </View>
          <Text style={[styles.scoreText, { color: recommendationColor }]}>
            {rec.score}/10
          </Text>
        </View>
      </View>
    );
  };

  const renderProsAndCons = () => (
    <View style={styles.prosConsContainer}>
      {rec.pros && rec.pros.length > 0 && (
        <View style={styles.prosContainer}>
          <View style={styles.prosHeader}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={styles.prosTitle}>Benefits</Text>
          </View>
          {rec.pros.map((pro, index) => (
            <View key={index} style={styles.proItem}>
              <Text style={styles.proText}>• {pro}</Text>
            </View>
          ))}
        </View>
      )}

      {rec.cons && rec.cons.length > 0 && (
        <View style={styles.consContainer}>
          <View style={styles.consHeader}>
            <Ionicons name="warning" size={20} color={AppColors.warning} />
            <Text style={styles.consTitle}>Consider</Text>
          </View>
          {rec.cons.map((con, index) => (
            <View key={index} style={styles.conItem}>
              <Text style={styles.conText}>• {con}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderNutritionInfo = () => (
    <View style={styles.nutritionContainer}>
      <Text style={styles.nutritionTitle}>Nutrition Facts</Text>
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Calories</Text>
          <Text style={styles.nutritionValue}>{food.calories}</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Protein</Text>
          <Text style={styles.nutritionValue}>{food.protein}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Carbs</Text>
          <Text style={styles.nutritionValue}>{food.carbs}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Fat</Text>
          <Text style={styles.nutritionValue}>{food.fat}g</Text>
        </View>
        {food.fiber > 0 && (
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Fiber</Text>
            <Text style={styles.nutritionValue}>{food.fiber}g</Text>
          </View>
        )}
        {food.sugar > 0 && (
          <View style={styles.nutritionItem}>
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
      <View style={styles.alternativesContainer}>
        <View style={styles.alternativesHeader}>
          <Ionicons name="swap-horizontal" size={20} color={AppColors.primary} />
          <Text style={styles.alternativesTitle}>Better Alternatives</Text>
        </View>
        {rec.betterAlternatives.map((alternative, index) => (
          <View key={index} style={styles.alternativeItem}>
            <Ionicons name="arrow-forward" size={16} color={AppColors.primary} />
            <Text style={styles.alternativeText}>{alternative}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Analysis</Text>
        <TouchableOpacity style={styles.headerButton} onPress={onTryAgain}>
          <Ionicons name="camera" size={24} color={AppColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Recommendation */}
        <LinearGradient
          colors={[recommendationColor + '20', recommendationColor + '10']}
          style={styles.recommendationCard}
        >
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationEmoji}>{recommendationEmoji}</Text>
            <View style={styles.recommendationTitleContainer}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={[styles.recommendationTitle, { color: recommendationColor }]}>
                {recommendationTitle}
              </Text>
            </View>
          </View>
          
          <Text style={styles.recommendationReason}>{rec.reason}</Text>
          
          {renderScoreBar()}
        </LinearGradient>

        {/* Nutrition Facts */}
        {renderNutritionInfo()}

        {/* Pros and Cons */}
        {renderProsAndCons()}

        {/* Portion Advice */}
        {rec.portionAdvice && (
          <View style={styles.portionCard}>
            <View style={styles.portionHeader}>
              <Ionicons name="restaurant" size={20} color={AppColors.primary} />
              <Text style={styles.portionTitle}>Portion Advice</Text>
            </View>
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
        <TouchableOpacity style={styles.tryAgainButton} onPress={onTryAgain}>
          <Ionicons name="camera" size={20} color={AppColors.primary} />
          <Text style={styles.tryAgainText}>Analyze Another</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recommendationCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  recommendationTitleContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  scoreContainer: {
    marginTop: 10,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.lightGray,
    borderRadius: 4,
    marginRight: 12,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
  },
  nutritionContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  prosConsContainer: {
    marginTop: 24,
    gap: 16,
  },
  prosContainer: {
    padding: 16,
    backgroundColor: AppColors.success + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
  },
  prosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.success,
    marginLeft: 8,
  },
  proItem: {
    marginBottom: 4,
  },
  proText: {
    fontSize: 14,
    color: AppColors.text,
    lineHeight: 20,
  },
  consContainer: {
    padding: 16,
    backgroundColor: AppColors.warning + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.warning,
  },
  consHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.warning,
    marginLeft: 8,
  },
  conItem: {
    marginBottom: 4,
  },
  conText: {
    fontSize: 14,
    color: AppColors.text,
    lineHeight: 20,
  },
  portionCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: AppColors.primary + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  portionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  portionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
    marginLeft: 8,
  },
  portionText: {
    fontSize: 14,
    color: AppColors.text,
    lineHeight: 20,
  },
  alternativesContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
    marginLeft: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 14,
    color: AppColors.text,
    marginLeft: 8,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    gap: 12,
  },
  tryAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.white,
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
    marginLeft: 8,
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
  },
});

export default FoodRecommendationScreen;
