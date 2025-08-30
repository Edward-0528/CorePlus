import React, { useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const SwipeToDeleteWrapper = ({ children, onDelete, enabled = true }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (!enabled) return;

    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      const threshold = 0.4; // 40% of screen width (reduced for easier deletion)
      const screenWidth = 350; // Approximate width
      
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
      // Show delete indicator when swiping (more sensitive)
      const opacity = Math.abs(translationX) > 30 ? 1 : 0; // Reduced from 50 to 30
      Animated.timing(deleteOpacity, {
        toValue: opacity,
        duration: 100,
        useNativeDriver: false,
      }).start();
      
      // Haptic feedback when reaching delete threshold
      if (Math.abs(translationX) > 100) { // Reduced from 150 to 100
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
        <Text style={styles.deleteText}>🗑️ Delete</Text>
      </Animated.View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-5, 5]} // More sensitive
        failOffsetY={[-20, 20]} // Allow some vertical movement
      >
        <Animated.View style={[
          { transform: [{ translateX }] },
          styles.contentContainer
        ]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden', // Ensure proper clipping
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
    zIndex: 0, // Changed from -1 to 0
  },
  contentContainer: {
    backgroundColor: 'white', // Ensure content has background
    zIndex: 1, // Above delete background
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SwipeToDeleteWrapper;
