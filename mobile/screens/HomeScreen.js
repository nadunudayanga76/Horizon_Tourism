import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, FlatList, SafeAreaView, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';
import { reelService } from '../services/api';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { UPLOAD_URL } from '../utils/config';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { user } = useContext(AuthContext);
  const { t, language, changeLanguage } = useContext(LanguageContext);
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [selectedReel, setSelectedReel] = useState(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  // --- Dynamic Slider Data ---
  const SLIDER_DATA = [
    {
      id: '1',
      title: t('luxury_hotels'),
      subtitle: t('premium_rides'),
      image: require('../assets/images/slider_hotel.png'),
      route: 'Hotels',
    },
    {
      id: '2',
      title: t('tour_guides'),
      subtitle: t('premium_rides'),
      image: require('../assets/images/slider_guide.png'),
      route: 'Guides',
    },
    {
      id: '3',
      title: t('taxi_service'),
      subtitle: t('premium_rides'),
      image: require('../assets/images/slider_transport.png'),
      route: 'Transport',
    },
  ];

  // --- Dynamic Services Grid Data ---
  const SERVICES = [
    { id: '1', name: t('messages'), icon: 'chatbubble-ellipses', color: '#3498db', route: null },
    { id: '2', name: t('hotels'), icon: 'bed', color: '#e67e22', route: 'Hotels' },
    { id: '3', name: t('drivers'), icon: 'id-card', color: '#e74c3c', route: 'Drivers' },
    { id: '4', name: t('explorer'), icon: 'map', color: '#27ae60', route: 'MapExplorer' },
    { id: '5', name: t('taxi'), icon: 'car', color: '#f1c40f', route: 'Transport' },
    { id: '6', name: t('guides'), icon: 'people', color: '#9b59b6', route: 'Guides' },
    { id: '7', name: t('bookings'), icon: 'calendar', color: '#34495e', route: 'BookingsTab' },
    { id: '8', name: t('profile'), icon: 'person', color: '#2ecc71', route: 'Profile' },
  ];

  // Live Location & Weather State
  const [locationName, setLocationName] = useState('Fetching Location...');
  const [regionName, setRegionName] = useState('Sri Lanka');
  const [weatherTemp, setWeatherTemp] = useState('--');
  const [weatherDesc, setWeatherDesc] = useState('Loading...');
  const [weatherIcon, setWeatherIcon] = useState('partly-sunny');

  // Auto Slider Logic
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= SLIDER_DATA.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReels();
    setTimeout(() => setRefreshing(false), 2000);
  };

  const fetchReels = async () => {
    try {
      const response = await reelService.getReels();
      if (response.data.success) {
        setReels(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching reels:', error);
    } finally {
      setReelsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Fetch Live Location & Weather
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Location Access Denied');
          setWeatherDesc('Cannot fetch weather');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Reverse Geocoding for City Name
        let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          setLocationName(geocode[0].city || geocode[0].district || 'Unknown Location');
          setRegionName(geocode[0].region || 'Sri Lanka');
        }

        // Fetch Weather from Open-Meteo
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherRes = await axios.get(weatherUrl);
        const currentW = weatherRes.data.current_weather;
        
        setWeatherTemp(`${currentW.temperature}°C`);

        const code = currentW.weathercode;
        if (code === 0) { setWeatherDesc('Clear sky'); setWeatherIcon('sunny'); }
        else if (code >= 1 && code <= 3) { setWeatherDesc('Partly cloudy'); setWeatherIcon('partly-sunny'); }
        else if (code >= 45 && code <= 48) { setWeatherDesc('Fog'); setWeatherIcon('cloudy'); }
        else if (code >= 51 && code <= 67) { setWeatherDesc('Rain'); setWeatherIcon('rainy'); }
        else if (code >= 71 && code <= 77) { setWeatherDesc('Snow'); setWeatherIcon('snow'); }
        else if (code >= 95 && code <= 99) { setWeatherDesc('Thunderstorm'); setWeatherIcon('thunderstorm'); }
        else { setWeatherDesc('Cloudy'); setWeatherIcon('cloud'); }
        
      } catch (error) {
        console.log('Error fetching location/weather:', error);
        setLocationName('Sri Lanka');
        setWeatherDesc('Weather unavailable');
      }
    })();
  }, []);

  const renderSlide = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate(item.route)}>
      <View style={styles.slideContainer}>
        <Image source={item.image} style={styles.slideImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.slideGradient}
        >
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceItem} 
      onPress={() => {
        const isManager = user?.role && user.role !== 'customer';
        if (item.route === 'BookingsTab' && isManager) {
          // Managers should not see the normal user bookings page here
          alert('Managers, please use the Finance Dashboard to manage bookings.');
          return;
        }
        if (item.route) {
          navigation.navigate(item.route);
        } else {
          alert('Coming Soon!');
        }
      }}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.curve} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a23e0']} />
          }
        >
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Horizon Tourism</Text>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={() => setLangModalVisible(true)}>
                <Ionicons name="globe-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profilePicPlaceholder} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.profileInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sliderWrapper}>
            <FlatList
              ref={flatListRef}
              data={SLIDER_DATA}
              renderItem={renderSlide}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.floor(event.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              }}
            />
            <View style={styles.pagination}>
              {SLIDER_DATA.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index ? styles.activeDot : null,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.widgetContainer}>
            <View style={styles.widgetLeft}>
              <View style={styles.locationIconBg}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle}>{locationName}</Text>
                <Text style={styles.locationSubtitle}>{regionName}</Text>
              </View>
            </View>
            <View style={styles.widgetRight}>
              <View style={styles.weatherRow}>
                <Ionicons name={weatherIcon} size={20} color="#3498db" />
                <Text style={styles.tempText}>{weatherTemp}</Text>
              </View>
              <Text style={styles.weatherSub}>{weatherDesc}</Text>
            </View>
          </View>

          <View style={styles.contentWrapper}>
            {/* How to Book Section */}
            <View style={styles.howToBookSection}>
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={styles.sectionTitle}>How to Book</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 15 }}>
              <View style={styles.stepCard}>
                <View style={[styles.stepIconBg, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="search" size={24} color="#4f46e5" />
                </View>
                <Text style={styles.stepTitle}>1. Discover</Text>
                <Text style={styles.stepDesc}>Find hotels, guides, and rides.</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={[styles.stepIconBg, { backgroundColor: '#fce7f3' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#db2777" />
                </View>
                <Text style={styles.stepTitle}>2. Choose</Text>
                <Text style={styles.stepDesc}>Select dates & your preferences.</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={[styles.stepIconBg, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#16a34a" />
                </View>
                <Text style={styles.stepTitle}>3. Confirm</Text>
                <Text style={styles.stepDesc}>Review and book instantly.</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={[styles.stepIconBg, { backgroundColor: '#ffedd5' }]}>
                  <Ionicons name="airplane-outline" size={24} color="#ea580c" />
                </View>
                <Text style={styles.stepTitle}>4. Enjoy</Text>
                <Text style={styles.stepDesc}>Relax while we handle the rest.</Text>
              </View>
            </ScrollView>
          </View>

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>{t('services')}</Text>
            <View style={styles.servicesGrid}>
              {SERVICES.map((item) => (
                <View key={item.id} style={{ width: '25%', alignItems: 'center' }}>
                  {renderServiceItem({ item })}
                </View>
              ))}
            </View>
          </View>

          {/* --- Reels Section --- */}
          <View style={styles.reelsSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Travel Diaries</Text>
            {reelsLoading ? (
              <ActivityIndicator color="#0a23e0" style={{ marginVertical: 20 }} />
            ) : reels.length > 0 ? (
              <FlatList
                data={reels}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.reelCard} 
                    onPress={() => {
                      setSelectedReel(item);
                      setIsPlayerVisible(true);
                    }}
                  >
                    <View style={styles.reelVideoPlaceholder}>
                      {/* Paused preview video or thumbnail */}
                      <Video
                        source={{ uri: `${UPLOAD_URL}/${item.videoUrl}` }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.reelGradient}
                      >
                        <BlurView intensity={40} tint="light" style={styles.glassPlayIcon}>
                          <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 3 }} />
                        </BlurView>
                        <View style={styles.reelInfo}>
                          <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              />
            ) : (
              <View style={styles.emptyReels}>
                <Ionicons name="videocam-outline" size={40} color="#ccc" />
                <Text style={styles.emptyReelsText}>No reels yet. Share your journey!</Text>
              </View>
            )}
          </View>
        </View>

          {/* Language Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={langModalVisible}
            onRequestClose={() => setLangModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.langModalContent}>
                <Text style={styles.langModalTitle}>{t('select_language')}</Text>
                
                {[
                  { id: 'en', name: 'English', icon: '🇺🇸' },
                  { id: 'si', name: 'සිංහල', icon: '🇱🇰' },
                  { id: 'ta', name: 'தமிழ்', icon: '🇱🇰' }
                ].map((lang) => (
                  <TouchableOpacity 
                    key={lang.id} 
                    style={[styles.langOption, language === lang.id && styles.langOptionActive]}
                    onPress={() => {
                      changeLanguage(lang.id);
                      setLangModalVisible(false);
                    }}
                  >
                    <Text style={styles.langIcon}>{lang.icon}</Text>
                    <Text style={[styles.langText, language === lang.id && styles.langTextActive]}>{lang.name}</Text>
                    {language === lang.id && <Ionicons name="checkmark-circle" size={20} color="#0a23e0" />}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity style={styles.closeLangBtn} onPress={() => setLangModalVisible(false)}>
                  <Text style={styles.closeLangBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Fullscreen Video Player Modal */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={isPlayerVisible}
            onRequestClose={() => setIsPlayerVisible(false)}
          >
            <View style={styles.playerContainer}>
              {selectedReel && (
                <>
                  <Video
                    source={{ uri: `${UPLOAD_URL}/${selectedReel.videoUrl}` }}
                    style={styles.fullscreenVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={true}
                    isLooping
                    useNativeControls
                  />
                  
                  <TouchableOpacity 
                    style={styles.closePlayerBtn} 
                    onPress={() => setIsPlayerVisible(false)}
                  >
                    <Ionicons name="close-circle" size={40} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.playerOverlay}>
                    <Text style={styles.playerTitle}>{selectedReel.title}</Text>
                    <Text style={styles.playerDesc}>{selectedReel.description}</Text>
                  </View>
                </>
              )}
            </View>
          </Modal>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: '#34495e',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  curve: {
    // Optional: decorative curve style
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffcdd2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
  },
  sliderWrapper: {
    height: 220,
    marginTop: 10,
  },
  slideContainer: {
    width: width,
    height: 200,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  slideGradient: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: '50%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'flex-end',
    padding: 20,
  },
  slideTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  slideSubtitle: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#0a23e0',
  },
  widgetContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  widgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconBg: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#ff7675',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 15,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  locationSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  widgetRight: {
    alignItems: 'flex-end',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  weatherSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  servicesSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceItem: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
  },
  langModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  langOptionActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#0a23e0',
  },
  langIcon: { fontSize: 24, marginRight: 15 },
  langText: { fontSize: 16, color: '#475569', flex: 1, fontWeight: '600' },
  langTextActive: { color: '#0a23e0', fontWeight: 'bold' },
  closeLangBtn: {
    marginTop: 10,
    padding: 10,
  },
  closeLangBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
  },

  // Reels Styles
  reelsSection: {
    marginTop: 25,
  },
  reelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    color: '#0a23e0',
    fontWeight: '600',
    fontSize: 14,
  },
  reelCard: {
    width: 140,
    height: 250,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  reelVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassPlayIcon: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reelGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'flex-end',
  },
  reelInfo: {
    zIndex: 2,
  },
  reelTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  reelUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff7675',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  reelAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reelUserName: {
    color: '#eee',
    fontSize: 10,
    fontWeight: '600',
  },
  playIcon: {
    position: 'absolute',
    top: '40%',
    left: '35%',
    opacity: 0.8,
  },
  emptyReels: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyReelsText: {
    marginTop: 10,
    color: '#999',
    fontSize: 13,
  },

  // Player Styles
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fullscreenVideo: {
    flex: 1,
  },
  closePlayerBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  playerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerDesc: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  playerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  playerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff7675',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerUserName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentWrapper: {
    backgroundColor: '#f8f9fa',
    flex: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  howToBookSection: {
    marginTop: 35,
    marginBottom: 10,
  },
  stepCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginTop: 5,
  },
  stepIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
});

export default HomeScreen;
