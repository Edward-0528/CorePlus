import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { biometricService } from '../biometricService';
import { SafeAreaView } from 'react-native-safe-area-context';
import SharedVideoBackground from './common/SharedVideoBackground';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginScreen = memo(({ 
  loading, 
  onLogin,
  onBackToLanding,
  onSwitchToSignUp,
  onBiometricLogin,
  styles 
}) => {
  const { formData, updateFormData } = useAppContext();
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    isEnabled: false,
    biometricType: 'Biometric'
  });
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check biometric availability when component mounts
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const info = await biometricService.getBiometricInfo();
      setBiometricInfo(info);
      // No automatic popup - let user choose when to use biometrics
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (onBiometricLogin) {
        await onBiometricLogin();
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric login failed. Please try again.');
    }
  };

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
            {/* Login Form */}
            <View style={styles.loginFormContainer}>
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

                {/* Login Buttons Row */}
                <View style={styles.loginButtonsRow}>
                  {/* Sign In Button */}
                  <TouchableOpacity 
                    style={[styles.loginPrimaryButton, loading && styles.buttonDisabled]}
                    onPress={onLogin}
                    disabled={loading}
                  >
                    <Text style={styles.loginPrimaryButtonText}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  {/* Biometric Button - Right Side */}
                  {biometricInfo.isAvailable && biometricInfo.isEnabled && (
                    <TouchableOpacity 
                      style={[styles.biometricIconButton, loading && styles.buttonDisabled]}
                      onPress={handleBiometricLogin}
                      disabled={loading}
                    >
                      
                      <Ionicons 
                        name="finger-print" 
                        size={20} 
                        color="#ffffff" 
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sign Up Link */}
                <TouchableOpacity onPress={onSwitchToSignUp} style={styles.switchAuthContainer}>
                  <Text style={styles.switchAuthText}>
                    Don't have an account? <Text style={styles.switchAuthLink}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        
      </SharedVideoBackground>
      <StatusBar style="light" />
    </SafeAreaView>
  );
});

LoginScreen.displayName = 'LoginScreen';

export default LoginScreen;
