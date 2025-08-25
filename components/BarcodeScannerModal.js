import React from 'react';
import { Modal, View, StyleSheet, StatusBar } from 'react-native';
import BarcodeScanner from './BarcodeScanner';

const BarcodeScannerModal = ({ 
  visible, 
  onClose, 
  onBarcodeScanned, 
  onError 
}) => {
  const handleBarcodeScanned = (nutrition) => {
    onBarcodeScanned(nutrition);
    onClose(); // Close modal after successful scan
  };

  const handleError = (error) => {
    if (onError) {
      onError(error);
    }
    onClose(); // Close modal on error
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        <BarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onClose={onClose}
          onError={handleError}
          isVisible={visible}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default BarcodeScannerModal;
