import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/welcome_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.brandName}>Horizon Tourism</Text>
              <View style={styles.taglineRow}>
                <View style={styles.line} />
                <Text style={styles.tagline}>EXPLORE THE UNSEEN</Text>
                <View style={styles.line} />
              </View>
            </View>

            <View style={styles.qrMessageContainer}>
              <BlurView intensity={30} tint="light" style={styles.blurBox}>
                <Ionicons name="qr-code-outline" size={24} color="#fff" />
                <Text style={styles.qrText}>Successfully scanned. Entry authorized.</Text>
              </BlurView>
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2e64e5', '#1a3c8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Discover premium hotels, transport, and expert guides in one place.
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  content: {
    paddingHorizontal: 30,
  },
  header: {
    marginBottom: 40,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 1,
  },
  brandName: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 15,
    letterSpacing: 3,
  },
  qrMessageContainer: {
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  blurBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qrText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default WelcomeScreen;
