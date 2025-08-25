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
  Rect,
  Filter,
  FeGaussianBlur,
  FeFuncA,
  FeComponentTransfer
} from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LuxuryPremiumBackground = ({ children, theme = 'platinum' }) => {
  // Multiple animation layers for sophisticated movement
  const layer1 = useRef(new Animated.Value(0)).current;
  const layer2 = useRef(new Animated.Value(0)).current;
  const layer3 = useRef(new Animated.Value(0)).current;
  
  // Rotation animations for geometric shapes
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;
  const rotation3 = useRef(new Animated.Value(0)).current;
  const rotation4 = useRef(new Animated.Value(0)).current;

  // Scale animations for breathing effects
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  // Opacity animations for subtle fading
  const opacity1 = useRef(new Animated.Value(0.7)).current;
  const opacity2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Ultra-smooth floating animations with easing
    const createFloatingAnimation = (animatedValue, duration, range = 30, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: range,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -range,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Continuous rotation with variable speeds
    const createRotationAnimation = (animatedValue, duration, reverse = false) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: reverse ? -1 : 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    };

    // Breathing scale effect
    const createBreathingAnimation = (animatedValue, duration, scaleRange = 0.1, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1 + scaleRange,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1 - scaleRange / 2,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Opacity pulsing
    const createOpacityAnimation = (animatedValue, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    // Start all animations with staggered timing
    const animations = [
      createFloatingAnimation(layer1, 12000, 25, 0),
      createFloatingAnimation(layer2, 18000, 35, 2000),
      createFloatingAnimation(layer3, 24000, 20, 4000),
      createRotationAnimation(rotation1, 40000),
      createRotationAnimation(rotation2, 60000, true),
      createRotationAnimation(rotation3, 80000),
      createRotationAnimation(rotation4, 35000, true),
      createBreathingAnimation(scale1, 8000, 0.08, 0),
      createBreathingAnimation(scale2, 12000, 0.12, 3000),
      createBreathingAnimation(scale3, 15000, 0.06, 6000),
      createOpacityAnimation(opacity1, 10000, 1000),
      createOpacityAnimation(opacity2, 14000, 5000),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  // Premium theme configurations
  const themes = {
    platinum: {
      primary: ['#0a0a0f', '#151520', '#202035', '#2a2a45'],
      secondary: ['#1a1a2e', '#2d2d50'],
      accent: '#c9b037', // Gold
      accentSecondary: '#e6cc5a',
      accentTertiary: '#silver', // Silver
      particles: '#ffffff',
      overlay: 'rgba(10, 10, 15, 0.75)',
      glowPrimary: '#ffd700',
      glowSecondary: '#c0c0c0'
    },
    sapphire: {
      primary: ['#0f0f1a', '#1a1a30', '#252545', '#303060'],
      secondary: ['#1e1e3a', '#333366'],
      accent: '#4169e1', // Royal Blue
      accentSecondary: '#6495ed',
      accentTertiary: '#87ceeb',
      particles: '#ffffff',
      overlay: 'rgba(15, 15, 26, 0.8)',
      glowPrimary: '#4169e1',
      glowSecondary: '#6495ed'
    },
    emerald: {
      primary: ['#0a150a', '#152015', '#203020', '#2a402a'],
      secondary: ['#1a2e1a', '#2d4d2d'],
      accent: '#50c878', // Emerald
      accentSecondary: '#3cb371',
      accentTertiary: '#90ee90',
      particles: '#ffffff',
      overlay: 'rgba(10, 21, 10, 0.8)',
      glowPrimary: '#50c878',
      glowSecondary: '#3cb371'
    },
    obsidian: {
      primary: ['#000000', '#0a0a0a', '#151515', '#202020'],
      secondary: ['#111111', '#1a1a1a'],
      accent: '#ff6b35', // Vibrant Orange
      accentSecondary: '#ff8c42',
      accentTertiary: '#ffad5a',
      particles: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.7)',
      glowPrimary: '#ff6b35',
      glowSecondary: '#ff8c42'
    }
  };

  const colors = themes[theme] || themes.platinum;

  // Complex geometric patterns data
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

  const starPoints = (centerX, centerY, outerRadius, innerRadius) => {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle - Math.PI / 2);
      const y = centerY + radius * Math.sin(angle - Math.PI / 2);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Multi-layer gradient background */}
      <LinearGradient
        colors={colors.primary}
        locations={[0, 0.3, 0.7, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Sophisticated SVG geometric overlay */}
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
          {/* Advanced gradient definitions */}
          <RadialGradient id="luxuryGlow1" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor={colors.glowPrimary} stopOpacity="0.4" />
            <Stop offset="40%" stopColor={colors.glowPrimary} stopOpacity="0.2" />
            <Stop offset="70%" stopColor={colors.glowPrimary} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={colors.glowPrimary} stopOpacity="0" />
          </RadialGradient>
          
          <RadialGradient id="luxuryGlow2" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={colors.glowSecondary} stopOpacity="0.35" />
            <Stop offset="50%" stopColor={colors.glowSecondary} stopOpacity="0.15" />
            <Stop offset="80%" stopColor={colors.glowSecondary} stopOpacity="0.03" />
            <Stop offset="100%" stopColor={colors.glowSecondary} stopOpacity="0" />
          </RadialGradient>

          <SvgLinearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.6" />
            <Stop offset="50%" stopColor={colors.accentSecondary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.accentTertiary} stopOpacity="0.1" />
          </SvgLinearGradient>

          <RadialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.particles} stopOpacity="0.9" />
            <Stop offset="60%" stopColor={colors.particles} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.particles} stopOpacity="0" />
          </RadialGradient>

          {/* Blur filters for soft glowing effects */}
          <Filter id="softGlow">
            <FeGaussianBlur stdDeviation="2" />
            <FeComponentTransfer>
              <FeFuncA type="discrete" tableValues="0.5 0.8 1" />
            </FeComponentTransfer>
          </Filter>
        </Defs>

        {/* Large architectural geometric shapes */}
        <G opacity="0.12">
          {/* Central hexagonal pattern */}
          <Polygon
            points={hexagonPoints(screenWidth / 2, screenHeight / 2, 80)}
            fill="none"
            stroke="url(#edgeGradient)"
            strokeWidth="1.5"
            filter="url(#softGlow)"
          />
          
          <Polygon
            points={hexagonPoints(screenWidth / 2, screenHeight / 2, 120)}
            fill="none"
            stroke={colors.accent}
            strokeWidth="0.8"
            opacity="0.4"
          />

          {/* Corner geometric elements */}
          <Polygon
            points={starPoints(screenWidth - 80, 100, 25, 10)}
            fill="url(#luxuryGlow1)"
            stroke={colors.accentSecondary}
            strokeWidth="0.5"
            opacity="0.6"
          />

          <Polygon
            points={hexagonPoints(80, screenHeight - 120, 35)}
            fill="url(#luxuryGlow2)"
            stroke={colors.accentTertiary}
            strokeWidth="0.8"
            opacity="0.5"
          />

          {/* Abstract geometric lines */}
          <Path
            d={`M 0 ${screenHeight * 0.3} Q ${screenWidth * 0.3} ${screenHeight * 0.2} ${screenWidth * 0.6} ${screenHeight * 0.35} Q ${screenWidth * 0.8} ${screenHeight * 0.4} ${screenWidth} ${screenHeight * 0.25}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.3"
          />

          <Path
            d={`M 0 ${screenHeight * 0.7} Q ${screenWidth * 0.4} ${screenHeight * 0.8} ${screenWidth * 0.7} ${screenHeight * 0.65} Q ${screenWidth * 0.9} ${screenHeight * 0.6} ${screenWidth} ${screenHeight * 0.75}`}
            fill="none"
            stroke={colors.accentSecondary}
            strokeWidth="0.8"
            opacity="0.25"
          />
        </G>

        {/* Floating particles with varied sizes */}
        <G opacity="0.7">
          {/* Premium particle distribution */}
          <Circle cx="120" cy="180" r="3" fill="url(#particleGlow)" />
          <Circle cx="280" cy="120" r="2" fill="url(#particleGlow)" />
          <Circle cx="350" cy="250" r="4" fill="url(#particleGlow)" />
          <Circle cx="80" cy="320" r="1.5" fill="url(#particleGlow)" />
          <Circle cx="300" cy="380" r="2.5" fill="url(#particleGlow)" />
          <Circle cx="180" cy="450" r="3.5" fill="url(#particleGlow)" />
          <Circle cx="50" cy="500" r="2" fill="url(#particleGlow)" />
          <Circle cx="320" cy="480" r="1.8" fill="url(#particleGlow)" />
          
          {/* Micro particles */}
          <Circle cx="150" cy="90" r="1" fill={colors.particles} opacity="0.6" />
          <Circle cx="250" cy="160" r="0.8" fill={colors.particles} opacity="0.5" />
          <Circle cx="380" cy="200" r="1.2" fill={colors.particles} opacity="0.7" />
          <Circle cx="60" cy="240" r="0.6" fill={colors.particles} opacity="0.4" />
          <Circle cx="330" cy="320" r="1" fill={colors.particles} opacity="0.6" />
        </G>

        {/* Sophisticated grid overlay with perspective */}
        <G opacity="0.04">
          {/* Perspective grid */}
          {Array.from({ length: Math.ceil(screenWidth / 60) }).map((_, i) => (
            <Path
              key={`perspective-v-${i}`}
              d={`M ${i * 60} 0 L ${i * 60 + 10} ${screenHeight}`}
              stroke={colors.particles}
              strokeWidth="0.3"
            />
          ))}
          {Array.from({ length: Math.ceil(screenHeight / 60) }).map((_, i) => (
            <Path
              key={`perspective-h-${i}`}
              d={`M 0 ${i * 60} L ${screenWidth} ${i * 60 + 5}`}
              stroke={colors.particles}
              strokeWidth="0.3"
            />
          ))}
        </G>

        {/* Glowing ambient orbs */}
        <G opacity="0.25">
          <Circle
            cx={screenWidth * 0.15}
            cy={screenHeight * 0.2}
            r="80"
            fill="url(#luxuryGlow1)"
          />
          <Circle
            cx={screenWidth * 0.85}
            cy={screenHeight * 0.6}
            r="100"
            fill="url(#luxuryGlow2)"
          />
          <Circle
            cx={screenWidth * 0.3}
            cy={screenHeight * 0.8}
            r="60"
            fill="url(#luxuryGlow1)"
          />
        </G>
      </Svg>

      {/* Animated floating elements with sophisticated movement */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 120,
          left: 80,
          transform: [
            { translateY: layer1 },
            { rotate: rotation1.interpolate({
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
            width: 12,
            height: 12,
            backgroundColor: colors.accent,
            opacity: 0.8,
            borderRadius: 2,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 8,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 200,
          right: 100,
          transform: [
            { translateY: layer2 },
            { rotate: rotation2.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-360deg']
            })},
            { scale: scale2 }
          ]
        }}
      >
        <View
          style={{
            width: 16,
            height: 4,
            backgroundColor: colors.accentSecondary,
            opacity: 0.9,
            shadowColor: colors.accentSecondary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 6,
            elevation: 6,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 180,
          left: 140,
          transform: [
            { translateY: layer3 },
            { rotate: rotation3.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })},
            { scale: scale3 }
          ],
          opacity: opacity2
        }}
      >
        <View
          style={{
            width: 14,
            height: 14,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.accentTertiary,
            borderRadius: 7,
            shadowColor: colors.accentTertiary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 10,
            elevation: 10,
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 350,
          right: 60,
          transform: [
            { translateY: layer1 },
            { rotate: rotation4.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-360deg']
            })}
          ]
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: colors.particles,
            opacity: 0.8,
            borderRadius: 4,
            shadowColor: colors.particles,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 12,
          }}
        />
      </Animated.View>

      {/* Content overlay with premium gradient */}
      <LinearGradient
        colors={[colors.overlay, 'transparent', colors.overlay]}
        locations={[0, 0.5, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default LuxuryPremiumBackground;
