import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { residenceService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageHelper';
import { LinearGradient } from 'expo-linear-gradient';

const ResidenceListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [residences, setResidences] = useState([]);
  const [filteredResidences, setFilteredResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const fetchResidences = async () => {
    try {
      const response = await residenceService.getResidences();
      setResidences(response.data.data);
      setFilteredResidences(response.data.data);
    } catch (error) {
      console.log('Error fetching residences:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchResidences();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchResidences();
  };

  const handleSearch = (text) => {
    setSearch(text);
    filterData(text, selectedCategory, onlyAvailable);
  };

  const filterData = (text, cat, available) => {
    let filtered = residences;
    if (text) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(text.toLowerCase()) || 
        item.location.toLowerCase().includes(text.toLowerCase())
      );
    }
    if (cat !== 'All') {
      filtered = filtered.filter(item => item.category === cat);
    }
    if (available) {
      filtered = filtered.filter(item => item.availability === true);
    }
    setFilteredResidences(filtered);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    filterData(search, cat, onlyAvailable);
  };

  const toggleAvailable = () => {
    const newState = !onlyAvailable;
    setOnlyAvailable(newState);
    filterData(search, selectedCategory, newState);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ResidenceDetail', { id: item._id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: getImageUrl(item.image) }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
        <View style={styles.badgeContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'Hotel'}</Text>
          </View>
          <View style={[styles.availBadge, { backgroundColor: item.availability ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.availText}>{item.availability ? 'Available' : 'Booked'}</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceSymbol}>LKR</Text>
          <Text style={styles.priceAmount}>{item.price.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.cardInfo}>
        <View style={styles.infoTop}>
          <Text style={styles.resName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={14} color="#f1c40f" />
            <Text style={styles.ratingVal}>4.8</Text>
          </View>
        </View>
        
        <View style={styles.locRow}>
          <Ionicons name="location" size={14} color="#64748b" />
          <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.amenities}>
            <Ionicons name="wifi" size={16} color="#cbd5e1" style={{marginRight: 8}} />
            <Ionicons name="restaurant" size={16} color="#cbd5e1" style={{marginRight: 8}} />
            <Ionicons name="snow" size={16} color="#cbd5e1" />
          </View>
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('ResidenceDetail', { id: item._id })}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#34495e" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Reservation Booking</Text>
              <Text style={styles.headerSub}>Find your perfect stay in paradise</Text>
            </View>
            {(user?.role === 'admin' || user?.role === 'reservation_manager') && (
              <TouchableOpacity 
                style={styles.settingsBtn} 
                onPress={() => navigation.navigate('ManageResidences')}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hotels, villas, or location..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={handleSearch}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity 
              style={[styles.filterChip, onlyAvailable && styles.availableChipActive]}
              onPress={toggleAvailable}
            >
              <Ionicons name="flash" size={14} color={onlyAvailable ? "#fff" : "#2ecc71"} style={{marginRight: 6}} />
              <Text style={[styles.filterChipText, onlyAvailable && styles.activeChipText]}>Available Only</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {['All', 'Hotel', 'Villa', 'Homestay'].map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.filterChip, selectedCategory === cat && styles.activeChip]}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat && styles.activeChipText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#34495e" />
          <Text style={styles.loaderText}>Searching for properties...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResidences}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34495e" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="business-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { 
    padding: 25, 
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#fff',
    letterSpacing: 0.5
  },
  headerSub: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.7)', 
    fontWeight: '600'
  },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  filterScroll: { marginBottom: 10 },
  filterContent: { paddingRight: 20, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center'
  },
  divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 10 },
  availableChipActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  activeChip: { backgroundColor: '#fff', borderColor: '#fff' },
  filterChipText: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 13 },
  activeChipText: { color: '#34495e' },
  listContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    marginBottom: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  imageWrapper: { position: 'relative', height: 220 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  badgeContainer: { 
    position: 'absolute', 
    top: 15, 
    left: 15, 
    right: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  categoryBadge: {
    backgroundColor: 'rgba(52, 73, 94, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  availBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  availText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  priceTag: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5
  },
  priceSymbol: { fontSize: 10, color: '#94a3b8', fontWeight: '800', marginRight: 4 },
  priceAmount: { fontSize: 16, fontWeight: '900', color: '#34495e' },
  cardInfo: { padding: 20 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resName: { fontSize: 20, fontWeight: '900', color: '#1e293b', flex: 1, marginRight: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingVal: { marginLeft: 4, fontSize: 13, fontWeight: '900', color: '#d4af37' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locText: { fontSize: 14, color: '#64748b', marginLeft: 6, fontWeight: '600' },
  cardDesc: { 
    fontSize: 13, 
    color: '#475569', 
    marginTop: 12, 
    lineHeight: 18,
    fontWeight: '400'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  amenities: { flexDirection: 'row', alignItems: 'center' },
  detailsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  detailsBtnText: { color: '#34495e', fontWeight: '800', fontSize: 13, marginRight: 5 },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8, fontWeight: '500' }
});

export default ResidenceListScreen;
