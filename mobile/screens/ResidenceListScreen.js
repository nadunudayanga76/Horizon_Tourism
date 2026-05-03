import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { residenceService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { getImageUrl } from '../utils/imageHelper';

const ResidenceListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [residences, setResidences] = useState([]);
  const [filteredResidences, setFilteredResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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
    filterData(text, selectedCategory);
  };

  const [selectedCategory, setSelectedCategory] = useState('All');

  const filterData = (text, cat) => {
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
    setFilteredResidences(filtered);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    filterData(search, cat);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ResidenceDetail', { id: item._id })}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: getImageUrl(item.image) }} 
          style={styles.image} 
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category || 'Hotel'}</Text>
        </View>
        <View style={[styles.availabilityBadge, { backgroundColor: item.availability ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.availabilityText}>{item.availability ? 'Available' : 'Unavailable'}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F7B731" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>LKR {item.price}<Text style={styles.perNight}> / {t('per_night')}</Text></Text>
          <View style={styles.bookNowBtn}>
             <Text style={styles.bookNowText}>{t('details')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#2e64e5" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          value={search}
          onChangeText={handleSearch}
        />
        {(user?.role === 'admin' || user?.role === 'reservation_manager') && (
          <TouchableOpacity 
            style={styles.addButtonIcon} 
            onPress={() => navigation.navigate('ManageResidences')}
          >
            <Ionicons name="settings" size={26} color="#2e64e5" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Hotel', 'Villa', 'Homestay'].map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterBtn, selectedCategory === cat && styles.filterBtnActive]}
              onPress={() => handleCategorySelect(cat)}
            >
              <Text style={[styles.filterBtnText, selectedCategory === cat && styles.filterBtnTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredResidences}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No residences found</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
  },
  addButtonIcon: {
    padding: 5,
  },
  list: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  categoryBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(46, 100, 229, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e64e5',
  },
  perNight: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  bookNowBtn: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookNowText: {
    color: '#2e64e5',
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterBtnActive: {
    backgroundColor: '#2e64e5',
    borderColor: '#2e64e5',
  },
  filterBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default ResidenceListScreen;
