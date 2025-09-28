import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../../utils/responsive';

const MinimalisticDeleteModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title = "Delete Item", 
  message,
  confirmText = "Delete",
  mealName = null,
  isMultiple = false 
}) => {
  const scaleAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="trash-outline" 
              size={32} 
              color="#FF3B30" 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {mealName && (
            <View style={styles.mealNameContainer}>
              <Text style={styles.mealName}>"{mealName}"</Text>
            </View>
          )}
          
          <Text style={styles.message}>
            {message || `This action cannot be undone.`}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  mealNameContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  mealName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#2C2C2E',
    textAlign: 'center',
  },
  message: {
    fontSize: fonts.medium,
    color: '#6D6D80',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#6D6D80',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MinimalisticDeleteModal;
