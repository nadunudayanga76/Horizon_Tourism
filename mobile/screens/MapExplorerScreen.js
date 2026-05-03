import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { hotelService, transportService, residenceService } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import polyline from '@mapbox/polyline';

const { width, height } = Dimensions.get('window');

// Mock Geocoding Data for common Sri Lankan cities
const CITY_COORDS = {
  'colombo': { latitude: 6.9271, longitude: 79.8612 },
  'kandy': { latitude: 7.2906, longitude: 80.6337 },
  'galle': { latitude: 6.0535, longitude: 80.2210 },
  'negombo': { latitude: 7.2008, longitude: 79.8737 },
  'anuradhapura': { latitude: 8.3114, longitude: 80.4037 },
  'jaffna': { latitude: 9.6615, longitude: 80.0255 },
  'nuwara eliya': { latitude: 6.9497, longitude: 80.7891 },
  'ella': { latitude: 6.8724, longitude: 81.0470 },
  'bentota': { latitude: 6.4200, longitude: 80.0000 },
  'hikkaduwa': { latitude: 6.1395, longitude: 80.1063 },
  'mirissa': { latitude: 5.9483, longitude: 80.4716 },
  'sigiriya': { latitude: 7.9570, longitude: 80.7603 },
  'dambulla': { latitude: 7.8742, longitude: 80.6511 },
  'mabodale': { latitude: 7.1500, longitude: 80.0167 }, // Approximate
  'gampaha': { latitude: 7.0873, longitude: 79.9965 },
};

const MapExplorerScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const fetchRoute = async (start, end) => {
    try {
      setRouteCoords([]);
      
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline&annotations=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = polyline.decode(route.geometry);
        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        setRouteCoords(coords);
        
        const dist = route.distance / 1000;
        const duration = route.duration / 60;
        
        setDistanceInfo({
          distance: dist.toFixed(1),
          time: duration > 60 ? `${Math.floor(duration/60)}h ${Math.round(duration%60)}m` : `${Math.round(duration)}m`
        });

        // Super-accurate Map Fit
        mapRef.current?.fitToCoordinates([
          { latitude: start.latitude, longitude: start.longitude },
          ...coords,
          { latitude: end.latitude, longitude: end.longitude }
        ], {
          edgePadding: { top: 100, right: 100, bottom: 350, left: 100 },
          animated: true,
        });
      }
    } catch (error) {
      console.log('Routing Error:', error);
      setRouteCoords([{ latitude: start.latitude, longitude: start.longitude }, { latitude: end.latitude, longitude: end.longitude }]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Allow location access to see distance to places.');
        } else {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation(location.coords);
        }

        // Fetch Data
        const [hotelsRes, transRes] = await Promise.all([
          residenceService.getResidences(),
          transportService.getVehicles()
        ]);

        const hotelsData = hotelsRes.data.data || [];
        const transData = transRes.data.data || [];

        console.log('Map Raw Data:', hotelsData.length, 'hotels,', transData.length, 'vehicles');

        const hotels = hotelsData.map(h => ({ 
          ...h, 
          type: 'hotel', 
          priceLabel: `/ night`, 
          itemName: h.name,
          availability: h.availability !== undefined ? h.availability : true
        }));

        const trans = transData.map(v => ({ 
          ...v, 
          type: 'transport', 
          priceLabel: `/ day`, 
          itemName: v.vehicleModel,
          availability: v.availability !== undefined ? v.availability : true
        }));
        
        // Process markers with stable coordinates and overlap detection
        const coordCount = {};
        const allItems = [...hotels, ...trans].map((item, idx) => {
          const locStr = item.location || '';
          const locKey = locStr.toLowerCase().trim().split(',')[0];
          
          const idHash = (item._id || idx.toString()).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
          const offsetLat = (Math.abs(idHash % 100) / 100) - 0.5;
          const offsetLng = (Math.abs((idHash >> 2) % 100) / 100) - 0.5;

          let baseLat = CITY_COORDS[locKey]?.latitude || (6.9271 + offsetLat * 2);
          let baseLng = CITY_COORDS[locKey]?.longitude || (79.8612 + offsetLng * 2);
          
          // Overlap Handling: Spiral offset if same coordinate exists
          const coordKey = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
          if (!coordCount[coordKey]) {
            coordCount[coordKey] = 1;
          } else {
            const count = coordCount[coordKey];
            const angle = count * (2 * Math.PI / 8); // Spread in 8 directions
            const radius = 0.0005 * count; // Tiny offset (approx 50m)
            baseLat += Math.cos(angle) * radius;
            baseLng += Math.sin(angle) * radius;
            coordCount[coordKey]++;
          }

          return { ...item, coords: { latitude: baseLat, longitude: baseLng } };
        });

        const availableItems = allItems.filter(item => item.availability === true);
        setItems(availableItems);
        console.log('Final Items on Map (Available Only):', availableItems.length);
      } catch (error) {
        console.log('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const handleMarkerPress = (item) => {
    setSelectedItem(item);
    if (userLocation) {
      fetchRoute(userLocation, item.coords);
    }
  };

  const [tracksView, setTracksView] = useState(true);

  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => setTracksView(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [items]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e64e5" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Exploring the Horizon...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 7.8731,
          longitude: userLocation?.longitude || 80.7718,
          latitudeDelta: 3,
          longitudeDelta: 3,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {items.map((item, index) => (
          <Marker
            key={item._id || `item-${index}`}
            coordinate={item.coords}
            onPress={() => handleMarkerPress(item)}
            tracksViewChanges={tracksView}
          >
            <View style={[
              styles.markerContainer, 
              { backgroundColor: !item.availability ? '#94a3b8' : (item.type === 'hotel' ? '#e67e22' : '#2e64e5') }
            ]}>
              <Ionicons 
                name={item.type === 'hotel' ? 'bed' : 'car'} 
                size={18} 
                color="#fff" 
                style={{ opacity: !item.availability ? 0.6 : 1 }}
              />
            </View>
          </Marker>
        ))}

        {selectedItem && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#2e64e5"
            strokeWidth={5}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horizon Explorer</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Bottom Detail Card */}
      {selectedItem && (
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.closeCard} onPress={() => setSelectedItem(null)}>
            <Ionicons name="close-circle" size={24} color="#94a3b8" />
          </TouchableOpacity>
          
          <View style={styles.cardRow}>
            <Image 
              source={{ uri: selectedItem.image?.startsWith('http') ? selectedItem.image : 'https://via.placeholder.com/150' }} 
              style={styles.cardImage} 
            />
            <View style={styles.cardInfo}>
              <View style={styles.typeRow}>
                <Text style={styles.cardType}>{selectedItem.type?.toUpperCase()}</Text>
                <View style={[styles.miniStatus, { backgroundColor: selectedItem.availability ? '#2ecc71' : '#e74c3c' }]}>
                  <Text style={styles.miniStatusText}>{selectedItem.availability ? 'AVAILABLE' : 'UNAVAILABLE'}</Text>
                </View>
              </View>
              <Text style={styles.cardName}>{selectedItem.name || selectedItem.itemName}</Text>
              <Text style={styles.cardLocation}>
                <Ionicons name="location-sharp" size={14} color="#64748b" /> {selectedItem.location}
              </Text>
              
              <View style={styles.statsRow}>
                {distanceInfo && (
                  <>
                    <View style={styles.statItem}>
                      <Ionicons name="navigate-outline" size={14} color="#2e64e5" />
                      <Text style={styles.statText}>{distanceInfo.distance} km</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#2e64e5" />
                      <Text style={styles.statText}>{distanceInfo.time}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardPrice}>LKR {selectedItem.price?.toLocaleString()}</Text>
              <Text style={styles.priceSub}>{selectedItem.priceLabel}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.bookBtn, !selectedItem.availability && styles.disabledBtn]}
              disabled={!selectedItem.availability}
              onPress={() => {
                if (selectedItem.type === 'hotel') {
                  navigation.navigate('ResidenceDetail', { id: selectedItem._id });
                } else {
                  navigation.navigate('TransportBookingForm', { vehicle: selectedItem });
                }
              }}
            >
              <Text style={styles.bookBtnText}>{selectedItem.availability ? 'Book Now' : 'Unavailable'}</Text>
              {selectedItem.availability && <Ionicons name="chevron-forward" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fe' },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  backBtn: { padding: 5 },
  filterBtn: { padding: 5 },
  markerContainer: {
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  detailCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  closeCard: { position: 'absolute', top: -10, right: -10, zIndex: 10, backgroundColor: '#fff', borderRadius: 12 },
  cardRow: { flexDirection: 'row', marginBottom: 20 },
  cardImage: { width: 90, height: 90, borderRadius: 15, backgroundColor: '#f1f5f9' },
  cardInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  cardType: { fontSize: 10, fontWeight: 'bold', color: '#2e64e5', letterSpacing: 1 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniStatusText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  cardName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  cardLocation: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statText: { fontSize: 12, fontWeight: '600', color: '#2e64e5', marginLeft: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  priceSub: { fontSize: 10, color: '#94a3b8' },
  bookBtn: { backgroundColor: '#2e64e5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15 },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  bookBtnText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
});

export default MapExplorerScreen;
