import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SmoothVideoBackground from './common/SmoothVideoBackground';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LandingScreen = ({ onGetStarted, styles }) => {
  const [termsAccepted, setTermsAccepted] = useState(true);

  return (
    <SafeAreaView style={styles.landingContainer}>
      <SmoothVideoBackground screenType="landing">
        <View style={styles.overlay}>
          <View style={styles.landingContent}>
            {/* Top Section - Hero Title */}
            <View style={styles.topSection}>
              <Text style={styles.newHeroTitle}>
                Core<Text style={{fontWeight: 'bold'}}>+</Text>
              </Text>
              <Text style={styles.newHeroSubtitle}>
                AI-powered fitness & nutrition tracking
              </Text>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Get Started Button */}
              <TouchableOpacity 
                style={[styles.newGetStartedButton, !termsAccepted && styles.buttonDisabled]} 
                onPress={termsAccepted ? onGetStarted : null}
                disabled={!termsAccepted}
              >
                <Text style={styles.newGetStartedText}>Get Started</Text>
              </TouchableOpacity>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>I agree to Terms & Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SmoothVideoBackground>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default memo(LandingScreen);
