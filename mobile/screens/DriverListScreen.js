import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Image, Linking, ScrollView } from 'react-native';
import { driverService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DriverListScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState('Available');
  const [filterExperience, setFilterExperience] = useState('All');

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getDrivers();
      setDrivers(response.data.data);
    } catch (error) {
      console.log('Error fetching drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDrivers();
  }, []);

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.image && item.image !== 'default-driver.png' ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#cbd5e1" />
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: item.available ? '#2ecc71' : '#e74c3c' }]} />
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.driverName}>{item.name}</Text>
          <View style={styles.experienceTag}>
            <Ionicons name="ribbon-outline" size={12} color="#2e64e5" />
            <Text style={styles.experienceText}>{item.experience} Experience</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>LKR {item.price}</Text>
          <Text style={styles.priceUnit}>/ day</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="id-card-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>{item.licenseNo}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="call-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>{item.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.callButton} 
          onPress={() => handleCall(item.phone)}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.callButtonText}>Contact Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => Alert.alert('Driver Info', `ID: ${item.idNo}\nEmail: ${item.email || 'N/A'}`)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
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
        <Text style={styles.headerTitle}>Professional Drivers</Text>
        <Text style={styles.headerSub}>Experienced chauffeurs for your safety</Text>
      </LinearGradient>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, filterAvailable === 'Available' && styles.activeChip]} 
            onPress={() => setFilterAvailable('Available')}
          >
            <Text style={[styles.filterText, filterAvailable === 'Available' && styles.activeFilterText]}>Available Only</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterAvailable === 'All' && styles.activeChip]} 
            onPress={() => setFilterAvailable('All')}
          >
            <Text style={[styles.filterText, filterAvailable === 'All' && styles.activeFilterText]}>All Status</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {['All Exp', '3+ Years', '5+ Years', '10+ Years'].map(exp => {
            const val = exp === 'All Exp' ? 'All' : exp.split(' ')[0];
            return (
              <TouchableOpacity 
                key={exp}
                style={[styles.filterChip, filterExperience === val && styles.activeChip]} 
                onPress={() => setFilterExperience(val)}
              >
                <Text style={[styles.filterText, filterExperience === val && styles.activeFilterText]}>{exp}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={drivers.filter(d => {
          if (filterAvailable === 'Available' && !d.available) return false;
          const exp = parseInt(d.experience) || 0;
          if (filterExperience === '3+' && exp < 3) return false;
          if (filterExperience === '5+' && exp < 5) return false;
          if (filterExperience === '10+' && exp < 10) return false;
          return true;
        })}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No drivers available at the moment</Text>
          </View>
        }
      />
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
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 25,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  filterSection: {
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: {
    backgroundColor: '#2e64e5',
    borderColor: '#2e64e5',
  },
  filterText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#cbd5e1',
    marginRight: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  experienceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  experienceText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e64e5',
  },
  priceUnit: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  cardBody: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  callButton: {
    flex: 0.65,
    backgroundColor: '#2e64e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
    elevation: 2,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailsButton: {
    flex: 0.3,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
  },
  detailsButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 15,
    fontWeight: '500',
  }
});

export default DriverListScreen;
