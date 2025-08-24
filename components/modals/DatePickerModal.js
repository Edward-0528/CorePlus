import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

const DatePickerModal = ({ visible, onClose, onDateSelect, styles }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Birthday</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerScrollView}>
            {/* Generate years from 1950 to current year - 13 (minimum age) */}
            {Array.from({length: new Date().getFullYear() - 13 - 1950 + 1}, (_, i) => new Date().getFullYear() - 13 - i).map((year) => (
              <View key={year} style={styles.yearSection}>
                <Text style={styles.yearHeader}>{year}</Text>
                {Array.from({length: 12}, (_, month) => (
                  <View key={month} style={styles.monthSection}>
                    <Text style={styles.monthHeader}>{new Date(year, month).toLocaleDateString('en-US', { month: 'long' })}</Text>
                    <View style={styles.daysGrid}>
                      {Array.from({length: new Date(year, month + 1, 0).getDate()}, (_, day) => (
                        <TouchableOpacity
                          key={day + 1}
                          style={styles.dayButton}
                          onPress={() => onDateSelect(year, month + 1, day + 1)}
                        >
                          <Text style={styles.dayText}>{day + 1}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;
