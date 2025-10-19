import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quickLoginService } from '../../../services/quickLoginService';
import AppColors from '../../../constants/AppColors';

const QuickLoginScreen = ({ onLoginSuccess, onFullLogin, savedEmail = '' }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [loginOptions, setLoginOptions] = useState({
    hasQuickLogin: false,
    hasBiometric: false,
    savedEmail: '',
    canStayLoggedIn: false
  });

  // Load available login options on mount
  useEffect(() => {
    loadLoginOptions();
  }, []);

  const loadLoginOptions = async () => {
    try {
      const options = await quickLoginService.getAvailableLoginOptions();
      setLoginOptions(options);
    } catch (error) {
      console.error('Error loading login options:', error);
    }
  };

  const handleQuickLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await quickLoginService.quickLogin(password.trim());
      
      if (result.success) {
        console.log('✅ Quick login successful');
        onLoginSuccess(result.user);
      } else {
        Alert.alert('Login Failed', result.error || 'Please check your password and try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Quick login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const result = await quickLoginService.attemptBiometricLogin();
      
      if (result.success) {
        console.log('✅ Biometric login successful');
        onLoginSuccess(result.user);
      } else {
        Alert.alert('Biometric Login Failed', result.error || 'Please try password login instead');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
      console.error('Biometric login error:', error);
    } finally {
      setBiometricLoading(false);
    }
  };

  const email = loginOptions.savedEmail || savedEmail;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/ios-icon.png')} style={styles.logo} />
          </View>
          <Text style={styles.welcomeBack}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Quick login to continue</Text>
        </View>

        {/* Email Display */}
        <View style={styles.emailContainer}>
          <View style={styles.emailDisplay}>
            <Ionicons name="person-circle-outline" size={24} color={AppColors.primary} />
            <Text style={styles.emailText}>{email}</Text>
          </View>
          <TouchableOpacity onPress={onFullLogin} style={styles.changeAccountButton}>
            <Text style={styles.changeAccountText}>Different account?</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Login Options */}
        <View style={styles.loginSection}>
          
          {/* Biometric Login */}
          {loginOptions.hasBiometric && (
            <TouchableOpacity
              style={[styles.biometricButton, biometricLoading && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="white" />
                  <Text style={styles.biometricButtonText}>Use Biometric Login</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Password Login */}
          <View style={styles.passwordSection}>
            <Text style={styles.passwordLabel}>
              {loginOptions.hasBiometric ? 'Or enter your password:' : 'Enter your password:'}
            </Text>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={AppColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={handleQuickLogin}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleQuickLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Options */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onFullLogin} style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Need help signing in?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  welcomeBack: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  emailContainer: {
    marginBottom: 32,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
  changeAccountButton: {
    alignSelf: 'flex-end',
  },
  changeAccountText: {
    fontSize: 14,
    color: AppColors.primary,
    textDecorationLine: 'underline',
  },
  loginSection: {
    marginBottom: 32,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  biometricButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  passwordSection: {
    gap: 16,
  },
  passwordLabel: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  passwordInputContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  loginButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerButton: {
    paddingVertical: 12,
  },
  footerButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    textDecorationLine: 'underline',
  },
});

export default QuickLoginScreen;
