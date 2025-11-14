import React, { useState } from 'react';
import { Modal, View, StyleSheet, StatusBar, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanner from './BarcodeScanner';
import { searchProductByText } from '../services/barcodeService';

const BarcodeScannerModal = ({ 
  visible, 
  onClose, 
  onBarcodeScanned, 
  onError,
  user
}) => {
  const [mode, setMode] = useState('scan'); // 'scan' | 'search'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleBarcodeScanned = (nutrition) => {
    onBarcodeScanned(nutrition);
    onClose();
  };

  const handleError = (error) => {
    if (onError) onError(error);
    // Instead of closing, switch to search mode for a smoother fallback
    setMode('search');
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(false);
    try {
      const resp = await searchProductByText(query, 15);
      if (resp.success && resp.products?.length) {
        setResults(resp.products);
      } else {
        setResults([]);
      }
      setHasSearched(true);
    } catch (e) {
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'scan' ? 'Scan Barcode' : 'Search Products'}
          </Text>
          <TouchableOpacity onPress={() => setMode(mode === 'scan' ? 'search' : 'scan')} style={styles.headerButtonRight}>
            <Ionicons name={mode === 'scan' ? 'search' : 'barcode'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {mode === 'scan' ? (
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            onClose={onClose}
            onError={handleError}
            isVisible={visible}
            user={user}
          />
        ) : (
          <View style={styles.searchWrapper}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Search products (e.g., yogurt, chicken, cereal)"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={runSearch}
                autoFocus
              />
              <TouchableOpacity style={styles.searchBtn} onPress={runSearch} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Search</Text>}
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginTop: 16 }}>
              {loading && (
                <View style={styles.centerMsg}><ActivityIndicator size="large" color="#50E3C2" /></View>
              )}
              {!loading && hasSearched && results.length === 0 && (
                <View style={styles.centerMsg}><Text style={styles.emptyText}>No results found</Text></View>
              )}
              {!loading && results.length > 0 && (
                <FlatList
                  data={results}
                  keyExtractor={(item, idx) => `${item.barcode || item.name}-${idx}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem} onPress={() => handleBarcodeScanned(item)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        <Text style={styles.resultMeta}>{Math.round(item.calories)} kcal • P{item.protein} C{item.carbs} F{item.fat}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.sep} />}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'black',
  },
  headerButton: { padding: 8 },
  headerButtonRight: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  searchWrapper: { flex: 1, backgroundColor: '#0B0B0B', padding: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  searchBtn: { backgroundColor: '#50E3C2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8 },
  searchBtnText: { color: '#000', fontWeight: '600' },
  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  resultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  resultName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  sep: { height: 1, backgroundColor: '#111827' },
});

export default BarcodeScannerModal;
