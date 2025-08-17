import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { spacing, fonts } from '../utils/responsive';

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
    <ScrollView style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.title}>Account</Text>
        <Text style={localStyles.subtitle}>Manage your profile and settings</Text>
      </View>
      
      <View style={localStyles.content}>
        <View style={localStyles.card}>
          <Text style={localStyles.cardTitle}>Profile Information</Text>
          <View style={localStyles.profileRow}>
            <Text style={localStyles.profileLabel}>Email:</Text>
            <Text style={localStyles.profileValue}>{user?.email || 'Not available'}</Text>
          </View>
          <TouchableOpacity style={localStyles.button}>
            <Text style={localStyles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={localStyles.card}>
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
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: fonts.hero,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.regular,
    color: '#8E8E93',
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: fonts.regular,
    color: '#8E8E93',
  },
  profileValue: {
    fontSize: fonts.regular,
    color: '#1D1D1F',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuText: {
    fontSize: fonts.regular,
    color: '#1D1D1F',
  },
  menuArrow: {
    fontSize: fonts.large,
    color: '#C7C7CC',
  },
  button: {
    backgroundColor: '#4A90E2',
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
    backgroundColor: '#FF3B30',
    marginTop: spacing.lg,
  },
  logoutText: {
    color: '#FFFFFF',
  },
});

export default AccountScreen;
