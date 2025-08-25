import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { 
  Defs, 
  LinearGradient as SvgLinearGradient,
  Stop, 
  Circle, 
  Polygon, 
  Path,
  G,
  Line
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GeometricMotionBackground = ({ children, style = 'minimal' }) => {
  // Subtle floating animations
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  
  // Gentle rotation animations
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  
  // Opacity for subtle pulsing
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Gentle floating animation
    const createFloatAnimation = (animatedValue, duration, range = 15) => {
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

    // Subtle opacity pulsing
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
      createFloatAnimation(float1, 15000, 12),
      createFloatAnimation(float2, 20000, 18),
      createFloatAnimation(float3, 25000, 10),
      createRotateAnimation(rotate1, 60000),
      createRotateAnimation(rotate2, 45000),
      createOpacityAnimation(opacity1, 8000, 0.1, 0.4),
      createOpacityAnimation(opacity2, 12000, 0.05, 0.25),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  // Color scheme based on your app's design
  const colors = {
    background: ['#0a0a0f', '#151520', '#1a1a2e'],
    accent: '#4a90e2', // Soft blue
    accentSecondary: '#6bb6ff',
    lines: '#ffffff',
    particles: '#ffffff'
  };

  // Simple geometric shape generators
  const hexagonPoints = (centerX, centerY, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const trianglePoints = (centerX, centerY, radius) => {
    const points = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Clean gradient background */}
      <LinearGradient
        colors={colors.background}
        locations={[0, 0.6, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Subtle geometric overlay */}
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
          <SvgLinearGradient id="subtleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.15" />
            <Stop offset="50%" stopColor={colors.accentSecondary} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.03" />
          </SvgLinearGradient>

          <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.lines} stopOpacity="0" />
            <Stop offset="50%" stopColor={colors.lines} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={colors.lines} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Minimal geometric shapes */}
        <G opacity="0.6">
          {/* Large subtle hexagon */}
          <Polygon
            points={hexagonPoints(screenWidth / 2, screenHeight / 3, 60)}
            fill="none"
            stroke="url(#subtleGradient)"
            strokeWidth="1"
            opacity="0.4"
          />
          
          {/* Corner triangles */}
          <Polygon
            points={trianglePoints(screenWidth - 60, 80, 20)}
            fill="url(#subtleGradient)"
            opacity="0.3"
          />

          <Polygon
            points={trianglePoints(60, screenHeight - 100, 15)}
            fill="url(#subtleGradient)"
            opacity="0.25"
          />

          {/* Clean connecting lines */}
          <Path
            d={`M 0 ${screenHeight * 0.25} L ${screenWidth * 0.3} ${screenHeight * 0.22} L ${screenWidth * 0.7} ${screenHeight * 0.28} L ${screenWidth} ${screenHeight * 0.25}`}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
            opacity="0.6"
          />

          <Path
            d={`M 0 ${screenHeight * 0.75} L ${screenWidth * 0.4} ${screenHeight * 0.78} L ${screenWidth * 0.8} ${screenHeight * 0.72} L ${screenWidth} ${screenHeight * 0.75}`}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
            opacity="0.4"
          />
        </G>

        {/* Minimal floating particles */}
        <G opacity="0.5">
          <Circle cx="100" cy="150" r="2" fill={colors.particles} opacity="0.4" />
          <Circle cx="300" cy="200" r="1.5" fill={colors.particles} opacity="0.3" />
          <Circle cx="200" cy="400" r="2.5" fill={colors.particles} opacity="0.5" />
          <Circle cx="320" cy="500" r="1.8" fill={colors.particles} opacity="0.35" />
          
          {/* Micro dots */}
          <Circle cx="150" cy="300" r="1" fill={colors.particles} opacity="0.25" />
          <Circle cx="280" cy="350" r="0.8" fill={colors.particles} opacity="0.2" />
          <Circle cx="80" cy="450" r="1.2" fill={colors.particles} opacity="0.3" />
        </G>

        {/* Very subtle grid pattern */}
        <G opacity="0.02">
          {Array.from({ length: Math.ceil(screenWidth / 80) }).map((_, i) => (
            <Line
              key={`grid-v-${i}`}
              x1={i * 80}
              y1="0"
              x2={i * 80}
              y2={screenHeight}
              stroke={colors.lines}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: Math.ceil(screenHeight / 80) }).map((_, i) => (
            <Line
              key={`grid-h-${i}`}
              x1="0"
              y1={i * 80}
              x2={screenWidth}
              y2={i * 80}
              stroke={colors.lines}
              strokeWidth="0.5"
            />
          ))}
        </G>
      </Svg>

      {/* Animated floating elements - very subtle */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          transform: [
            { translateY: float1 },
            { rotate: rotate1.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })}
          ],
          opacity: opacity1
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: colors.accent,
            opacity: 0.4,
            borderRadius: 1,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 250,
          right: 80,
          transform: [
            { translateY: float2 },
            { rotate: rotate2.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-360deg']
            })}
          ],
          opacity: opacity2
        }}
      >
        <View
          style={{
            width: 12,
            height: 2,
            backgroundColor: colors.accentSecondary,
            opacity: 0.5,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 150,
          left: 120,
          transform: [
            { translateY: float3 }
          ]
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.accent,
            borderRadius: 3,
            opacity: 0.3,
          }}
        />
      </Animated.View>

      {/* Subtle content overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      />

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default GeometricMotionBackground;
