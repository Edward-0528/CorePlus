import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Custom Components
import { 
  BeautifulCard, 
  MetricCard, 
  ActionButton, 
  SectionHeader,
  StatsRow,
  QuickAction,
  EmptyState
} from './design/Components';

// Contexts
import { useSubscription } from '../contexts/SubscriptionContext';

const BeautifulAccount = ({ user, onLogout, loading, styles }) => {
  const { isPremium, getCurrentTier } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Mock user stats
  const userStats = [
    { value: '24', label: 'Days Active', color: Colors.success },
    { value: '45', label: 'Workouts', color: Colors.workout },
    { value: '127', label: 'Meals Logged', color: Colors.nutrition },
    { value: '8.5', label: 'Avg Rating', color: Colors.warning },
  ];

  const accountSections = [
    {
      title: 'Profile & Settings',
      items: [
        { icon: 'person-outline', title: 'Personal Information', subtitle: 'Update your profile' },
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage your alerts', hasSwitch: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'moon-outline', title: 'Dark Mode', subtitle: 'Switch theme', hasSwitch: true, value: darkModeEnabled, onToggle: setDarkModeEnabled },
        { icon: 'shield-outline', title: 'Privacy & Security', subtitle: 'Manage your data' },
      ]
    },
    {
      title: 'Health & Fitness',
      items: [
        { icon: 'fitness-outline', title: 'Fitness Goals', subtitle: 'Set your targets' },
        { icon: 'restaurant-outline', title: 'Nutrition Preferences', subtitle: 'Dietary restrictions' },
        { icon: 'heart-outline', title: 'Health Data', subtitle: 'Connect health apps' },
        { icon: 'analytics-outline', title: 'Progress Reports', subtitle: 'Weekly summaries' },
      ]
    },
    {
      title: 'App & Support',
      items: [
        { icon: 'star-outline', title: 'Rate Core+', subtitle: 'Love the app? Tell others!' },
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance' },
        { icon: 'document-text-outline', title: 'Terms & Privacy', subtitle: 'Legal information' },
        { icon: 'information-circle-outline', title: 'About', subtitle: 'Version 1.0.0' },
      ]
    }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
    <LinearGradient
      colors={[Colors.account, '#FFE066']}
      style={{
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.white}>Account</Text>
          <Text body1 color={Colors.white} style={{ opacity: 0.9 }}>
            Manage your profile & settings
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* User Profile Section */}
      <View row centerV>
        <View 
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text h2 color={Colors.white}>
            {(user?.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View flex marginL-md>
          <Text h5 color={Colors.white}>
            {user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}
          </Text>
          <Text body2 color={Colors.white} style={{ opacity: 0.9 }} marginT-xs>
            {user?.email || 'user@example.com'}
          </Text>
          {isPremium() && (
            <View 
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.3)',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignSelf: 'flex-start',
                marginTop: 8,
              }}
            >
              <View row centerV>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text caption color="#FFD700" marginL-xs>Premium Member</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  const renderUserStats = () => (
    <View paddingH-20 style={{ marginTop: -20 }}>
      <StatsRow stats={userStats} />
    </View>
  );

  const renderSubscriptionCard = () => (
    <View paddingH-20>
      {isPremium() ? (
        <BeautifulCard gradient={['#FFD700', '#FFA000']}>
          <View row centerV spread>
            <View flex>
              <View row centerV marginB-sm>
                <Ionicons name="star" size={20} color={Colors.white} />
                <Text h6 color={Colors.white} marginL-xs>Premium Active</Text>
              </View>
              <Text body2 color={Colors.white} style={{ opacity: 0.9 }}>
                Unlimited access to all features
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text caption color={Colors.white}>Manage</Text>
            </TouchableOpacity>
          </View>
        </BeautifulCard>
      ) : (
        <BeautifulCard gradient={[Colors.primary, Colors.primaryLight]}>
          <View row centerV spread>
            <View flex>
              <Text h6 color={Colors.white} marginB-xs>Upgrade to Premium</Text>
              <Text body2 color={Colors.white} style={{ opacity: 0.9 }}>
                Unlock advanced features & AI coaching
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.white,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text button color={Colors.primary}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </BeautifulCard>
      )}
    </View>
  );

  const renderAccountSection = (section) => (
    <View key={section.title} paddingH-20>
      <SectionHeader title={section.title} />
      <BeautifulCard>
        {section.items.map((item, index) => (
          <View key={item.title}>
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                opacity: item.disabled ? 0.5 : 1,
              }}
              disabled={item.disabled}
              onPress={() => {
                if (item.onPress) {
                  item.onPress();
                } else {
                  console.log(`Pressed ${item.title}`);
                }
              }}
            >
              <View row centerV spread>
                <View row centerV flex>
                  <View 
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: `${Colors.primary}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                  </View>
                  <View flex marginL-md>
                    <Text h6 color={Colors.textPrimary}>{item.title}</Text>
                    {item.subtitle && (
                      <Text body2 color={Colors.textSecondary} marginT-xs>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                <View row centerV>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      thumbColor={item.value ? Colors.primary : Colors.gray}
                      trackColor={{ 
                        false: Colors.backgroundTertiary, 
                        true: `${Colors.primary}30` 
                      }}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            {index < section.items.length - 1 && (
              <View 
                style={{
                  height: 1,
                  backgroundColor: Colors.border,
                  marginLeft: 56,
                }}
              />
            )}
          </View>
        ))}
      </BeautifulCard>
    </View>
  );

  const renderDangerZone = () => (
    <View paddingH-20>
      <SectionHeader title="Account Actions" />
      <BeautifulCard>
        <TouchableOpacity
          style={{ paddingVertical: 16 }}
          onPress={handleLogout}
        >
          <View row centerV>
            <View 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${Colors.error}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text h6 color={Colors.error} marginL-md>Sign Out</Text>
          </View>
        </TouchableOpacity>
        
        <View 
          style={{
            height: 1,
            backgroundColor: Colors.border,
            marginLeft: 56,
          }}
        />
        
        <TouchableOpacity
          style={{ paddingVertical: 16 }}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This action cannot be undone. All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' }
              ]
            );
          }}
        >
          <View row centerV>
            <View 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${Colors.error}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </View>
            <Text h6 color={Colors.error} marginL-md>Delete Account</Text>
          </View>
        </TouchableOpacity>
      </BeautifulCard>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundSecondary }}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.account]}
            tintColor={Colors.account}
          />
        }
      >
        {renderUserStats()}
        {renderSubscriptionCard()}
        
        {accountSections.map(renderAccountSection)}
        {renderDangerZone()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BeautifulAccount;
