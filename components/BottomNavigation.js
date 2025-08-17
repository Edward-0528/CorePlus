import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, scaleWidth } from '../utils/responsive';

const BottomNavigation = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'workouts', label: 'Workouts', icon: 'fitness' },
    { id: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
    { id: 'account', label: 'Account', icon: 'person' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={tab.icon}
            size={22}
            color={activeTab === tab.id ? '#4A90E2' : '#8E8E93'}
            style={{ marginBottom: 2 }}
          />
          <Text style={[
            styles.label,
            activeTab === tab.id && styles.activeLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#F0F8FF',
  },
  label: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default BottomNavigation;
