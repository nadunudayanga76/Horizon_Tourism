import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Image, TextInput, ScrollView } from 'react-native';
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

    // Filter by Search
    if (searchQuery) {
      result = result.filter(v => 
        v.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by Type/Status
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: getImageUrl(item.image) }} 
          style={styles.cardImage} 
        />
        <View style={[styles.statusBadge, { backgroundColor: (item.availability && !item.maintenance) ? '#2ecc71' : '#e74c3c' }]}>
          <Text style={styles.statusBadgeText}>
            {(item.availability && !item.maintenance) ? t('available').toUpperCase() : t('unavailable').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <Text style={styles.typeTag}>{item.vehicleType}</Text>
            <Text style={styles.modelName}>{item.vehicleModel}</Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceValue}>LKR {item.price}</Text>
            <Text style={styles.priceUnit}>/ {t('per_day')}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="barcode-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.vehicleNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.mobileNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name={getVehicleIcon(item.vehicleType)} size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.vehicleType}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.bookButton, (!item.availability || item.maintenance) && styles.disabledButton]} 
          onPress={() => handleBooking(item)}
          disabled={!item.availability || item.maintenance}
        >
          <Text style={styles.bookButtonText}>
            {(item.availability && !item.maintenance) ? t('book_now') : t('unavailable')}
          </Text>
          {(item.availability && !item.maintenance) && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2e64e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('find_transport')}</Text>
            <Text style={styles.headerSub}>{t('premium_rides')}</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput}
            placeholder={t('search')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
      </View>

      <FlatList
        data={filteredVehicles}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No vehicles available right now</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fe',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fe',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  filterWrapper: {
    marginTop: -20,
    zIndex: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilterChip: {
    backgroundColor: '#2e64e5',
    borderColor: '#2e64e5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingTop: 10,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#e2e8f0',
  },
  cardContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleArea: {
    flex: 1,
    paddingRight: 15,
  },
  typeTag: {
    fontSize: 12,
    color: '#2e64e5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  priceTag: {
    alignItems: 'flex-end',
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 12,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e64e5',
  },
  priceUnit: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 15,
  },
  detailItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2e64e5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    elevation: 0,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 15,
    fontWeight: '500',
  }
});

export default TransportListScreen;
