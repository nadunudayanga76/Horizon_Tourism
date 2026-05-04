import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Image, TextInput, ScrollView, SafeAreaView, Platform } from 'react-native';
import { transportService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LanguageContext } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageHelper';

const TransportListScreen = () => {
  const navigation = useNavigation();
  const { t } = useContext(LanguageContext);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchVehicles = async () => {
    try {
      const response = await transportService.getVehicles();
      setVehicles(response.data.data);
      setFilteredVehicles(response.data.data);
    } catch (error) {
      console.log('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    let result = vehicles;
    if (searchQuery) {
      result = result.filter(v => 
        v.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilter === 'Available') {
      result = result.filter(v => v.availability && !v.maintenance);
    } else if (activeFilter !== 'All') {
      result = result.filter(v => v.vehicleType.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    setFilteredVehicles(result);
  }, [searchQuery, activeFilter, vehicles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, []);

  const handleBooking = (item) => {
    navigation.navigate('TransportBookingForm', { vehicle: item });
  };

  const getVehicleIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('van')) return 'bus';
    if (t.includes('bike')) return 'bicycle';
    if (t.includes('suv')) return 'car';
    return 'car-sport';
  };

  const renderItem = ({ item }) => {
    const isAvailable = item.availability && !item.maintenance;
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.95}
        onPress={() => isAvailable && handleBooking(item)}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: getImageUrl(item.image) }} style={styles.cardImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
          <View style={[styles.statusBadge, { backgroundColor: isAvailable ? '#2ecc71' : '#e74c3c' }]}>
            <Text style={styles.statusBadgeText}>
              {isAvailable ? t('available').toUpperCase() : t('unavailable').toUpperCase()}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceSymbol}>LKR</Text>
            <Text style={styles.priceText}>{item.price?.toLocaleString()}</Text>
            <Text style={styles.priceUnit}>/ day</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.vehicleType}>{item.vehicleType}</Text>
              <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name={getVehicleIcon(item.vehicleType)} size={22} color="#34495e" />
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#94a3b8" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>

          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Ionicons name="barcode-outline" size={14} color="#64748b" />
              <Text style={styles.featureText}>{item.vehicleNumber}</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={14} color="#64748b" />
              <Text style={styles.featureText}>{item.vehicleType.includes('Van') ? '12 Seats' : '5 Seats'}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionBtn, !isAvailable && styles.disabledBtn]} 
            onPress={() => handleBooking(item)}
            disabled={!isAvailable}
          >
            <LinearGradient 
              colors={isAvailable ? ['#34495e', '#2c3e50'] : ['#cbd5e1', '#94a3b8']} 
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>{isAvailable ? t('book_now') : t('unavailable')}</Text>
              {isAvailable && <Ionicons name="chevron-forward" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>{t('find_transport')}</Text>
              <Text style={styles.headerSub}>{t('premium_rides')}</Text>
            </View>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput}
              placeholder={t('search_locations_models')}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterScroll}
            style={styles.filterContainer}
          >
            {['All', 'Available', 'Car', 'Van', 'SUV', 'Bike'].map(filter => (
              <TouchableOpacity 
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#34495e" />
          <Text style={styles.loaderText}>Loading your rides...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="car-sport-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No rides found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 15,
    color: '#64748b',
    fontWeight: '600'
  },
  header: {
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  notifDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    borderWidth: 1.5,
    borderColor: '#34495e'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    borderRadius: 18,
    height: 55,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500'
  },
  filterContainer: {
    marginTop: 20,
    marginBottom: 5
  },
  filterScroll: {
    paddingRight: 20
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  activeFilterChip: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    elevation: 5
  },
  filterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  activeFilterText: {
    color: '#34495e',
  },
  listContainer: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    marginBottom: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  imageWrapper: {
    height: 230,
    width: '100%',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%'
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  priceContainer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  priceSymbol: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4
  },
  priceText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900'
  },
  priceUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600'
  },
  cardInfo: {
    padding: 25,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  vehicleType: {
    fontSize: 11,
    color: '#34495e',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2
  },
  vehicleModel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  locationText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600'
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 20,
    marginBottom: 25
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginLeft: 8
  },
  featureDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10
  },
  actionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#34495e',
    shadowOpacity: 0.3
  },
  btnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  disabledBtn: {
    elevation: 0,
    opacity: 0.7
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 8
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 20
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '500'
  }
});

export default TransportListScreen;
