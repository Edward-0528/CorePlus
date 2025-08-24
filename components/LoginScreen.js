import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { biometricService } from '../biometricService';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginScreen = memo(({ 
  loading, 
  onLogin,
  onBackToLanding,
  onSwitchToSignUp,
  onSocialLogin,
  onBiometricLogin,
  styles 
}) => {
  const { formData, updateFormData } = useAppContext();
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    isEnabled: false,
    biometricType: 'Biometric'
  });
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const videoRef = useRef(null);

  // Check biometric availability when component mounts
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync();
    }
  }, []);

  const handleVideoLoad = () => {
    console.log('✨ Login screen video background loaded');
    setVideoLoaded(true);
  };

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

  const handleEmailChange = useCallback((text) => {
    updateFormData({ email: text });
  }, [updateFormData]);

  const handlePasswordChange = useCallback((text) => {
    updateFormData({ password: text });
  }, [updateFormData]);

  return (
    <SafeAreaView style={styles.landingContainer}>
      {/* Premium Video Background */}
      <Video
        ref={videoRef}
        source={require('../assets/workout.mp4')}
        style={styles.videoBackground}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        rate={1.0}
        volume={0}
        onLoadStart={() => console.log('Login video loading...')}
        onLoad={handleVideoLoad}
        onError={(error) => console.log('Video error:', error)}
        usePoster={false}
        posterSource={require('../assets/Athleticman.png')}
        posterStyle={styles.videoBackground}
      />
      
      {/* Elegant Dark Overlay */}
      <View style={[styles.videoOverlay, { opacity: videoLoaded ? 1 : 0.8 }]}>
        {/* Premium Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.8)',
            'rgba(0,0,0,0.95)'
          ]}
          style={styles.gradientOverlay}
          locations={[0, 0.3, 0.7, 1]}
        />
        
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
                {/* Email Input */}
                <View style={styles.loginInputContainer}>
                  
                  <TextInput
                    style={[
                      styles.loginInput,
                      emailFocused && styles.loginInputFocused
                    ]}
                    value={formData.email}
                    onChangeText={handleEmailChange}
                    placeholder="E-Mail"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
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

                {/* Social Login */}
                <View style={styles.socialLoginContainer}>
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('apple')}
                    >
                      <Ionicons name="logo-apple" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('google')}
                    >
                      <Ionicons name="logo-google" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                  </View>
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
        </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
});

LoginScreen.displayName = 'LoginScreen';

export default LoginScreen;
