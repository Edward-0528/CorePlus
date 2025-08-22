import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const SwipeToDeleteWrapper = ({ children, onDelete, enabled = true }) => {
  const translateX = new Animated.Value(0);
  const deleteOpacity = new Animated.Value(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (!enabled) return;

    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      const threshold = 0.5; // 50% of screen width
      const screenWidth = 300; // Approximate width
      
      if (Math.abs(translationX) > screenWidth * threshold) {
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Delete the item
        onDelete && onDelete();
        
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
      
      // Hide delete indicator
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (state === State.ACTIVE) {
      // Show delete indicator when swiping
      const opacity = Math.abs(translationX) > 50 ? 1 : 0;
      Animated.timing(deleteOpacity, {
        toValue: opacity,
        duration: 100,
        useNativeDriver: false,
      }).start();
      
      // Haptic feedback when reaching delete threshold
      if (Math.abs(translationX) > 150) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  if (!enabled) {
    return children;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[{ transform: [{ translateX }] }]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SwipeToDeleteWrapper;
