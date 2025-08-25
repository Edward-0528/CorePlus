import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { spacing, fonts, scaleWidth } from '../utils/responsive';

// CircularGauge component
const CircularGauge = ({ size = 140, stroke = 12, progress = 62.5, value = 1250, goal = 2000 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress)) || 0;
  const dashoffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  
  // Check if over goal for color changes
  const isOverGoal = value > goal;
  const strokeColor = isOverGoal ? "#FF6B6B" : "#87CEEB";
  const valueColor = isOverGoal ? "#FF6B6B" : "#1D1D1F";

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#F2F2F7" strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: fonts.large, fontWeight: '800', color: valueColor }}>
          {value}{isOverGoal && ' ⚠️'}
        </Text>
        <Text style={{ fontSize: fonts.small, color: '#8E8E93', textAlign: 'center' }}>
          of {goal}
        </Text>
      </View>
    </View>
  );
};

const DailyIntakeCard = ({ 
  dailyCalories = 0,
  dailyMacros = { carbs: 0, protein: 0, fat: 0 },
  calorieGoal = 2000,
  carbsGoal = 258,
  proteinGoal = 125,
  fatGoal = 56,
  isLoading = false,
  onPress = null,
  compact = false,
  showExpandButton = false,
  onToggleExpanded = null,
  isExpanded = false
}) => {
  const progress = (dailyCalories / calorieGoal) * 100;
  const totalCalories = dailyCalories;
  const totalCarbs = dailyMacros.carbs;
  const totalProtein = dailyMacros.protein;
  const totalFat = dailyMacros.fat;

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: spacing.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    opacity: isLoading ? 0.6 : 1,
  };

  const renderCardContent = () => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <Ionicons name="flash-outline" size={18} color="#111" />
        <Text style={{
          fontSize: fonts.medium,
          fontWeight: '600',
          color: '#1D1D1F',
          marginLeft: spacing.xs,
        }}>
          Daily Intake
        </Text>
        {isLoading && (
          <Text style={{ fontSize: fonts.small, color: '#8E8E93', marginLeft: spacing.xs }}>
            • Loading...
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: fonts.xlarge,
            fontWeight: '800',
            color: '#1D1D1F',
          }}>
            {(Math.round(progress * 10) / 10).toFixed(1)}%
          </Text>
        </View>
        <CircularGauge 
          size={compact ? 100 : scaleWidth(120)} 
          stroke={compact ? 8 : scaleWidth(12)} 
          progress={progress} 
          value={totalCalories} 
          goal={calorieGoal} 
        />
      </View>

      {!compact && (
        <>
          <View style={{ height: spacing.md }} />
          
          {/* Carbs Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Carbs</Text>
              <Text style={{ fontSize: fonts.small, color: totalCarbs > carbsGoal ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(totalCarbs)}g / {carbsGoal}g
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
                width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%`,
                backgroundColor: totalCarbs > carbsGoal ? "#FF6B6B" : "#87CEEB",
                borderRadius: 3,
              }} />
            </View>
          </View>

          {/* Proteins Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Proteins</Text>
              <Text style={{ fontSize: fonts.small, color: totalProtein > proteinGoal ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(totalProtein)}g / {proteinGoal}g
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
                width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%`,
                backgroundColor: totalProtein > proteinGoal ? "#FF6B6B" : "#B0E0E6",
                borderRadius: 3,
              }} />
            </View>
          </View>

          {/* Fats Bar */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: fonts.small, fontWeight: '500', color: '#1D1D1F' }}>Fats</Text>
              <Text style={{ fontSize: fonts.small, color: totalFat > fatGoal ? '#FF6B6B' : '#8E8E93' }}>
                {Math.round(totalFat)}g / {fatGoal}g
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
                width: `${Math.min((totalFat / fatGoal) * 100, 100)}%`,
                backgroundColor: totalFat > fatGoal ? "#FF6B6B" : "#ADD8E6",
                borderRadius: 3,
              }} />
            </View>
          </View>
        </>
      )}

      {compact && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.small, color: '#87CEEB', fontWeight: '600' }}>
              {Math.round(totalCarbs)}g
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>Carbs</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.small, color: '#B0E0E6', fontWeight: '600' }}>
              {Math.round(totalProtein)}g
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>Protein</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.small, color: '#ADD8E6', fontWeight: '600' }}>
              {Math.round(totalFat)}g
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>Fat</Text>
          </View>
        </View>
      )}

      {showExpandButton && (
        <TouchableOpacity 
          onPress={onToggleExpanded}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.sm,
            paddingVertical: spacing.xs,
          }}
        >
          <Text style={{
            fontSize: fonts.small,
            color: '#4682B4',
            fontWeight: '500',
            marginRight: spacing.xs,
          }}>
            {isExpanded ? 'Show Less' : 'View Details'}
          </Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#4682B4" 
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {renderCardContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {renderCardContent()}
    </View>
  );
};

export default DailyIntakeCard;
