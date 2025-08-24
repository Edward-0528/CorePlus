import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

const BirthdaySelector = ({ value, onDateSelect, styles }) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Parse existing value when component mounts or value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedMonth(getMonthName(date.getMonth()));
        setSelectedDay(date.getDate().toString());
        setSelectedYear(date.getFullYear().toString());
      }
    }
  }, [value]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getMonthName = (monthIndex) => {
    return months[monthIndex];
  };

  const getMonthIndex = (monthName) => {
    return months.indexOf(monthName);
  };

  // Generate days (1-31)
  const getDaysForMonth = (month, year) => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);
    
    const monthIndex = getMonthIndex(month);
    const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Generate years (current year - 100 to current year - 13)
  const getCurrentYear = () => new Date().getFullYear();
  const years = Array.from({ length: 88 }, (_, i) => getCurrentYear() - 13 - i).filter(year => year > 0);

  const handleDateChange = (type, value) => {
    // Add safety check for undefined/null values
    if (value === undefined || value === null) {
      console.error('handleDateChange received undefined/null value for type:', type);
      return;
    }

    let newMonth = selectedMonth;
    let newDay = selectedDay;
    let newYear = selectedYear;

    if (type === 'month') {
      newMonth = value;
      setSelectedMonth(value);
      setShowMonthPicker(false);
    } else if (type === 'day') {
      newDay = value.toString();
      setSelectedDay(value.toString());
      setShowDayPicker(false);
    } else if (type === 'year') {
      newYear = value.toString();
      setSelectedYear(value.toString());
      setShowYearPicker(false);
    }

    // If all three values are selected, create the date string
    if (newMonth && newDay && newYear && 
        newMonth !== '' && newDay !== '' && newYear !== '') {
      try {
        console.log('Creating date with values:', { newMonth, newDay, newYear });
        
        const monthIndex = getMonthIndex(newMonth);
        if (monthIndex === -1) {
          console.error('Invalid month:', newMonth);
          return;
        }
        
        console.log('Month index:', monthIndex);
        
        // Add extra validation for undefined/null values
        if (!newDay || !newYear) {
          console.error('Day or year is undefined/null:', { newDay, newYear });
          return;
        }
        
        const dayNum = parseInt(newDay);
        const yearNum = parseInt(newYear);
        
        console.log('Parsed numbers:', { dayNum, yearNum });
        
        if (isNaN(dayNum) || isNaN(yearNum)) {
          console.error('Invalid day or year:', newDay, newYear);
          return;
        }
        
        // Create date object (month is 0-indexed in Date constructor)
        console.log('Creating Date object with:', yearNum, monthIndex, dayNum);
        const dateObj = new Date(yearNum, monthIndex, dayNum);
        console.log('Created dateObj:', dateObj);
        
        // Validate the date was created correctly
        if (dateObj.getFullYear() !== yearNum || 
            dateObj.getMonth() !== monthIndex || 
            dateObj.getDate() !== dayNum) {
          console.error('Invalid date created:', dateObj);
          return;
        }
        
        console.log('About to call toISOString()');
        const dateString = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log('Created dateString:', dateString);
        
        // Safely call the callback with separate year, month, day values
        if (typeof onDateSelect === 'function') {
          console.log('Calling onDateSelect with year, month, day:', yearNum, monthIndex + 1, dayNum);
          onDateSelect(yearNum, monthIndex + 1, dayNum);
        } else {
          console.error('onDateSelect is not a function:', onDateSelect);
        }
      } catch (error) {
        console.error('Error creating date:', error);
      }
    }
  };

  const renderPicker = (items, selectedValue, onSelect, type) => (
    <Modal
      visible={type === 'month' ? showMonthPicker : type === 'day' ? showDayPicker : showYearPicker}
      transparent={true}
      animationType="fade"
    >
      <TouchableOpacity 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => {
          if (type === 'month') setShowMonthPicker(false);
          else if (type === 'day') setShowDayPicker(false);
          else setShowYearPicker(false);
        }}
        activeOpacity={1}
      >
        <View style={{
          backgroundColor: '#1a1a2e',
          borderRadius: 16,
          width: '80%',
          maxHeight: '60%',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <View style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              Select {type === 'month' ? 'Month' : type === 'day' ? 'Day' : 'Year'}
            </Text>
          </View>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {items.map((item) => {
              // Safety check for undefined/null items
              if (item === undefined || item === null) {
                console.error('renderPicker found undefined/null item in items array for type:', type);
                return null;
              }
              
              const itemStr = item.toString();
              const isSelected = selectedValue === itemStr;
              return (
                <TouchableOpacity
                  key={itemStr}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
                  onPress={() => onSelect(item)}
                >
                  <Text style={{
                    fontSize: 16,
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    fontWeight: isSelected ? '500' : '300',
                  }}>
                    {itemStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Month Selector */}
        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() => setShowMonthPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 14,
            color: selectedMonth ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '300',
          }}>
            {selectedMonth || 'Month'}
          </Text>
          <Text style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Day Selector */}
        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() => setShowDayPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 14,
            color: selectedDay ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '300',
          }}>
            {selectedDay || 'Day'}
          </Text>
          <Text style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Year Selector */}
        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onPress={() => setShowYearPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 14,
            color: selectedYear ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '300',
          }}>
            {selectedYear || 'Year'}
          </Text>
          <Text style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Picker Modal */}
      {renderPicker(months, selectedMonth, (month) => handleDateChange('month', month), 'month')}

      {/* Day Picker Modal */}
      {renderPicker(getDaysForMonth(selectedMonth, selectedYear), selectedDay, (day) => handleDateChange('day', day), 'day')}

      {/* Year Picker Modal */}
      {renderPicker(years, selectedYear, (year) => handleDateChange('year', year), 'year')}
    </View>
  );
};

export default BirthdaySelector;
