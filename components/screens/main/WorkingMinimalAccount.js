import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Alert, StyleSheet, Switch, Image, TextInput } from 'react-native';
import { View, Modal, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { AppColors, validateColor } from '../../../constants/AppColors';
import UpgradeModal from '../subscription/UpgradeModal';
import EditProfileModal from '../../modals/EditProfileModal';
import { supabase } from '../../../supabaseConfig';


const WorkingMinimalAccount = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempFeet, setTempFeet] = useState('');
  const [tempInches, setTempInches] = useState('');

  // Use our new subscription system
  const { isPremium, subscriptionInfo } = useSubscription();

  // Calculate BMI from height and weight
  const calculateBMI = () => {
    const weight = currentUser?.user_metadata?.weight; // in pounds
    const heightInches = currentUser?.user_metadata?.height; // in inches
    
    if (!weight || !heightInches) {
      return null;
    }
    
    // BMI = (weight in pounds / (height in inches)²) × 703
    const bmi = (weight / (heightInches * heightInches)) * 703;
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  // Update current user when prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Refresh user data from Supabase
  const refreshUserData = async () => {
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  }, []);

  // Update user metadata
  const updateUserMetadata = async (updates) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...currentUser?.user_metadata,
          ...updates
        }
      });

      if (error) throw error;
      
      // Refresh user data
      await refreshUserData();
      console.log('✅ User metadata updated successfully');
    } catch (error) {
      console.error('❌ Error updating user metadata:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Handle weight update
  const handleWeightUpdate = () => {
    const weight = parseFloat(tempWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in pounds.');
      return;
    }
    
    updateUserMetadata({ weight });
    setShowWeightModal(false);
    setTempWeight('');
  };

  // Handle height update
  const handleHeightUpdate = () => {
    const feet = parseInt(tempFeet);
    const inches = parseInt(tempInches);
    
    if (isNaN(feet) || feet < 0 || isNaN(inches) || inches < 0 || inches >= 12) {
      Alert.alert('Invalid Height', 'Please enter a valid height (feet and inches).');
      return;
    }
    
    const totalInches = (feet * 12) + inches;
    updateUserMetadata({ height: totalInches });
    setShowHeightModal(false);
    setTempFeet('');
    setTempInches('');
  };

  // Open weight modal with current value
  const openWeightModal = () => {
    setTempWeight(currentUser?.user_metadata?.weight?.toString() || '');
    setShowWeightModal(true);
  };

  // Open height modal with current value
  const openHeightModal = () => {
    const currentHeight = currentUser?.user_metadata?.height || 0;
    setTempFeet(Math.floor(currentHeight / 12).toString());
    setTempInches((currentHeight % 12).toString());
    setShowHeightModal(true);
  };

  const menuItems = [
    {
      section: 'Profile',
      items: [
        { icon: 'person-outline', title: 'Edit Profile', subtitle: 'Name, email, preferences' },
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
        <TouchableOpacity 
          style={[
            minimalStyles.avatarContainer,
            {
              borderWidth: 3,
              borderColor: isPremium ? AppColors.primary : AppColors.black, // Olive for premium, black for free
              borderRadius: 33, // Slightly larger to accommodate border
              backgroundColor: '#FFFFFF', // White background
            }
          ]}
          activeOpacity={0.8}
          onPress={() => setShowEditProfileModal(true)}
        >
          <View style={[minimalStyles.avatar, { backgroundColor: '#FFFFFF' }]}>
            {currentUser?.user_metadata?.profile_image ? (
              <Image 
                source={{ uri: currentUser.user_metadata.profile_image }} 
                style={minimalStyles.avatarImage}
              />
            ) : (
              <Text style={[minimalStyles.avatarText, { color: AppColors.primary }]}>
                {currentUser?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={minimalStyles.profileInfo}>
          <Text style={minimalStyles.profileName}>
            {currentUser?.user_metadata?.first_name || 'User'} {currentUser?.user_metadata?.last_name || ''}
          </Text>
          <Text style={minimalStyles.profileEmail}>{currentUser?.email}</Text>
        </View>
      </View>
    </View>
  );

  const renderProfileInfo = () => {
    const profileData = [
      { 
        label: 'Weight', 
        value: currentUser?.user_metadata?.weight ? `${currentUser.user_metadata.weight} lbs` : 'Not set',
        icon: 'fitness-outline'
      },
      { 
        label: 'Height', 
        value: currentUser?.user_metadata?.height ? `${Math.floor(currentUser.user_metadata.height / 12)}'${currentUser.user_metadata.height % 12}"` : 'Not set',
        icon: 'resize-outline'
      },
      { 
        label: 'Gender', 
        value: currentUser?.user_metadata?.gender ? currentUser.user_metadata.gender.charAt(0).toUpperCase() + currentUser.user_metadata.gender.slice(1) : 'Not set',
        icon: 'person-outline'
      }
    ];

    return (
      <View style={minimalStyles.section}>
        <View style={minimalStyles.sectionHeader}>
          <Text style={[minimalStyles.sectionTitle, lightStyles.sectionTitle]}>Profile Information</Text>
        </View>
        <View style={minimalStyles.sectionLine} />
        
        <View style={[minimalStyles.card, lightStyles.card]}>
          {profileData.map((item, index) => (
            <View key={index}>
              <View style={minimalStyles.profileInfoItem}>
                <View style={minimalStyles.profileInfoLeft}>
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    color="#6C757D" 
                    style={minimalStyles.profileInfoIcon}
                  />
                  <Text style={[minimalStyles.profileInfoLabel, { color: '#212529' }]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={[
                  minimalStyles.profileInfoValue,
                  { color: item.value === 'Not set' ? '#6C757D' : '#212529' }
                ]}>
                  {item.value}
                </Text>
              </View>
              {index < profileData.length - 1 && (
                <View style={[minimalStyles.profileInfoDivider, { backgroundColor: '#E9ECEF' }]} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

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
        <Text style={[minimalStyles.sectionTitle, lightStyles.sectionTitle]}>{section.section}</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={[minimalStyles.card, lightStyles.card]}>
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
                    lightStyles.menuItemTitle,
                    item.premium && isPremium && { color: AppColors.warning }
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[minimalStyles.menuItemSubtitle, lightStyles.menuItemSubtitle]}>{item.subtitle}</Text>
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

  // Static styles using light theme colors
  const lightStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    headerSection: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    content: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6C757D',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#212529',
      marginBottom: 2,
    },
    menuItemSubtitle: {
      fontSize: 14,
      color: '#6C757D',
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#212529',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: '#6C757D',
    },
  });

  return (
    <View style={settingsStyles.container}>
      {/* Header */}
      <View style={settingsStyles.header}>
        <View style={settingsStyles.profileSection}>
          <TouchableOpacity 
            style={settingsStyles.avatarContainer}
            activeOpacity={0.8}
            onPress={() => setShowEditProfileModal(true)}
          >
            {currentUser?.user_metadata?.profile_image ? (
              <Image 
                source={{ uri: currentUser.user_metadata.profile_image }}
                style={settingsStyles.avatar}
              />
            ) : (
              <View style={settingsStyles.avatarPlaceholder}>
                <Text style={settingsStyles.avatarText}>
                  {currentUser?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={settingsStyles.profileInfo}>
            <Text style={settingsStyles.profileName}>
              {currentUser?.user_metadata?.first_name || 'User'} {currentUser?.user_metadata?.last_name || ''}
            </Text>
            <Text style={settingsStyles.profileEmail}>{currentUser?.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={settingsStyles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Profile Information</Text>
          <View style={settingsStyles.settingsGroup}>
            <TouchableOpacity style={settingsStyles.settingRow} onPress={openWeightModal}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="scale-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>Weight</Text>
              </View>
              <View style={settingsStyles.settingRight}>
                <Text style={settingsStyles.settingValue}>
                  {currentUser?.user_metadata?.weight ? `${currentUser.user_metadata.weight} lbs` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[settingsStyles.settingRow, settingsStyles.settingRowBorder]} onPress={openHeightModal}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="resize-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>Height</Text>
              </View>
              <View style={settingsStyles.settingRight}>
                <Text style={settingsStyles.settingValue}>
                  {currentUser?.user_metadata?.height ? `${Math.floor(currentUser.user_metadata.height / 12)}'${currentUser.user_metadata.height % 12}"` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
              </View>
            </TouchableOpacity>
            
            <View style={[settingsStyles.settingRow, settingsStyles.settingRowBorder]}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="fitness-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>BMI</Text>
              </View>
              <View style={settingsStyles.bmiContainer}>
                {(() => {
                  const bmi = calculateBMI();
                  const category = getBMICategory(bmi);
                  return (
                    <>
                      <Text style={settingsStyles.settingValue}>
                        {bmi ? `${bmi}` : 'Not available'}
                      </Text>
                      {category && (
                        <Text style={[
                          settingsStyles.bmiCategory,
                          {
                            color: category === 'Normal' ? '#34C759' : 
                                   category === 'Underweight' ? '#007AFF' :
                                   category === 'Overweight' ? '#FF9500' : '#FF3B30'
                          }
                        ]}>
                          {category}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Subscription</Text>
          <View style={settingsStyles.settingsGroup}>
            <TouchableOpacity 
              style={settingsStyles.settingRow}
              onPress={() => setShowUpgradeModal(true)}
            >
              <View style={settingsStyles.settingLeft}>
                <Ionicons 
                  name={isPremium ? 'diamond' : 'diamond-outline'} 
                  size={20} 
                  color={isPremium ? '#6B8E23' : '#6C757D'} 
                  style={settingsStyles.settingIcon} 
                />
                <Text style={settingsStyles.settingLabel}>
                  {isPremium ? 'Core+ Premium' : 'Upgrade to Premium'}
                </Text>
              </View>
              <View style={settingsStyles.settingRight}>
                {isPremium && (
                  <View style={settingsStyles.activeBadge}>
                    <Text style={settingsStyles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Support</Text>
          <View style={settingsStyles.settingsGroup}>
            <TouchableOpacity style={settingsStyles.settingRow}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="help-circle-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[settingsStyles.settingRow, settingsStyles.settingRowBorder]}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="document-text-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
            </TouchableOpacity>
            
            <TouchableOpacity style={settingsStyles.settingRow}>
              <View style={settingsStyles.settingLeft}>
                <Ionicons name="shield-outline" size={20} color="#6C757D" style={settingsStyles.settingIcon} />
                <Text style={settingsStyles.settingLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#C1C1C6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={settingsStyles.section}>
          <TouchableOpacity style={settingsStyles.signOutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={settingsStyles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={currentUser}
        onProfileUpdate={refreshUserData}
      />

      {/* Weight Modal */}
      <Modal visible={showWeightModal} transparent={true} animationType="slide">
        <View style={settingsStyles.modalOverlay}>
          <View style={settingsStyles.modalContainer}>
            <View style={settingsStyles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <Text style={settingsStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={settingsStyles.modalTitle}>Weight</Text>
              <TouchableOpacity onPress={handleWeightUpdate}>
                <Text style={settingsStyles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={settingsStyles.modalContent}>
              <Text style={settingsStyles.modalLabel}>Enter your weight in pounds:</Text>
              <TextInput
                style={settingsStyles.modalInput}
                value={tempWeight}
                onChangeText={setTempWeight}
                placeholder="e.g., 165"
                keyboardType="numeric"
                autoFocus={true}
                selectTextOnFocus={true}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Height Modal */}
      <Modal visible={showHeightModal} transparent={true} animationType="slide">
        <View style={settingsStyles.modalOverlay}>
          <View style={settingsStyles.modalContainer}>
            <View style={settingsStyles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHeightModal(false)}>
                <Text style={settingsStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={settingsStyles.modalTitle}>Height</Text>
              <TouchableOpacity onPress={handleHeightUpdate}>
                <Text style={settingsStyles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={settingsStyles.modalContent}>
              <Text style={settingsStyles.modalLabel}>Enter your height:</Text>
              <View style={settingsStyles.heightInputContainer}>
                <View style={settingsStyles.heightInputGroup}>
                  <TextInput
                    style={settingsStyles.heightInput}
                    value={tempFeet}
                    onChangeText={setTempFeet}
                    placeholder="5"
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus={true}
                  />
                  <Text style={settingsStyles.heightLabel}>ft</Text>
                </View>
                <View style={settingsStyles.heightInputGroup}>
                  <TextInput
                    style={settingsStyles.heightInput}
                    value={tempInches}
                    onChangeText={setTempInches}
                    placeholder="10"
                    keyboardType="numeric"
                    maxLength={2}
                    selectTextOnFocus={true}
                  />
                  <Text style={settingsStyles.heightLabel}>in</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  profileInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profileInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileInfoIcon: {
    marginRight: 12,
  },
  profileInfoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'right',
  },
  profileInfoDivider: {
    height: 0.5,
    marginHorizontal: 16,
  },
});

// Clean Settings Layout Styles
const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS system background
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  profileSection: {
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
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B8E23',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 20,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  settingRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
    width: 20,
  },
  settingLabel: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
  },
  settingValue: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B8E23',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FF3B30',
    marginLeft: 8,
  },
  bmiContainer: {
    alignItems: 'flex-end',
  },
  bmiCategory: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  modalCancelText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  modalSaveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B8E23',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#F8F9FA',
  },
  heightInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heightInputGroup: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  heightInput: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    width: '100%',
  },
  heightLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default WorkingMinimalAccount;
