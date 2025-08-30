import React, { useState } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  View, 
  Text, 
  Colors, 
  TouchableOpacity,
  Switch
} from 'react-native-ui-lib';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Minimal Components
import MinimalComponents from './design/MinimalComponents';
const { 
  MinimalCard,
  MinimalMetric,
  MinimalButton,
  MinimalSection,
  MinimalStats
} = MinimalComponents;

// Contexts
import { useSubscription } from '../contexts/SubscriptionContext';

const MinimalAccount = ({ user, onLogout, loading, styles }) => {
  const { isPremium } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const userStats = [
    { value: '24', label: 'Days Active', color: Colors.success },
    { value: '45', label: 'Workouts', color: Colors.workout },
    { value: '127', label: 'Meals', color: Colors.nutrition },
    { value: '8.5', label: 'Rating', color: Colors.warning },
  ];

  const profileSettings = [
    { icon: 'person-outline', title: 'Personal Information', subtitle: 'Name, email, phone' },
    { icon: 'lock-closed-outline', title: 'Privacy & Security', subtitle: 'Password, data settings' },
    { icon: 'heart-outline', title: 'Health Profile', subtitle: 'Goals, preferences' },
  ];

  const appSettings = [
    { 
      icon: 'notifications-outline', 
      title: 'Notifications', 
      subtitle: 'Push notifications',
      hasSwitch: true,
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled
    },
    { 
      icon: 'moon-outline', 
      title: 'Dark Mode', 
      subtitle: 'App theme',
      hasSwitch: true,
      value: darkModeEnabled,
      onToggle: setDarkModeEnabled
    },
    { icon: 'language-outline', title: 'Language', subtitle: 'English' },
    { icon: 'download-outline', title: 'Data Export', subtitle: 'Download your data' },
  ];

  const supportItems = [
    { icon: 'help-circle-outline', title: 'Help Center', subtitle: 'FAQs and guides' },
    { icon: 'mail-outline', title: 'Contact Support', subtitle: 'Get help from our team' },
    { icon: 'star-outline', title: 'Rate App', subtitle: 'Share your feedback' },
    { icon: 'document-text-outline', title: 'Terms & Privacy', subtitle: 'Legal information' },
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
    <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.textPrimary}>Account</Text>
          <Text body2 color={Colors.textSecondary}>Manage your profile</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.account} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border, width: '100%' }} />
    </View>
  );

  const renderUserProfile = () => (
    <View paddingH-20>
      <MinimalCard>
        <View row centerV marginB-md>
          <View 
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: Colors.backgroundTertiary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: Colors.border,
            }}
          >
            <Text h5 color={Colors.textPrimary}>
              {(user?.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View flex marginL-md>
            <Text h6 color={Colors.textPrimary}>
              {user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}
            </Text>
            <Text body2 color={Colors.textSecondary}>{user?.email || 'user@example.com'}</Text>
            {isPremium() && (
              <View row centerV marginT-xs>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text caption color={Colors.warning} marginL-xs>Premium Member</Text>
              </View>
            )}
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 12 }} />
        
        {isPremium() ? (
          <View row centerV spread>
            <View>
              <Text body1 color={Colors.textPrimary}>Premium Active</Text>
              <Text caption color={Colors.textSecondary}>Full access to all features</Text>
            </View>
            <MinimalButton title="Manage" color={Colors.warning} />
          </View>
        ) : (
          <View row centerV spread>
            <View>
              <Text body1 color={Colors.textPrimary}>Free Plan</Text>
              <Text caption color={Colors.textSecondary}>Upgrade for more features</Text>
            </View>
            <MinimalButton title="Upgrade" color={Colors.primary} />
          </View>
        )}
      </MinimalCard>
    </View>
  );

  const renderUserStats = () => (
    <View paddingH-20 marginT-lg>
      <MinimalStats stats={userStats} />
    </View>
  );

  const renderSettingsSection = (title, items) => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title={title} />
      <MinimalCard style={{ marginTop: 8 }}>
        {items.map((item, index) => (
          <View key={item.title}>
            <TouchableOpacity
              style={{ paddingVertical: 12 }}
              onPress={() => console.log(`Pressed ${item.title}`)}
            >
              <View row centerV spread>
                <View row centerV flex>
                  <Ionicons name={item.icon} size={20} color={Colors.textSecondary} />
                  <View flex marginL-md>
                    <Text body1 color={Colors.textPrimary}>{item.title}</Text>
                    {item.subtitle && (
                      <Text caption color={Colors.textSecondary}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
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
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 32 }} />
            )}
          </View>
        ))}
      </MinimalCard>
    </View>
  );

  const renderDangerZone = () => (
    <View paddingH-20 marginT-lg>
      <MinimalSection title="Account Actions" />
      <MinimalCard style={{ marginTop: 8 }}>
        <TouchableOpacity style={{ paddingVertical: 12 }} onPress={handleLogout}>
          <View row centerV>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text body1 color={Colors.error} marginL-md>Sign Out</Text>
          </View>
        </TouchableOpacity>
        
        <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 32 }} />
        
        <TouchableOpacity
          style={{ paddingVertical: 12 }}
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
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text body1 color={Colors.error} marginL-md>Delete Account</Text>
          </View>
        </TouchableOpacity>
      </MinimalCard>
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
        {renderUserProfile()}
        {renderUserStats()}
        {renderSettingsSection('Profile', profileSettings)}
        {renderSettingsSection('App Settings', appSettings)}
        {renderSettingsSection('Support', supportItems)}
        {renderDangerZone()}
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalAccount;
