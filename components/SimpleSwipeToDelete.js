import React, { useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import MinimalisticDeleteModal from './MinimalisticDeleteModal';

const SimpleSwipeToDelete = ({ children, onDelete, enabled = true, mealName = null }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (!enabled) return;

    const { state, translationX } = event.nativeEvent;
    
    console.log('Gesture state:', state, 'translationX:', translationX);
    
    if (state === State.ACTIVE) {
      // Show delete indicator when swiping
      const opacity = Math.abs(translationX) > 20 ? 1 : 0;
      
      Animated.timing(deleteOpacity, {
        toValue: opacity,
        duration: 50,
        useNativeDriver: false,
      }).start();
      
      console.log('Setting opacity to:', opacity);
    }
    
    if (state === State.END) {
      const threshold = 100; // Fixed threshold
      
      console.log('Gesture ended, translationX:', translationX, 'threshold:', threshold);
      
      if (Math.abs(translationX) > threshold) {
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show modern delete modal
        setShowDeleteModal(true);
      }
      
      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
      
      // Hide delete indicator
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  if (!enabled) {
    return children;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteText}>🗑️ DELETE</Text>
      </Animated.View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-3, 3]}
        failOffsetY={[-15, 15]}
      >
        <Animated.View style={[
          styles.contentContainer,
          { transform: [{ translateX }] }
        ]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
      
      <MinimalisticDeleteModal
        visible={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Meal"
        message="Are you sure you want to delete this meal? This action cannot be undone."
        mealName={mealName}
        confirmText="Delete"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
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
    zIndex: 1,
  },
  contentContainer: {
    backgroundColor: 'white',
    zIndex: 2,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default SimpleSwipeToDelete;
