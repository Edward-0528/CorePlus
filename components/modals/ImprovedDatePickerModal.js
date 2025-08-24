import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

const ImprovedDatePickerModal = memo(({ visible, onClose, onDateSelect, styles }) => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const minAge = 13;
  const maxYear = currentYear - minAge;
  const minYear = 1920;
  
  const years = Array.from({length: maxYear - minYear + 1}, (_, i) => maxYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  
  const handleDateSelect = (year, month, day) => {
    onDateSelect(year, month, day);
    onClose();
    setSelectedYear(null);
    setSelectedMonth(null);
  };
  
  const renderYearSelector = () => (
    <ScrollView 
      style={{ maxHeight: 300 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 20
      }}>
        Select Year
      </Text>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10
      }}>
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={{
              backgroundColor: '#F8F9FA',
              borderColor: '#E9ECEF',
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              margin: 3,
              width: '23%',
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center'
            }}
            onPress={() => setSelectedYear(year)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: '#1A1A1A',
              textAlign: 'center',
              numberOfLines: 1
            }}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderMonthSelector = () => (
    <View>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 20
      }}>
        Select Month ({selectedYear})
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#F8F9FA',
          borderColor: '#E9ECEF',
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          alignItems: 'center'
        }}
        onPress={() => setSelectedYear(null)}
        activeOpacity={0.7}
      >
        <Text style={{
          fontSize: 14,
          color: '#6C757D'
        }}>
          ← Back to Years
        </Text>
      </TouchableOpacity>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {months.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={{
              backgroundColor: '#F8F9FA',
              borderColor: '#E9ECEF',
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              margin: 3,
              width: '30%',
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center'
            }}
            onPress={() => setSelectedMonth(index + 1)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '500',
              color: '#1A1A1A',
              textAlign: 'center',
              numberOfLines: 1
            }}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  const renderDaySelector = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    return (
      <View>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1A1A1A',
          textAlign: 'center',
          marginBottom: 20
        }}>
          Select Day ({months[selectedMonth - 1]} {selectedYear})
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#F8F9FA',
            borderColor: '#E9ECEF',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            alignItems: 'center'
          }}
          onPress={() => setSelectedMonth(null)}
          activeOpacity={0.7}
        >
          <Text style={{
            fontSize: 14,
            color: '#6C757D'
          }}>
            ← Back to Months
          </Text>
        </TouchableOpacity>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={{
                backgroundColor: '#007AFF',
                borderRadius: 8,
                padding: 8,
                margin: 3,
                width: '13%',
                alignItems: 'center',
                minHeight: 40,
                justifyContent: 'center'
              }}
              onPress={() => handleDateSelect(selectedYear, selectedMonth, day)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center',
                numberOfLines: 1
              }}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1A1A1A'
            }}>
              Birthday
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              style={{
                backgroundColor: '#F8F9FA',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 20,
                color: '#6C757D'
              }}>
                ×
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
          >
            {!selectedYear && renderYearSelector()}
            {selectedYear && !selectedMonth && renderMonthSelector()}
            {selectedYear && selectedMonth && renderDaySelector()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

ImprovedDatePickerModal.displayName = 'ImprovedDatePickerModal';

export default ImprovedDatePickerModal;
