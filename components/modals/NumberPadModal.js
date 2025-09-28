import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function NumberPadModal({ visible, label, value, onChange, onClose, onConfirm }) {
  const keys = ['1','2','3','4','5','6','7','8','9','0','CLR','OK'];
  const handlePress = (k) => {
    if (k === 'CLR') return onChange('');
    if (k === 'OK') return onConfirm();
    onChange(value + k);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value || '—'}</Text>
          <View style={styles.grid}>
            {keys.map(k => (
              <TouchableOpacity key={k} style={styles.key} onPress={()=>handlePress(k)}>
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center'},
  box:{ backgroundColor:'#fff', padding:20, borderRadius:12, width:260 },
  label:{ fontSize:14, fontWeight:'600', marginBottom:4 },
  value:{ fontSize:28, fontWeight:'700', textAlign:'center', marginBottom:12 },
  grid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  key:{ width:'30%', backgroundColor:'#F2F2F2', paddingVertical:10, marginBottom:10, borderRadius:6, alignItems:'center' },
  keyText:{ fontSize:16, fontWeight:'600' },
  close:{ marginTop:8, padding:12, backgroundColor:'#FF6B6B', borderRadius:6, alignItems:'center' },
  closeText:{ color:'#fff', fontWeight:'600' }
});
