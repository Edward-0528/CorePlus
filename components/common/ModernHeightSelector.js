import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

const ModernHeightSelector = ({ feet, inches, onHeightSelect, styles }) => {
  const [showFeetPicker, setShowFeetPicker] = useState(false);
  const [showInchesPicker, setShowInchesPicker] = useState(false);
  
  const [selectedFeet, setSelectedFeet] = useState('');
  const [selectedInches, setSelectedInches] = useState('');

  // Sync with props
  useEffect(() => {
    setSelectedFeet(feet || '');
    setSelectedInches(inches || '');
  }, [feet, inches]);

  const feetOptions = [4, 5, 6, 7, 8];
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i);

  const handleHeightChange = (type, value) => {
    let newFeet = selectedFeet;
    let newInches = selectedInches;

    if (type === 'feet') {
      newFeet = value.toString();
      setSelectedFeet(newFeet);
      setShowFeetPicker(false);
    } else if (type === 'inches') {
      newInches = value.toString();
      setSelectedInches(newInches);
      setShowInchesPicker(false);
    }

    // Always call callback with current values
    if (typeof onHeightSelect === 'function') {
      onHeightSelect(parseInt(newFeet) || 0, parseInt(newInches) || 0);
    }
  };

  const renderPicker = (items, selectedValue, onSelect, type, suffix = '') => (
    <Modal
      visible={type === 'feet' ? showFeetPicker : showInchesPicker}
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
          if (type === 'feet') setShowFeetPicker(false);
          else setShowInchesPicker(false);
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
              Select {type === 'feet' ? 'Feet' : 'Inches'}
            </Text>
          </View>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {items.map((item) => {
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
                    {itemStr}{suffix}
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
        {/* Feet Selector */}
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
          onPress={() => setShowFeetPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 14,
            color: selectedFeet ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '300',
          }}>
            {selectedFeet ? `${selectedFeet} ft` : 'Feet'}
          </Text>
          <Text style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* Inches Selector */}
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
          onPress={() => setShowInchesPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 14,
            color: selectedInches ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            fontWeight: '300',
          }}>
            {selectedInches ? `${selectedInches} in` : 'Inches'}
          </Text>
          <Text style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feet Picker Modal */}
      {renderPicker(feetOptions, selectedFeet, (feet) => handleHeightChange('feet', feet), 'feet', ' ft')}

      {/* Inches Picker Modal */}
      {renderPicker(inchesOptions, selectedInches, (inches) => handleHeightChange('inches', inches), 'inches', ' in')}
    </View>
  );
};

export default ModernHeightSelector;
