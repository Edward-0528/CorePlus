import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3; // 30% of screen width
const DELETE_THRESHOLD = screenWidth * 0.5; // 50% of screen width for delete

const SwipeToDeleteWrapper = ({ 
  children, 
  onDelete, 
  itemName, 
  disabled = false,
  style = {} 
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = async (event) => {
    if (disabled) return;

    const { state, translationX } = event.nativeEvent;

    if (state === State.END) {
      const finalTranslation = lastOffset.current + translationX;

      // If swiped far enough to trigger delete
      if (Math.abs(finalTranslation) >= DELETE_THRESHOLD) {
        // Provide haptic feedback
        if (Haptics?.impactAsync) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Animate to fully swiped position then trigger delete
        Animated.timing(translateX, {
          toValue: finalTranslation > 0 ? screenWidth : -screenWidth,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          onDelete();
          // Reset position after delete for clean state
          translateX.setValue(0);
          lastOffset.current = 0;
        });
      } 
      // If swiped enough to show delete hint but not enough to delete
      else if (Math.abs(finalTranslation) >= SWIPE_THRESHOLD) {
        // Provide light haptic feedback for hint
        if (Haptics?.impactAsync) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Show delete hint position
        const hintPosition = finalTranslation > 0 ? SWIPE_THRESHOLD : -SWIPE_THRESHOLD;
        lastOffset.current = hintPosition;
        
        Animated.spring(translateX, {
          toValue: hintPosition,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      } 
      // Not swiped far enough, snap back to center
      else {
        lastOffset.current = 0;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  // Calculate delete background opacity based on swipe distance
  const deleteOpacity = translateX.interpolate({
    inputRange: [-screenWidth, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, screenWidth],
    outputRange: [1, 0.7, 0, 0.7, 1],
    extrapolate: 'clamp',
  });

  // Calculate delete background color intensity
  const deleteColorIntensity = translateX.interpolate({
    inputRange: [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, DELETE_THRESHOLD],
    outputRange: [1, 0.6, 0, 0.6, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      {/* Delete Background - Left Swipe */}
      <Animated.View 
        style={[
          styles.deleteBackground, 
          styles.deleteBackgroundLeft,
          { 
            opacity: deleteOpacity,
            backgroundColor: deleteColorIntensity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.9)']
            })
          }
        ]}
      >
        <View style={styles.deleteContent}>
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </Animated.View>

      {/* Delete Background - Right Swipe */}
      <Animated.View 
        style={[
          styles.deleteBackground, 
          styles.deleteBackgroundRight,
          { 
            opacity: deleteOpacity,
            backgroundColor: deleteColorIntensity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.9)']
            })
          }
        ]}
      >
        <View style={styles.deleteContent}>
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </Animated.View>

      {/* Main Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={!disabled}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              transform: [{ translateX }],
            }
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteBackgroundLeft: {
    left: 0,
  },
  deleteBackgroundRight: {
    right: 0,
  },
  deleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: fonts.medium,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default SwipeToDeleteWrapper;
