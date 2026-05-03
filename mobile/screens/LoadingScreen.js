import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Use the existing app icon as logo - replace with horizon_logo.png once you copy it
const LOGO = require('../assets/images/horizon_logo.png');

const LoadingScreen = ({ navigation }) => {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.5)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textY          = useRef(new Animated.Value(25)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1           = useRef(new Animated.Value(0.4)).current;
  const dot2           = useRef(new Animated.Value(0.4)).current;
  const dot3           = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Step 1: Logo appear
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 35,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Brand name slide up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textY, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }),
      ]).start();
    }, 600);

    // Step 3: Tagline + dots appear
    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 950);

    // Step 4: Dots pulse
    const pulseDot = (dot, delay) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1.4, duration: 400, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.5, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    };

    pulseDot(dot1, 1100);
    pulseDot(dot2, 1300);
    pulseDot(dot3, 1500);

    // Step 5: Navigate to Welcome
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#071528', '#0f2a5c', '#1c3d8a']}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Background decorative circles */}
      <View style={[styles.circle, { width: 400, height: 400, top: -120, right: -100, opacity: 0.05 }]} />
      <View style={[styles.circle, { width: 280, height: 280, bottom: 20, left: -80, opacity: 0.06 }]} />
      <View style={[styles.circle, { width: 160, height: 160, top: height * 0.35, right: -30, opacity: 0.04 }]} />

      {/* Glow halo behind logo */}
      <View style={styles.glowHalo} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image source={LOGO} style={styles.logo} resizeMode="cover" />
      </Animated.View>

      {/* Brand name */}
      <Animated.Text
        style={[styles.brand, { opacity: textOpacity, transform: [{ translateY: textY }] }]}
      >
        HORIZON TOURISM
      </Animated.Text>

      {/* Tagline */}
      <Animated.View style={[styles.taglineRow, { opacity: taglineOpacity }]}>
        <View style={styles.divider} />
        <Text style={styles.tagline}>EXPLORE BEYOND LIMITS</Text>
        <View style={styles.divider} />
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: taglineOpacity }]}>
        <Animated.View style={[styles.dot, { transform: [{ scale: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ scale: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ scale: dot3 }] }]} />
      </Animated.View>

      {/* Footer */}
      <Animated.Text style={[styles.footer, { opacity: taglineOpacity }]}>
        Your Journey Begins Here
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  glowHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(80,140,255,0.35)',
    // soft glow via shadow
    shadowColor: '#5b8fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 15,
  },
  logoWrapper: {
    width: 170,
    height: 170,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 32,
    elevation: 20,
    shadowColor: '#2e64e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brand: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 14,
    textShadowColor: 'rgba(90,150,255,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  divider: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 10,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#5b8fff',
    marginHorizontal: 6,
    shadowColor: '#5b8fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 55,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
});

export default LoadingScreen;
