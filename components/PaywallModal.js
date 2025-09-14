import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const PaywallModal = ({ 
  visible, 
  onClose, 
  onUpgrade, 
  featureName, 
  featureDescription,
  usageInfo 
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={48} color="white" />
          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.subtitle}>Upgrade to Core+ Pro to continue</Text>
        </View>

        {/* Feature Information */}
        <View style={styles.featureInfo}>
          <Text style={styles.featureName}>{featureName}</Text>
          <Text style={styles.featureDescription}>{featureDescription}</Text>
          
          {usageInfo && (
            <View style={styles.usageContainer}>
              <Text style={styles.usageText}>
                You've used {usageInfo.used}/{usageInfo.limit} {featureName.toLowerCase()} today
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(usageInfo.used / usageInfo.limit) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Core+ Pro includes:</Text>
          <View style={styles.benefitsList}>
            <BenefitItem icon="infinite" text="Unlimited AI food scans" />
            <BenefitItem icon="calendar" text="Advanced meal planning" />
            <BenefitItem icon="analytics" text="Detailed nutrition insights" />
            <BenefitItem icon="library" text="Recipe browser access" />
            <BenefitItem icon="cloud-download" text="Export your data" />
            <BenefitItem icon="construct" text="Custom macro goals" />
            <BenefitItem icon="headset" text="Priority support" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={onUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Core+ Pro</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.laterButton} 
            onPress={onClose}
          >
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const BenefitItem = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <Ionicons name={icon} size={20} color="#4CAF50" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  featureInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  usageContainer: {
    marginTop: 15,
  },
  usageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  benefitsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  laterButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    color: 'white',
  },
});

export default PaywallModal;
