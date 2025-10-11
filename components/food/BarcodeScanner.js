import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { getNutritionFromBarcode } from '../services/barcodeService';

const { width, height } = Dimensions.get('window');

const BarcodeScanner = ({ 
  onBarcodeScanned, 
  onClose, 
  onError,
  isVisible = true 
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted && permission !== null) {
      requestCameraPermission();
    }
  }, [permission]);

  const requestCameraPermission = async () => {
    try {
      const result = await requestPermission();
      
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to scan barcodes',
          [
            { text: 'Cancel', onPress: onClose },
            { text: 'Settings', onPress: () => {
              // On iOS, this would open settings
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    
    try {
      console.log(`📱 Scanned barcode: ${data} (${type})`);
      
      // Get nutrition data from barcode
      const result = await getNutritionFromBarcode(data);
      
      if (result.success) {
        // Success - pass nutrition data back
        onBarcodeScanned(result.nutrition);
      } else {
        // Failed to find product
        Alert.alert(
          'Product Not Found',
          result.message || 'This product is not in our database. Would you like to add it manually?',
          [
            { text: 'Try Again', onPress: () => {
              setScanned(false);
              setLoading(false);
            }},
            { text: 'Manual Entry', onPress: () => {
              onError && onError(result);
              onClose();
            }}
          ]
        );
        setScanned(false);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to process barcode. Please try again.',
        [
          { text: 'Try Again', onPress: () => {
            setScanned(false);
            setLoading(false);
          }},
          { text: 'Cancel', onPress: onClose }
        ]
      );
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  if (permission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#8E8E93" />
        <Text style={styles.permissionText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <CameraView
        ref={scannerRef}
        style={styles.scanner}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        flash={torchOn ? 'on' : 'off'}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
      />
      
      {/* Scanning overlay */}
      <View style={styles.overlay}>
        {/* Top section */}
        <View style={styles.overlayTop}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Center scanning area */}
        <View style={styles.overlayCenter}>
          <View style={styles.unfocusedContainer}>
            <View style={styles.scanningFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Bottom section */}
        <View style={styles.overlayBottom}>
          <Text style={styles.instructionText}>
            {scanned ? 'Processing barcode...' : 'Position barcode within the frame'}
          </Text>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.controlButton, torchOn && styles.torchActive]} 
              onPress={toggleTorch}
            >
              <Ionicons 
                name={torchOn ? "flash" : "flash-outline"} 
                size={24} 
                color={torchOn ? "#FFD700" : "white"} 
              />
              <Text style={styles.controlText}>Flash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={resetScanner}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={24} color="white" />
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
  },
  overlayCenter: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningFrame: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  torchActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  permissionText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarcodeScanner;
