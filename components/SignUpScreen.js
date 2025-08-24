import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function SignUpScreenComponent({ 
  loading, 
  genderOptions,
  onSignUp,
  onBackToLanding,
  onSwitchToLogin,
  onSocialLogin,
  onGenderSelect,
  styles 
}) {
  const { formData, updateFormData } = useAppContext();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync();
    }
  }, []);

  const handleVideoLoad = () => {
    console.log('✨ SignUp screen video background loaded');
    setVideoLoaded(true);
  };

  const handleNameChange = useCallback((text) => {
    updateFormData({ firstName: text });
  }, [updateFormData]);

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
        onLoadStart={() => console.log('SignUp video loading...')}
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

                {/* Email Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      emailFocused && styles.loginInputFocused
                    ]}
                    value={formData.email}
                    onChangeText={handleEmailChange}
                    placeholder="Email Address"
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

                {/* Login Link */}
                <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchAuthContainer}>
                  <Text style={styles.switchAuthText}>
                    Already have an account? <Text style={styles.switchAuthLink}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

SignUpScreenComponent.displayName = 'SignUpScreenComponent';

export default memo(SignUpScreenComponent);
