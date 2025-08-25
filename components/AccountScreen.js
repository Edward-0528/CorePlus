import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { spacing, fonts } from '../utils/responsive';
import DailyUsageProgressCard from './DailyUsageProgressCard';
import WhiteMotionBackground from './common/WhiteMotionBackground';

const AccountScreen = ({ user, onLogout, loading, styles }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WhiteMotionBackground>
        <ScrollView style={localStyles.container}>
          <View style={localStyles.content}>
            {/* Daily Usage Section */}
            <DailyUsageProgressCard />
            
            <View style={localStyles.section}>
          <Text style={localStyles.cardTitle}>Profile Information</Text>
          <View style={localStyles.profileRow}>
            <Text style={localStyles.profileLabel}>Email:</Text>
            <Text style={localStyles.profileValue}>{user?.email || 'Not available'}</Text>
          </View>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.section}>
          <Text style={localStyles.cardTitle}>Preferences</Text>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Notifications</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Units & Measurements</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Privacy</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Support</Text>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Help Center</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Contact Support</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.menuItem}>
            <Text style={localStyles.menuText}>Terms of Service</Text>
            <Text style={localStyles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[localStyles.button, localStyles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[localStyles.buttonText, localStyles.logoutText]}>Logout</Text>
        </TouchableOpacity>
          </View>
        </ScrollView>
      </WhiteMotionBackground>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  section: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  profileValue: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.9)',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuText: {
    fontSize: fonts.regular,
    color: 'rgba(0, 0, 0, 0.85)',
  },
  menuArrow: {
    fontSize: fonts.large,
    color: 'rgba(0, 0, 0, 0.3)',
  },
  button: {
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FFB6C1',
    marginTop: spacing.lg,
  },
  logoutText: {
    color: '#FFFFFF',
  },
});

export default AccountScreen;
