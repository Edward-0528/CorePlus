import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, fonts, scaleWidth } from '../utils/responsive';

const BottomNavigation = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home', color: Colors.primary },
    { id: 'workouts', label: 'Workouts', icon: 'fitness', color: Colors.workout },
    { id: 'nutrition', label: 'Nutrition', icon: 'restaurant', color: Colors.nutrition },
    { id: 'account', label: 'Account', icon: 'person', color: Colors.account },
  ];

  return (
    <View 
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 8,
            }}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <LinearGradient
                colors={[tab.color, `${tab.color}80`]}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  top: -20,
                  shadowColor: tab.color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={26}
                  color={Colors.white}
                />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${tab.color}15`,
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={tab.color}
                />
              </View>
            )}
            {!isActive && (
              <Text style={{
                fontSize: 11,
                fontWeight: '500',
                textAlign: 'center',
                color: Colors.textSecondary,
                marginTop: 4,
              }}>
                {tab.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;
