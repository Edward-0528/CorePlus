import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseConfig';
import { AppColors } from '../../constants/AppColors';
import profilePictureService from '../../services/profilePictureService';

const EditProfileModal = ({ visible, onClose, user, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profileImage: null
  });

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user?.user_metadata?.first_name || '',
        lastName: user?.user_metadata?.last_name || '',
        profileImage: user?.user_metadata?.profile_image || null
      });
      
      // Test bucket access when modal opens
      if (visible) {
        profilePictureService.testBucketAccess().then(accessible => {
          if (!accessible) {
            console.warn('⚠️ Profile pictures bucket may not be properly configured');
          }
        });
      }
    }
  }, [user, visible]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri) => {
    // Get the current profile image URL to delete the old one
    const currentImageUrl = user?.user_metadata?.profile_image || null;
    console.log('🔄 Uploading new image, current image to delete:', currentImageUrl);
    
    return await profilePictureService.uploadProfilePicture(uri, user.id, currentImageUrl);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      console.log('💾 Starting profile save process...');
      console.log('📊 Form data:', {
        firstName: formData.firstName,
        profileImage: formData.profileImage ? formData.profileImage.substring(0, 50) + '...' : 'none'
      });

      // Validate required fields
      if (!formData.firstName.trim()) {
        Alert.alert('Error', 'First name is required');
        return;
      }

      let profileImageUrl = formData.profileImage;
      
      // Upload new image if selected
      if (formData.profileImage && formData.profileImage.startsWith('file://')) {
        console.log('📤 Uploading new profile image...');
        profileImageUrl = await uploadImage(formData.profileImage);
        console.log('📤 Upload result:', profileImageUrl ? 'SUCCESS' : 'FAILED');
        
        if (!profileImageUrl) {
          Alert.alert('Warning', 'Failed to upload profile image, but other changes will be saved.');
          profileImageUrl = null;
        }
      } else {
        console.log('ℹ️ No new image to upload (using existing or none)');
      }

      // Prepare the updated user metadata
      const updatedMetadata = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        profile_image: profileImageUrl
      };

      console.log('📝 Updating user metadata:', {
        ...updatedMetadata,
        profile_image: profileImageUrl ? 'URL_SET' : 'NULL'
      });

      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: updatedMetadata
      });

      if (error) {
        console.error('❌ Supabase auth update failed:', error);
        throw error;
      }

      console.log('✅ Supabase auth metadata updated successfully');

      // Also update or create user profile in user_profiles table if it exists
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            updated_at: new Date().toISOString(),
            // You can add additional profile fields here if needed
          });

        if (profileError) {
          console.warn('Profile table update failed:', profileError);
          // Don't throw error here since the main update succeeded
        } else {
          console.log('✅ User profile table updated');
        }
      } catch (profileErr) {
        console.warn('Profile table update error:', profileErr);
      }

      console.log('🎉 Profile update completed successfully');
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Call the callback to refresh user data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: '#212529' }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: '#FFFFFF',
            borderColor: '#E9ECEF',
            color: '#212529'
          },
          multiline && styles.multilineInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6C757D"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const renderPicker = (label, value, onValueChange, options) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);
    
    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: '#212529' }]}>{label}</Text>
        <TouchableOpacity 
          style={[
            styles.input,
            {
              backgroundColor: '#FFFFFF',
              borderColor: '#E9ECEF',
              color: '#212529',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          ]}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={[
            { color: selectedOption ? '#212529' : '#6C757D' },
            styles.dropdownText
          ]}>
            {selectedOption ? selectedOption.label : 'Select...'}
          </Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6C757D" 
          />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={[
            styles.dropdownOptions, 
            { 
              backgroundColor: '#FFFFFF', 
              borderColor: '#E9ECEF',
              shadowColor: '#212529' 
            }
          ]}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.dropdownOption}
                onPress={() => {
                  onValueChange('');
                  setIsOpen(false);
                }}
              >
                <Text style={[styles.dropdownOptionText, { color: '#6C757D' }]}>
                  Select...
                </Text>
              </TouchableOpacity>
              {options.map((option) => (
                <TouchableOpacity 
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    value === option.value && styles.selectedDropdownOption
                  ]}
                  onPress={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText, 
                    { color: '#212529' },
                    value === option.value && styles.selectedDropdownOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: '#E9ECEF' }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: '#007AFF' }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#212529' }]}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={loading}
          >
            <Text style={[
              styles.headerButtonText, 
              { color: loading ? '#6C757D' : '#6B8E23' }
            ]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#212529' }]}>Profile Picture</Text>
            
            <View style={styles.imageContainer}>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {formData.profileImage ? (
                  <Image source={{ uri: formData.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: '#FFFFFF', borderColor: '#E9ECEF' }]}>
                    <Ionicons name="camera" size={40} color="#6C757D" />
                    <Text style={[styles.placeholderText, { color: '#6C757D' }]}>
                      Tap to add photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {formData.profileImage && (
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setFormData(prev => ({ ...prev, profileImage: null }))}
                >
                  <Ionicons name="close-circle" size={24} color="#DC3545" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#212529' }]}>Basic Information</Text>
            
            {renderInput(
              'First Name *',
              formData.firstName,
              (text) => setFormData(prev => ({ ...prev, firstName: text })),
              'Enter your first name'
            )}

            {renderInput(
              'Last Name',
              formData.lastName,
              (text) => setFormData(prev => ({ ...prev, lastName: text })),
              'Enter your last name'
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  selectedDropdownOption: {
    backgroundColor: '#F0F8FF',
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  selectedDropdownOptionText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomPadding: {
    height: 40,
  },
  imageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  imagePickerButton: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default EditProfileModal;
