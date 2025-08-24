import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MotiView, useAnimationState } from 'moti';
import { Easing } from 'react-native-reanimated';

// Minimal, smooth Core+ loader with Moti/Reanimated
export default function AnimatedLoader({
  size = 120,
  accent = '#5CE1E6',
  ring = 'rgba(0,0,0,0.08)',
  background = '#FFFFFF',
  label = 'Core+',
  message,
  showLabel = true
}) {
  const ripple = useAnimationState({
    from: { scale: 1, opacity: 0.28 },
    to: { scale: 1.35, opacity: 0 },
  });

  useEffect(() => {
    ripple.transitionTo('to');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Static subtle ring */}
        <View style={[styles.ring, { width: size, height: size, borderRadius: size/2, borderColor: ring }]} />

        {/* Ripple pulse */}
        <MotiView
          state={ripple}
          transition={{
            type: 'timing',
            duration: 1400,
            easing: Easing.out(Easing.quad),
            loop: true,
          }}
          style={[styles.ripple, { width: size, height: size, borderRadius: size/2, borderColor: ring }]}
        />

        {/* Rotating accent arc */}
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 1600, easing: Easing.linear, loop: true }}
          style={[styles.spinnerArc, { width: size, height: size, borderRadius: size/2, borderTopColor: accent }]}
        />

        {/* Inner disc + plus */}
        <View style={[styles.inner, { width: size * 0.56, height: size * 0.56, borderRadius: (size*0.56)/2 }]}> 
          <Text style={[styles.plus, { color: accent }]}>+</Text>
        </View>
      </View>

      {showLabel && (
        <Text style={styles.label}>{label}{message ? `  •  ${message}` : ''}</Text>
      )}

      {Platform.OS === 'web' && (
        <Text style={styles.hint}>Tip: Press r to reload, m to open menu</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1 },
  ripple: { position: 'absolute', borderWidth: 1 },
  spinnerArc: {
    position: 'absolute',
    borderTopWidth: 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
  },
  plus: { fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  label: { 
    marginTop: 18, 
    fontSize: 16, 
    color: '#ffffff', 
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hint: { 
    marginTop: 8, 
    fontSize: 12, 
    color: 'rgba(255, 255, 255, 0.6)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
});
