import React, { useState } from 'react';
import { ScrollView, RefreshControl, Alert, StyleSheet, View, Modal, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { AppColors, validateColor } from '../constants/AppColors';
import UpgradeModal from './UpgradeModal';

const WorkingMinimalAccount = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Use our new subscription system
  const { subscriptionInfo } = useFeatureAccess();
  const isPremium = subscriptionInfo?.tier === 'pro';

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const userStats = [
    { value: '24', label: 'Days Active', color: AppColors.success },
    { value: '45', label: 'Workouts', color: AppColors.workout },
    { value: '127', label: 'Meals Logged', color: AppColors.nutrition },
    { value: '8.5', label: 'Avg Rating', color: AppColors.warning },
  ];

  const menuItems = [
    {
      section: 'Profile',
      items: [
        { icon: 'person-outline', title: 'Edit Profile', subtitle: 'Name, email, preferences' },
        { icon: 'fitness-outline', title: 'Health Goals', subtitle: 'Weight, activity level' },
        { icon: 'star-outline', title: 'Achievements', subtitle: 'View your progress' },
      ]
    },
    {
      section: 'Subscription',
      items: [
        { 
          icon: isPremium ? 'diamond' : 'diamond-outline', 
          title: isPremium ? 'Core+ Premium' : 'Upgrade to Premium', 
          subtitle: isPremium ? 'Manage your subscription' : 'Unlock all features',
          onPress: () => {
            console.log('🔔 Subscription button pressed, isPremium:', isPremium);
            setShowUpgradeModal(true);
          },
          premium: true
        },
      ]
    },
    {
      section: 'Preferences',
      items: [
        { 
          icon: 'notifications-outline', 
          title: 'Notifications', 
          subtitle: 'Meal reminders, updates',
          toggle: true,
          value: notifications,
          onToggle: setNotifications
        },
        { 
          icon: 'finger-print-outline', 
          title: 'Biometric Login', 
          subtitle: 'Face ID, Touch ID',
          toggle: true,
          value: biometrics,
          onToggle: setBiometrics
        },
        { 
          icon: 'moon-outline', 
          title: 'Dark Mode', 
          subtitle: 'Change app appearance',
          toggle: true,
          value: darkMode,
          onToggle: setDarkMode
        },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQ, contact us' },
        { icon: 'document-text-outline', title: 'Privacy Policy', subtitle: 'How we protect your data' },
        { icon: 'shield-outline', title: 'Terms of Service', subtitle: 'Usage terms and conditions' },
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const renderHeader = () => (
    <View style={minimalStyles.header}>
      <View style={minimalStyles.headerContent}>
        <View>
          <Text style={minimalStyles.title}>Account</Text>
          <Text style={minimalStyles.subtitle}>Manage your profile and settings</Text>
        </View>
      </View>
      <View style={minimalStyles.separator} />
    </View>
  );

  const renderUserProfile = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.profileCard}>
        <View style={minimalStyles.avatarContainer}>
          <View style={minimalStyles.avatar}>
            <Text style={minimalStyles.avatarText}>
              {user?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <View style={minimalStyles.profileInfo}>
          <Text style={minimalStyles.profileName}>
            {user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}
          </Text>
          <Text style={minimalStyles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity style={minimalStyles.editButton}>
            <Text style={minimalStyles.editButtonText}>Edit Profile</Text>
            <View style={minimalStyles.editButtonUnderline} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderUserStats = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.statsContainer}>
        {userStats.map((stat, index) => (
          <View key={index} style={minimalStyles.statItem}>
            <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={minimalStyles.statLabel}>{stat.label}</Text>
            {index < userStats.length - 1 && <View style={minimalStyles.statDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderMenuSection = (section) => (
    <View key={section.section} style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>{section.section}</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.card}>
        {section.items.map((item, index) => (
          <View key={index}>
            <TouchableOpacity 
              style={[
                minimalStyles.menuItem,
                item.premium && isPremium && minimalStyles.premiumMenuItem
              ]}
              onPress={item.onPress || (() => console.log(`Pressed ${item.title}`))}
            >
              <View style={minimalStyles.menuItemContent}>
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={item.premium && isPremium ? AppColors.warning : AppColors.textSecondary} 
                />
                <View style={minimalStyles.menuItemText}>
                  <Text style={[
                    minimalStyles.menuItemTitle,
                    item.premium && isPremium && { color: AppColors.warning }
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={minimalStyles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                {item.premium && isPremium && (
                  <View style={minimalStyles.premiumBadge}>
                    <Text style={minimalStyles.premiumBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              {item.toggle ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  thumbColor={item.value ? AppColors.primary : AppColors.textLight}
                  trackColor={{ false: AppColors.border, true: AppColors.primary + '40' }}
                />
              ) : (
                <Ionicons name="chevron-forward-outline" size={16} color={AppColors.textLight} />
              )}
            </TouchableOpacity>
            {index < section.items.length - 1 && <View style={minimalStyles.menuDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderLogoutButton = () => (
    <View style={minimalStyles.section}>
      <TouchableOpacity style={minimalStyles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
        <Text style={minimalStyles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={minimalStyles.container}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        {renderUserProfile()}
        {renderUserStats()}
        {menuItems.map(renderMenuSection)}
        {renderLogoutButton()}
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </View>
  );
};

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  editButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  editButtonUnderline: {
    height: 1,
    backgroundColor: AppColors.primary,
    marginTop: 2,
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 1,
    backgroundColor: AppColors.border,
  },
  card: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginTop: 8,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.danger,
    marginLeft: 8,
  },
  premiumMenuItem: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.warning,
  },
  premiumBadge: {
    backgroundColor: AppColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: AppColors.white,
  },
});

export default WorkingMinimalAccount;
