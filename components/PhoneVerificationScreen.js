import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';
import SharedVideoBackground from './common/SharedVideoBackground';

const PhoneVerificationScreen = ({ 
  phoneNumber, 
  onVerificationComplete, 
  onResendCode,
  onGoBack,
  loading 
}) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = timeLeft > 0 && setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    if (timeLeft === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCodeChange = (text, index) => {
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && !loading) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code = verificationCode.join('')) => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }
    
    try {
      await onVerificationComplete(code);
    } catch (error) {
      Alert.alert('Verification Failed', error.message);
      // Clear code on error
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await onResendCode();
      setTimeLeft(60);
      setCanResend(false);
      Alert.alert('Success', 'Verification code sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.landingContainer}>
      <SharedVideoBackground>
        <View style={styles.overlay}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.topLeftBackButton}
            onPress={onGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.centeredContentContainer}>
            <View style={styles.authFormContainer}>
              <Text style={styles.authTitle}>Verify Phone Number</Text>
              
              <Text style={styles.verificationSubtitle}>
                We sent a 6-digit code to
              </Text>
              <Text style={styles.phoneNumberDisplay}>
                {formatPhoneNumber(phoneNumber)}
              </Text>

              {/* Code Input */}
              <View style={styles.codeInputContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => inputRefs.current[index] = ref}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={() => handleVerify()}
                disabled={loading || verificationCode.some(digit => digit === '')}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>

              {/* Resend Code */}
              <View style={styles.resendContainer}>
                {!canResend ? (
                  <Text style={styles.resendTimer}>
                    Resend code in {timeLeft}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendButton}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </SharedVideoBackground>
    </SafeAreaView>
  );
};

export default PhoneVerificationScreen;
