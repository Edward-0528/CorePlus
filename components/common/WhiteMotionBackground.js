import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { 
  Defs, 
  RadialGradient, 
  LinearGradient as SvgLinearGradient,
  Stop, 
  Circle, 
  Polygon, 
  Path,
  G,
  Line
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WhiteMotionBackground = ({ children }) => {
  // Gentle floating animations
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const float4 = useRef(new Animated.Value(0)).current;
  
  // Rotation animations for orbs
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  
  // Scale animations for breathing orbs
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;
  
  // Opacity for gentle pulsing
  const opacity1 = useRef(new Animated.Value(0.1)).current;
  const opacity2 = useRef(new Animated.Value(0.15)).current;
  const opacity3 = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    // Gentle floating animation
    const createFloatAnimation = (animatedValue, duration, range = 20) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: range,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -range,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Slow rotation
    const createRotateAnimation = (animatedValue, duration) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Breathing scale effect
    const createScaleAnimation = (animatedValue, duration, scaleRange = 0.1) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1 + scaleRange,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1 - scaleRange / 2,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Gentle opacity pulsing
    const createOpacityAnimation = (animatedValue, duration, min, max) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: max,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: min,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    const animations = [
      createFloatAnimation(float1, 18000, 15),
      createFloatAnimation(float2, 22000, 20),
      createFloatAnimation(float3, 16000, 12),
      createFloatAnimation(float4, 25000, 18),
      createRotateAnimation(rotate1, 80000),
      createRotateAnimation(rotate2, 65000),
      createScaleAnimation(scale1, 12000, 0.05),
      createScaleAnimation(scale2, 15000, 0.08),
      createScaleAnimation(scale3, 18000, 0.06),
      createOpacityAnimation(opacity1, 10000, 0.05, 0.15),
      createOpacityAnimation(opacity2, 14000, 0.08, 0.20),
      createOpacityAnimation(opacity3, 12000, 0.03, 0.12),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  // Clean white background with subtle grays
  const colors = {
    background: ['#ffffff', '#fafafa', '#f5f5f5'],
    orbs: '#e8e8e8',
    orbsSecondary: '#f0f0f0',
    particles: '#d0d0d0',
    lines: '#e5e5e5',
    accent: '#f8f8f8'
  };

  // Simple geometric shape generators
  const circleOrb = (x, y, radius, opacity) => (
    <Circle
      cx={x}
      cy={y}
      r={radius}
      fill="url(#orbGradient)"
      opacity={opacity}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Clean white gradient background */}
      <LinearGradient
        colors={colors.background}
        locations={[0, 0.5, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Subtle white motion overlay with orbs and particles */}
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Defs>
          <RadialGradient id="orbGradient" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor={colors.orbs} stopOpacity="0.3" />
            <Stop offset="60%" stopColor={colors.orbsSecondary} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={colors.orbs} stopOpacity="0.05" />
          </RadialGradient>

          <RadialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.particles} stopOpacity="0.6" />
            <Stop offset="70%" stopColor={colors.particles} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={colors.particles} stopOpacity="0" />
          </RadialGradient>

          <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.lines} stopOpacity="0" />
            <Stop offset="50%" stopColor={colors.lines} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.lines} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Large floating orbs */}
        <G opacity="0.6">
          {circleOrb(screenWidth * 0.15, screenHeight * 0.25, 60, 0.2)}
          {circleOrb(screenWidth * 0.85, screenHeight * 0.6, 80, 0.15)}
          {circleOrb(screenWidth * 0.3, screenHeight * 0.8, 45, 0.25)}
          {circleOrb(screenWidth * 0.7, screenHeight * 0.15, 35, 0.3)}
        </G>

        {/* Medium orbs */}
        <G opacity="0.4">
          {circleOrb(screenWidth * 0.6, screenHeight * 0.4, 25, 0.4)}
          {circleOrb(screenWidth * 0.2, screenHeight * 0.65, 30, 0.3)}
          {circleOrb(screenWidth * 0.8, screenHeight * 0.3, 20, 0.5)}
        </G>

        {/* Floating particles */}
        <G opacity="0.5">
          <Circle cx="120" cy="180" r="4" fill="url(#particleGradient)" />
          <Circle cx="280" cy="120" r="3" fill="url(#particleGradient)" />
          <Circle cx="350" cy="250" r="5" fill="url(#particleGradient)" />
          <Circle cx="80" cy="320" r="2.5" fill="url(#particleGradient)" />
          <Circle cx="300" cy="380" r="3.5" fill="url(#particleGradient)" />
          <Circle cx="180" cy="450" r="4.5" fill="url(#particleGradient)" />
          <Circle cx="50" cy="500" r="3" fill="url(#particleGradient)" />
          <Circle cx="320" cy="480" r="2.8" fill="url(#particleGradient)" />
          
          {/* Small particles */}
          <Circle cx="150" cy="90" r="1.5" fill={colors.particles} opacity="0.4" />
          <Circle cx="250" cy="160" r="1.2" fill={colors.particles} opacity="0.3" />
          <Circle cx="380" cy="200" r="1.8" fill={colors.particles} opacity="0.5" />
          <Circle cx="60" cy="240" r="1" fill={colors.particles} opacity="0.25" />
          <Circle cx="330" cy="320" r="1.5" fill={colors.particles} opacity="0.4" />
          <Circle cx="200" cy="350" r="1.3" fill={colors.particles} opacity="0.35" />
        </G>

        {/* Subtle connecting lines */}
        <G opacity="0.3">
          <Path
            d={`M 0 ${screenHeight * 0.3} Q ${screenWidth * 0.3} ${screenHeight * 0.28} ${screenWidth * 0.6} ${screenHeight * 0.32} Q ${screenWidth * 0.8} ${screenHeight * 0.34} ${screenWidth} ${screenHeight * 0.3}`}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
          />

          <Path
            d={`M 0 ${screenHeight * 0.7} Q ${screenWidth * 0.4} ${screenHeight * 0.72} ${screenWidth * 0.7} ${screenHeight * 0.68} Q ${screenWidth * 0.9} ${screenHeight * 0.66} ${screenWidth} ${screenHeight * 0.7}`}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.8"
          />
        </G>

        {/* Very subtle grid pattern */}
        <G opacity="0.08">
          {Array.from({ length: Math.ceil(screenWidth / 100) }).map((_, i) => (
            <Line
              key={`grid-v-${i}`}
              x1={i * 100}
              y1="0"
              x2={i * 100}
              y2={screenHeight}
              stroke={colors.lines}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: Math.ceil(screenHeight / 100) }).map((_, i) => (
            <Line
              key={`grid-h-${i}`}
              x1="0"
              y1={i * 100}
              x2={screenWidth}
              y2={i * 100}
              stroke={colors.lines}
              strokeWidth="0.5"
            />
          ))}
        </G>
      </Svg>

      {/* Animated floating elements */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 120,
          left: 100,
          transform: [
            { translateY: float1 },
            { rotate: rotate1.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })},
            { scale: scale1 }
          ],
          opacity: opacity1
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            backgroundColor: colors.orbs,
            borderRadius: 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 280,
          right: 120,
          transform: [
            { translateY: float2 },
            { scale: scale2 }
          ],
          opacity: opacity2
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            backgroundColor: colors.orbsSecondary,
            borderRadius: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 1,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 200,
          left: 80,
          transform: [
            { translateY: float3 },
            { rotate: rotate2.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-360deg']
            })},
            { scale: scale3 }
          ],
          opacity: opacity3
        }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.particles,
            borderRadius: 6,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 400,
          right: 60,
          transform: [
            { translateY: float4 }
          ]
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: colors.particles,
            borderRadius: 4,
            opacity: 0.6,
          }}
        />
      </Animated.View>

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default WhiteMotionBackground;
