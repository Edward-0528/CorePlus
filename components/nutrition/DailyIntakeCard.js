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
  const valueColor = isOverGoal ? "#FF6B6B" : "rgba(0, 0, 0, 0.85)";

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
          {value}{isOverGoal && <Text> ⚠️</Text>}
        </Text>
        <Text style={{ fontSize: fonts.small, color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center' }}>
          of {goal}
        </Text>
      </View>
    </View>
  );
};

const DailyIntakeCard = ({ 
  dailyCalories = 0,
  dailyMacros = { carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  calorieGoal = 2000,
  carbsGoal = 258,
  proteinGoal = 125,
  fatGoal = 56,
  fiberGoal = 25,
  sugarGoal = 50,
  sodiumGoal = 2300,
  isLoading = false,
  onPress = null,
  compact = false,
  showExpandButton = true,
  onToggleExpanded = null,
  isExpanded = false
}) => {
  const progress = (dailyCalories / calorieGoal) * 100;
  const totalCalories = dailyCalories;
  const totalCarbs = dailyMacros.carbs;
  const totalProtein = dailyMacros.protein;
  const totalFat = dailyMacros.fat;
  const totalFiber = dailyMacros.fiber || 0;
  const totalSugar = dailyMacros.sugar || 0;
  const totalSodium = dailyMacros.sodium || 0;

  const cardStyle = {
    backgroundColor: 'transparent',
    borderRadius: 0,
    margin: 0,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    opacity: isLoading ? 0.6 : 1,
  };

  const renderCardContent = () => (
    <>
      {/* Minimal Header - Always Visible */}
      <TouchableOpacity 
        onPress={onToggleExpanded}
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: isExpanded ? spacing.lg : spacing.md, 
          paddingBottom: spacing.md, 
          borderBottomWidth: 1, 
          borderBottomColor: 'rgba(0, 0, 0, 0.08)' 
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="flash-outline" size={22} color="rgba(0, 0, 0, 0.7)" />
          <Text style={{
            fontSize: fonts.large,
            fontWeight: '600',
            color: 'rgba(0, 0, 0, 0.9)',
            marginLeft: spacing.sm,
          }}>
            Daily Intake
          </Text>
          {isLoading && (
            <Text style={{ 
              fontSize: fonts.small, 
              color: 'rgba(0, 0, 0, 0.5)', 
              marginLeft: spacing.xs,
              fontWeight: '300'
            }}>
              • Loading...
            </Text>
          )}
        </View>
        
        {/* Compact Stats - Always Visible */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: fonts.medium,
            fontWeight: '600',
            color: 'rgba(0, 0, 0, 0.9)',
            marginRight: spacing.sm,
          }}>
            {Math.round(totalCalories)} / {calorieGoal} cal
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="rgba(0, 0, 0, 0.5)" 
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Calorie Progress Circle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: fonts.xlarge,
                fontWeight: '600',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: spacing.xs,
              }}>
                {(Math.round(progress * 10) / 10).toFixed(1)}% of Goal
              </Text>
              <Text style={{
                fontSize: fonts.small,
                color: 'rgba(0, 0, 0, 0.6)',
              }}>
                {Math.round(totalCalories)} of {calorieGoal} calories
              </Text>
            </View>
            <CircularGauge 
              size={100} 
              stroke={8} 
              progress={progress} 
              value={totalCalories} 
              goal={calorieGoal} 
            />
          </View>
          
          {/* Detailed Macros */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{
              fontSize: fonts.medium,
              fontWeight: '600',
              color: 'rgba(0, 0, 0, 0.9)',
              marginBottom: spacing.md,
            }}>
              Macronutrients
            </Text>
            
            {/* Carbs */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Carbs</Text>
                <Text style={{ fontSize: fonts.small, color: totalCarbs > carbsGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalCarbs)}g / {carbsGoal}g
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%`,
                  backgroundColor: totalCarbs > carbsGoal ? "#FF6B6B" : "#87CEEB",
                  borderRadius: 2,
                }} />
              </View>
            </View>

            {/* Protein */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Protein</Text>
                <Text style={{ fontSize: fonts.small, color: totalProtein > proteinGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalProtein)}g / {proteinGoal}g
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%`,
                  backgroundColor: totalProtein > proteinGoal ? "#FF6B6B" : "#B0E0E6",
                  borderRadius: 2,
                }} />
              </View>
            </View>

            {/* Fat */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Fat</Text>
                <Text style={{ fontSize: fonts.small, color: totalFat > fatGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalFat)}g / {fatGoal}g
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalFat / fatGoal) * 100, 100)}%`,
                  backgroundColor: totalFat > fatGoal ? "#FF6B6B" : "#ADD8E6",
                  borderRadius: 2,
                }} />
              </View>
            </View>

            {/* Fiber */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Fiber</Text>
                <Text style={{ fontSize: fonts.small, color: totalFiber > fiberGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalFiber)}g / {fiberGoal}g
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalFiber / fiberGoal) * 100, 100)}%`,
                  backgroundColor: totalFiber > fiberGoal ? "#FF6B6B" : "#98FB98",
                  borderRadius: 2,
                }} />
              </View>
            </View>

            {/* Sugar */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Sugar</Text>
                <Text style={{ fontSize: fonts.small, color: totalSugar > sugarGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalSugar)}g / {sugarGoal}g
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalSugar / sugarGoal) * 100, 100)}%`,
                  backgroundColor: totalSugar > sugarGoal ? "#FF6B6B" : "#FFB6C1",
                  borderRadius: 2,
                }} />
              </View>
            </View>

            {/* Sodium */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: fonts.small, fontWeight: '500', color: 'rgba(0, 0, 0, 0.7)' }}>Sodium</Text>
                <Text style={{ fontSize: fonts.small, color: totalSodium > sodiumGoal ? '#FF6B6B' : 'rgba(0, 0, 0, 0.6)', fontWeight: '300' }}>
                  {Math.round(totalSodium)}mg / {sodiumGoal}mg
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((totalSodium / sodiumGoal) * 100, 100)}%`,
                  backgroundColor: totalSodium > sodiumGoal ? "#FF6B6B" : "#DDA0DD",
                  borderRadius: 2,
                }} />
              </View>
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
