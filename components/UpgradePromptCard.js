import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import UpgradeModal from './UpgradeModal';

const UpgradePromptCard = ({ 
  featureName, 
  featureDescription, 
  usageInfo,
  style = {} 
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isPremiumUser } = useFeatureAccess();

  if (isPremiumUser) return null; // Don't show to premium users

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={24} color="#667eea" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Unlock Premium Features</Text>
            <Text style={styles.subtitle}>Get unlimited access to all Core+ features</Text>
          </View>
        </View>

        {/* Usage Info (if provided) */}
        {usageInfo && (
          <View style={styles.usageSection}>
            <Text style={styles.usageTitle}>Daily Usage</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min((usageInfo.used / usageInfo.limit) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.usageText}>
                {usageInfo.used}/{usageInfo.limit} {featureName || 'features'} used today
              </Text>
            </View>
          </View>
        )}

        {/* Quick Benefits */}
        <View style={styles.benefitsSection}>
          <BenefitRow icon="infinite" text="Unlimited AI scans" />
          <BenefitRow icon="calendar" text="Meal planning" />
          <BenefitRow icon="analytics" text="Advanced insights" />
          <BenefitRow icon="library" text="Recipe browser" />
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => setShowUpgradeModal(true)}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Core+ Pro</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Later Button */}
        <TouchableOpacity style={styles.laterButton}>
          <Text style={styles.laterButtonText}>Maybe later</Text>
        </TouchableOpacity>
      </View>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        triggerFeature={featureName}
      />
    </View>
  );
};

const BenefitRow = ({ icon, text }) => (
  <View style={styles.benefitRow}>
    <Ionicons name={icon} size={16} color="#4CAF50" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  usageSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  usageText: {
    fontSize: 12,
    color: '#666',
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  laterButtonText: {
    fontSize: 14,
    color: '#999',
  },
});

export default UpgradePromptCard;
