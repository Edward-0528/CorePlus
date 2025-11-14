import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import SharedVideoBackground from './common/SharedVideoBackground';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function SignUpScreenComponent({ 
  loading, 
  genderOptions,
  onSignUp,
  onBackToLanding,
  onSwitchToLogin,
  onGenderSelect,
  styles 
}) {
  const { formData, updateFormData } = useAppContext();
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleNameChange = useCallback((text) => {
    updateFormData({ firstName: text });
  }, [updateFormData]);

  const handlePhoneChange = useCallback((text) => {
    // Format phone number as user types
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    
    updateFormData({ phone: formatted });
  }, [updateFormData]);

  const handlePasswordChange = useCallback((text) => {
    updateFormData({ password: text });
  }, [updateFormData]);

  return (
    <SafeAreaView style={styles.landingContainer}>
      <SharedVideoBackground>
        <View style={styles.overlay}>
          {/* Back Button - Top Left */}
          <TouchableOpacity 
            style={styles.topLeftBackButton}
            onPress={onBackToLanding}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Centered Content Container */}
          <View style={styles.centeredFormContainer}>
            {/* SignUp Form */}
            <View style={styles.loginFormContainer}>
                {/* Name Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      nameFocused && styles.loginInputFocused
                    ]}
                    value={formData.firstName}
                    onChangeText={handleNameChange}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoCapitalize="words"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>

                {/* Phone Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      phoneFocused && styles.loginInputFocused
                    ]}
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    placeholder="Phone Number"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="phone-pad"
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    maxLength={14} // Format: (123) 456-7890
                  />
                </View>

                {/* Password Input */}
                <View style={styles.loginInputContainer}>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[
                        styles.loginInput,
                        passwordFocused && styles.loginInputFocused
                      ]}
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      placeholder="Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="rgba(255, 255, 255, 0.6)" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign Up Button */}
                <View style={styles.loginButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.loginPrimaryButton, loading && styles.buttonDisabled]}
                    onPress={onSignUp}
                    disabled={loading}
                  >
                    <Text style={styles.loginPrimaryButtonText}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Login Link */}
                <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchAuthContainer}>
                  <Text style={styles.switchAuthText}>
                    Already have an account? <Text style={styles.switchAuthLink}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        
      </SharedVideoBackground>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

SignUpScreenComponent.displayName = 'SignUpScreenComponent';

export default memo(SignUpScreenComponent);
