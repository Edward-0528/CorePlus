import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

const ModernWeightSelector = ({ value, onWeightSelect, styles }) => {
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState('');

  // Sync with props
  useEffect(() => {
    setSelectedWeight(value || '');
  }, [value]);

  // Generate weight options from 80 to 400 lbs in increments of 5
  const generateWeightOptions = () => {
    const weights = [];
    for (let weight = 80; weight <= 400; weight += 5) {
      weights.push(weight);
    }
    return weights;
  };

  const weightOptions = generateWeightOptions();

  const handleWeightChange = (weight) => {
    const weightStr = weight.toString();
    setSelectedWeight(weightStr);
    setShowWeightPicker(false);

    if (typeof onWeightSelect === 'function') {
      onWeightSelect(weight);
    }
  };

  const renderWeightPicker = () => (
    <Modal
      visible={showWeightPicker}
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
        onPress={() => setShowWeightPicker(false)}
        activeOpacity={1}
      >
        <View style={{
          backgroundColor: '#1a1a2e',
          borderRadius: 16,
          width: '80%',
          maxHeight: '70%',
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
              Select Weight
            </Text>
          </View>
          
          <ScrollView 
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={true}
          >
            {weightOptions.map((weight) => {
              const weightStr = weight.toString();
              const isSelected = selectedWeight === weightStr;
              return (
                <TouchableOpacity
                  key={weightStr}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
                  onPress={() => handleWeightChange(weight)}
                >
                  <Text style={{
                    fontSize: 16,
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    fontWeight: isSelected ? '500' : '300',
                  }}>
                    {weight} lbs
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
      {/* Weight Selector Button */}
      <TouchableOpacity
        style={{
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
        onPress={() => setShowWeightPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={{
          fontSize: 14,
          color: selectedWeight ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
          fontWeight: '300',
        }}>
          {selectedWeight ? `${selectedWeight} lbs` : 'Select weight'}
        </Text>
        <Text style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Weight Picker Modal */}
      {renderWeightPicker()}
    </View>
  );
};

export default ModernWeightSelector;
