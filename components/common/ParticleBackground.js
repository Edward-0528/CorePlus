import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Particle = ({ delay, duration, translateX, translateY, opacity, scale }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }).start(() => {
        // Restart animation
        setTimeout(animate, Math.random() * 2000);
      });
    };
    
    animate();
  }, [animatedValue, delay, duration]);

  const translateXAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [translateX.start, translateX.end],
  });

  const translateYAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [translateY.start, translateY.end],
  });

  const opacityAnim = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, opacity, opacity, 0],
  });

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [scale.start, scale.peak, scale.end],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 3,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 1.5,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        transform: [
          { translateX: translateXAnim },
          { translateY: translateYAnim },
          { scale: scaleAnim },
        ],
        opacity: opacityAnim,
      }}
    />
  );
};

const ParticleBackground = () => {
  // Generate stardust configurations
  const particles = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    delay: Math.random() * 5000,
    duration: 12000 + Math.random() * 8000,
    translateX: {
      start: Math.random() * screenWidth,
      end: Math.random() * screenWidth,
    },
    translateY: {
      start: screenHeight + 50,
      end: -50,
    },
    opacity: 0.3 + Math.random() * 0.5,
    scale: {
      start: 0.3 + Math.random() * 0.4,
      peak: 0.8 + Math.random() * 0.6,
      end: 0.2 + Math.random() * 0.3,
    },
  }));

  return (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      backgroundColor: '#000510', // Deep space blue-black
    }}>
      {/* Galaxy Gradient Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
      }}>
        {/* Create deep space gradient effect */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: screenHeight * 0.3,
          backgroundColor: 'rgba(16, 20, 40, 0.8)', // Deep purple-blue
        }} />
        <View style={{
          position: 'absolute',
          top: screenHeight * 0.2,
          left: 0,
          right: 0,
          height: screenHeight * 0.4,
          backgroundColor: 'rgba(8, 15, 35, 0.9)', // Darker space
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: screenHeight * 0.4,
          backgroundColor: 'rgba(5, 10, 25, 0.95)', // Almost black space
        }} />
        {/* Galaxy center glow */}
        <View style={{
          position: 'absolute',
          top: screenHeight * 0.3,
          left: screenWidth * 0.2,
          width: screenWidth * 0.6,
          height: screenHeight * 0.4,
          backgroundColor: 'rgba(75, 50, 120, 0.08)', // Purple galaxy glow
          borderRadius: screenWidth * 0.6,
        }} />
      </View>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          duration={particle.duration}
          translateX={particle.translateX}
          translateY={particle.translateY}
          opacity={particle.opacity}
          scale={particle.scale}
        />
      ))}

      {/* Galaxy Elements */}
      <GalaxySystem />
    </View>
  );
};

const GalaxySystem = () => {
  return (
    <>
      <Stars />
      <NebulaClouds />
      <CosmicDust />
    </>
  );
};

// Twinkling Stars
const Stars = () => {
  const stars = Array.from({ length: 50 }, (_, index) => ({
    id: index,
    size: 1 + Math.random() * 3,
    left: Math.random() * screenWidth,
    top: Math.random() * screenHeight,
    opacity: 0.3 + Math.random() * 0.7,
    twinkleDuration: 2000 + Math.random() * 4000,
    delay: Math.random() * 3000,
  }));

  return (
    <>
      {stars.map((star) => (
        <TwinklingStar key={star.id} {...star} />
      ))}
    </>
  );
};

const TwinklingStar = ({ size, left, top, opacity, twinkleDuration, delay }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: twinkleDuration / 2,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: twinkleDuration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    setTimeout(animate, delay);
  }, [animatedValue, twinkleDuration, delay]);

  const opacityAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [opacity * 0.3, opacity],
  });

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left,
        top: top,
        width: size,
        height: size,
        backgroundColor: '#ffffff',
        borderRadius: size / 2,
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size * 2,
      }}
    />
  );
};

// Nebula Clouds
const NebulaClouds = () => {
  const nebulas = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    width: 120 + Math.random() * 200,
    height: 80 + Math.random() * 120,
    left: Math.random() * screenWidth,
    top: Math.random() * screenHeight,
    color: [
      'rgba(147, 51, 234, 0.15)', // Purple
      'rgba(59, 130, 246, 0.12)',  // Blue
      'rgba(236, 72, 153, 0.10)',  // Pink
      'rgba(139, 92, 246, 0.13)',  // Indigo
      'rgba(99, 102, 241, 0.11)',  // Violet
      'rgba(168, 85, 247, 0.14)',  // Purple-pink
    ][index % 6],
    duration: 20000 + Math.random() * 15000,
  }));

  return (
    <>
      {nebulas.map((nebula) => (
        <NebulaCloud key={nebula.id} {...nebula} />
      ))}
    </>
  );
};

const NebulaCloud = ({ width, height, left, top, color, duration }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ).start();
    };
    
    animate();
  }, [animatedValue, duration]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const rotateAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left,
        top: top,
        width: width,
        height: height,
        backgroundColor: color,
        borderRadius: width / 2,
        transform: [
          { translateX },
          { scale: scaleAnim },
          { rotate: rotateAnim },
        ],
      }}
    />
  );
};

// Cosmic Dust
const CosmicDust = () => {
  const dustParticles = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    size: 0.5 + Math.random() * 1.5,
    left: Math.random() * screenWidth,
    top: Math.random() * screenHeight,
    opacity: 0.2 + Math.random() * 0.4,
    driftSpeed: 15000 + Math.random() * 20000,
    delay: Math.random() * 5000,
  }));

  return (
    <>
      {dustParticles.map((dust) => (
        <DustParticle key={dust.id} {...dust} />
      ))}
    </>
  );
};

const DustParticle = ({ size, left, top, opacity, driftSpeed, delay }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: driftSpeed,
        delay: delay,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(animate, Math.random() * 3000);
      });
    };
    
    animate();
  }, [animatedValue, driftSpeed, delay]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (Math.random() - 0.5) * 100],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  const opacityAnim = animatedValue.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, opacity, opacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left,
        top: top,
        width: size,
        height: size,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: size / 2,
        transform: [
          { translateX },
          { translateY },
        ],
        opacity: opacityAnim,
      }}
    />
  );
};

export default ParticleBackground;
