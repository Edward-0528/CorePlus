import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Alert, StyleSheet, Switch } from 'react-native';
import { View, Modal, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureAccess } from '../../../hooks/useFeatureAccess';
import { AppColors, validateColor } from '../../../constants/AppColors';
import UpgradeModal from '../subscription/UpgradeModal';
import { userStatsService } from '../../../services/userStatsService';
import { useTheme } from '../../../contexts/ThemeContext';


const WorkingMinimalAccount = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userStats, setUserStats] = useState({
    daysActive: 0,
    totalMeals: 0,
    daysSinceJoining: 0,
    currentStreak: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Use theme context for dark mode
  const { isDarkMode, toggleTheme, colors } = useTheme();
  
  // Use our new subscription system
  const { subscriptionInfo } = useFeatureAccess();
  const isPremium = subscriptionInfo?.tier === 'pro';

  // Load user statistics
  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const result = await userStatsService.getUserStats();
      
      if (result.success) {
        setUserStats(result.stats);
        console.log('📊 Loaded user stats:', result.stats);
      } else {
        console.error('Failed to load user stats:', result.error);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load stats on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  }, []);

  const userStatsDisplay = [
    { 
      value: statsLoading ? '...' : userStats.daysActive.toString(), 
      label: 'Days Active', 
      color: AppColors.success 
    },
    { 
      value: statsLoading ? '...' : userStats.currentStreak.toString(), 
      label: 'Current Streak', 
      color: AppColors.workout 
    },
    { 
      value: statsLoading ? '...' : userStats.totalMeals.toString(), 
      label: 'Meals Logged', 
      color: AppColors.nutrition 
    },
    { 
      value: statsLoading ? '...' : userStats.daysSinceJoining.toString(), 
      label: 'Days Since Joining', 
      color: AppColors.warning 
    },
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
          value: isDarkMode,
          onToggle: toggleTheme
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
        <View style={[
          minimalStyles.avatarContainer,
          {
            borderWidth: 3,
            borderColor: isPremium ? '#B8860B' : '#000000', // Darker gold for better contrast
            borderRadius: 33, // Slightly larger to accommodate border
          }
        ]}>
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
        {userStatsDisplay.map((stat, index) => (
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
        <Text style={[minimalStyles.sectionTitle, dynamicStyles.sectionTitle]}>{section.section}</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={[minimalStyles.card, dynamicStyles.card]}>
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
                    dynamicStyles.menuItemTitle,
                    item.premium && isPremium && { color: AppColors.warning }
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[minimalStyles.menuItemSubtitle, dynamicStyles.menuItemSubtitle]}>{item.subtitle}</Text>
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

  // Create dynamic styles based on current theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    headerSection: {
      backgroundColor: colors.white,
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    content: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.white,
      marginHorizontal: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    menuItemSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={[minimalStyles.container, dynamicStyles.container]}>
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
