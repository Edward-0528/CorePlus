import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const SocialLoginButtons = ({ onSocialLogin, loading, styles }) => {
  return (
    <View style={styles.socialContainer}>
      <Text style={styles.orText}>or continue with</Text>
      
      <View style={styles.socialButtonsRow}>
        {/* Google */}
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => onSocialLogin('google')}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity 
          style={[styles.socialButton, styles.appleButton]}
          onPress={() => onSocialLogin('apple')}
          disabled={loading}
        >
          <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SocialLoginButtons;
