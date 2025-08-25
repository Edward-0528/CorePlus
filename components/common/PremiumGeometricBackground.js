import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { 
  Defs, 
  RadialGradient, 
  Stop, 
  Circle, 
  Polygon, 
  Path,
  G
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PremiumGeometricBackground = ({ children, variant = 'dark' }) => {
  // Animation values for floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;
  
  // Rotation animations
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;
  const rotation3 = useRef(new Animated.Value(0)).current;

  // Scale animations for pulsing effect
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animations
    const createFloatingAnimation = (animatedValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Rotation animations
    const createRotationAnimation = (animatedValue, duration, reverse = false) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: reverse ? -1 : 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Scale/pulse animations
    const createScaleAnimation = (animatedValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Start all animations
    const animations = [
      createFloatingAnimation(particle1, 8000, 0),
      createFloatingAnimation(particle2, 12000, 2000),
      createFloatingAnimation(particle3, 15000, 4000),
      createFloatingAnimation(particle4, 10000, 1000),
      createFloatingAnimation(particle5, 18000, 3000),
      createRotationAnimation(rotation1, 20000),
      createRotationAnimation(rotation2, 30000, true),
      createRotationAnimation(rotation3, 25000),
      createScaleAnimation(scale1, 6000, 0),
      createScaleAnimation(scale2, 8000, 2000),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  // Color schemes for different variants
  const colorSchemes = {
    dark: {
      primary: ['#0f0f23', '#1a1a3e', '#2d2d5f'],
      secondary: ['#1e1e3f', '#3a3a6b'],
      accent: '#4a9eff',
      accentSecondary: '#6b73ff',
      particles: '#ffffff',
      overlay: 'rgba(15, 15, 35, 0.8)'
    },
    elegant: {
      primary: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
      secondary: ['#151515', '#252525'],
      accent: '#c9b037',
      accentSecondary: '#ffd700',
      particles: '#ffffff',
      overlay: 'rgba(10, 10, 10, 0.7)'
    },
    professional: {
      primary: ['#0d1117', '#161b22', '#21262d'],
      secondary: ['#1c2128', '#2d333b'],
      accent: '#58a6ff',
      accentSecondary: '#79c0ff',
      particles: '#ffffff',
      overlay: 'rgba(13, 17, 23, 0.8)'
    }
  };

  const colors = colorSchemes[variant] || colorSchemes.dark;

  // Animated transforms
  const particle1Transform = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30]
  });

  const particle2Transform = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20]
  });

  const particle3Transform = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25]
  });

  const particle4Transform = particle4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  const particle5Transform = particle5.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });

  const rotation1Transform = rotation1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const rotation2Transform = rotation2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg']
  });

  const rotation3Transform = rotation3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Base gradient background */}
      <LinearGradient
        colors={colors.primary}
        locations={[0, 0.6, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* SVG Geometric Patterns */}
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
          {/* Radial gradients for glowing effects */}
          <RadialGradient id="glowGradient1" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.3" />
            <Stop offset="70%" stopColor={colors.accent} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
          
          <RadialGradient id="glowGradient2" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accentSecondary} stopOpacity="0.25" />
            <Stop offset="70%" stopColor={colors.accentSecondary} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.accentSecondary} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.particles} stopOpacity="0.8" />
            <Stop offset="70%" stopColor={colors.particles} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.particles} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Large geometric shapes */}
        <G opacity="0.15">
          {/* Top right hexagon */}
          <Polygon
            points={`${screenWidth - 100},50 ${screenWidth - 50},75 ${screenWidth - 50},125 ${screenWidth - 100},150 ${screenWidth - 150},125 ${screenWidth - 150},75`}
            fill="url(#glowGradient1)"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.6"
          />
          
          {/* Bottom left triangle */}
          <Polygon
            points="50,450 150,450 100,350"
            fill="url(#glowGradient2)"
            stroke={colors.accentSecondary}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Center diamond */}
          <Polygon
            points={`${screenWidth/2},200 ${screenWidth/2 + 60},250 ${screenWidth/2},300 ${screenWidth/2 - 60},250`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.4"
          />
        </G>

        {/* Floating particles - small circles */}
        <G opacity="0.6">
          <Circle cx="80" cy="120" r="2" fill="url(#particleGradient)" />
          <Circle cx="320" cy="180" r="1.5" fill="url(#particleGradient)" />
          <Circle cx="150" cy="350" r="2.5" fill="url(#particleGradient)" />
          <Circle cx="280" cy="420" r="1" fill="url(#particleGradient)" />
          <Circle cx="50" cy="280" r="1.5" fill="url(#particleGradient)" />
          <Circle cx="350" cy="300" r="2" fill="url(#particleGradient)" />
          <Circle cx="200" cy="500" r="1.5" fill="url(#particleGradient)" />
        </G>

        {/* Grid pattern overlay */}
        <G opacity="0.08">
          {Array.from({ length: Math.ceil(screenWidth / 40) }).map((_, i) => (
            <Path
              key={`vertical-${i}`}
              d={`M ${i * 40} 0 L ${i * 40} ${screenHeight}`}
              stroke={colors.particles}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: Math.ceil(screenHeight / 40) }).map((_, i) => (
            <Path
              key={`horizontal-${i}`}
              d={`M 0 ${i * 40} L ${screenWidth} ${i * 40}`}
              stroke={colors.particles}
              strokeWidth="0.5"
            />
          ))}
        </G>

        {/* Animated glowing orbs */}
        <G opacity="0.3">
          <Circle
            cx={screenWidth * 0.8}
            cy={screenHeight * 0.2}
            r="40"
            fill="url(#glowGradient1)"
          />
          <Circle
            cx={screenWidth * 0.2}
            cy={screenHeight * 0.7}
            r="60"
            fill="url(#glowGradient2)"
          />
        </G>
      </Svg>

      {/* Animated floating elements */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 100,
          left: 50,
          transform: [
            { translateY: particle1Transform },
            { rotate: rotation1Transform },
            { scale: scale1 }
          ]
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            opacity: 0.7,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 200,
          right: 80,
          transform: [
            { translateY: particle2Transform },
            { rotate: rotation2Transform }
          ]
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: colors.accentSecondary,
            opacity: 0.6,
            transform: [{ rotate: '45deg' }],
            shadowColor: colors.accentSecondary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 3,
            elevation: 3,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 150,
          left: 120,
          transform: [
            { translateY: particle3Transform },
            { scale: scale2 }
          ]
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.particles,
            opacity: 0.5,
            shadowColor: colors.particles,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 5,
            elevation: 5,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 300,
          left: screenWidth * 0.7,
          transform: [
            { translateY: particle4Transform },
            { rotate: rotation3Transform }
          ]
        }}
      >
        <View
          style={{
            width: 12,
            height: 2,
            backgroundColor: colors.accent,
            opacity: 0.8,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 300,
          right: 50,
          transform: [{ translateY: particle5Transform }]
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.accentSecondary,
            borderRadius: 4,
            opacity: 0.7,
            shadowColor: colors.accentSecondary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
            elevation: 3,
          }}
        />
      </Animated.View>

      {/* Content overlay with subtle gradient */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default PremiumGeometricBackground;
