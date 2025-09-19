import React from 'react';
import { View, Text } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define colors directly
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

const MinimalNavigation = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', color: AppColors.primary },
    { id: 'debug', label: 'Debug', icon: 'bug-outline', activeIcon: 'bug', color: AppColors.warning }, // Added Debug tab
    { id: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant', color: AppColors.nutrition },
    { id: 'account', label: 'Account', icon: 'person-outline', activeIcon: 'person', color: AppColors.account },
  ];

  return (
    <View 
      style={{
        flexDirection: 'row',
        backgroundColor: AppColors.white,
        borderTopWidth: 1,
        borderTopColor: AppColors.border,
        paddingVertical: 8,
        paddingHorizontal: 8,
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
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={{
              alignItems: 'center',
              position: 'relative',
            }}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? tab.color : AppColors.textLight}
              />
              <Text 
                style={{
                  fontSize: 11,
                  color: isActive ? tab.color : AppColors.textLight,
                  fontWeight: isActive ? '600' : '400',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View 
                  style={{
                    position: 'absolute',
                    bottom: -12,
                    width: 30,
                    height: 2,
                    backgroundColor: tab.color,
                    borderRadius: 1,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MinimalNavigation;
