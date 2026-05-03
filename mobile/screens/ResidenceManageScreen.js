import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { residenceService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const ResidenceManageScreen = ({ navigation }) => {
  const [residences, setResidences] = useState([]);
  const [filteredResidences, setFilteredResidences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  const categories = ['All', 'Hotel', 'Villa', 'Homestay', 'Available', 'Booked'];

  const fetchResidences = async () => {
    try {
      const response = await residenceService.getResidences();
      setResidences(response.data.data);
      setFilteredResidences(response.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = {
    available: residences.filter(r => r.availability !== false).length,
    unavailable: residences.filter(r => r.availability === false).length,
    hotels: residences.filter(r => (r.category || '').toLowerCase().includes('hotel')).length,
    villas: residences.filter(r => (r.category || '').toLowerCase().includes('villa')).length,
    homestays: residences.filter(r => (r.category || '').toLowerCase().includes('homestay')).length,
    total: residences.length
  };

  useEffect(() => {
    fetchResidences();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResidences();
  };

  useEffect(() => {
    let result = residences;
    
    if (selectedFilter !== 'All') {
      if (selectedFilter === 'Available') {
        result = result.filter(r => r.availability !== false);
      } else if (selectedFilter === 'Booked') {
        result = result.filter(r => r.availability === false);
      } else {
        result = result.filter(r => (r.category || '').toLowerCase().includes(selectedFilter.toLowerCase()));
      }
    }
    
    if (searchQuery) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredResidences(result);
  }, [searchQuery, selectedFilter, residences]);

  const handleDelete = (id) => {
    Alert.alert('Delete Property', 'Are you sure you want to remove this property?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: async () => {
          try {
            await residenceService.deleteResidence(id);
            fetchResidences();
          } catch (e) { Alert.alert('Error', 'Failed to delete'); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image?.startsWith('http') ? item.image : 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.category}>{item.category || 'Hotel'}</Text>
          <Text style={styles.price}>LKR {item.price} / n/d</Text>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate('AddResidence', { item })}
          >
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.headerMain}>
        <Text style={styles.headerTitle}>Reservation Management</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('AddResidence')}
          >
            <Ionicons name="add-circle" size={20} color="#2e64e5" />
            <Text style={styles.addButtonText}>Add Residence</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.analyticsTrigger} 
            onPress={() => setAnalyticsVisible(true)}
          >
            <Ionicons name="stats-chart" size={18} color="#2e64e5" />
            <Text style={styles.analyticsTriggerText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.analyticsModalOverlay}>
          <View style={styles.analyticsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Property Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.miniStatsGrid}>
                <View style={[styles.miniStatCard, { backgroundColor: '#eef2f8' }]}>
                  <Text style={styles.miniStatLabel}>Total</Text>
                  <Text style={[styles.miniStatValue, { color: '#2e64e5' }]}>{stats.total}</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#eef2f8' }]}>
                  <Text style={styles.miniStatLabel}>Available</Text>
                  <Text style={[styles.miniStatValue, { color: '#2ecc71' }]}>{stats.available}</Text>
                </View>
              </View>

              <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.modalChartCard}>
                <Text style={styles.chartTitle}>Availability Status</Text>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBarFill, { width: `${(stats.available / (stats.total || 1)) * 100}%`, backgroundColor: '#2ecc71' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.unavailable / (stats.total || 1)) * 100}%`, backgroundColor: '#e74c3c' }]} />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.legendText}>Available ({stats.available})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                    <Text style={styles.legendText}>Booked ({stats.unavailable})</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={[styles.whiteChartCard, { marginTop: 20 }]}>
                <Text style={styles.chartTitleDark}>Property Categories</Text>
                <View style={styles.chartBarBgDark}>
                  <View style={[styles.chartBarFill, { width: `${(stats.hotels / (stats.total || 1)) * 100}%`, backgroundColor: '#3498db' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.villas / (stats.total || 1)) * 100}%`, backgroundColor: '#f39c12' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.homestays / (stats.total || 1)) * 100}%`, backgroundColor: '#9b59b6' }]} />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
                    <Text style={styles.legendTextDark}>Hotels ({stats.hotels})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f39c12' }]} />
                    <Text style={styles.legendTextDark}>Villas ({stats.villas})</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by name or location..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.chip, selectedFilter === cat && styles.activeChip]}
              onPress={() => setSelectedFilter(cat)}
            >
              <Text style={[styles.chipText, selectedFilter === cat && styles.activeChipText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredResidences}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8f9fa' },
  addButton: { backgroundColor: '#2e64e5', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 4 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 3, flexDirection: 'row' },
  image: { width: 120, height: 140 },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 10, fontWeight: 'bold', color: '#2e64e5', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4 },
  location: { fontSize: 12, color: '#666', marginTop: 2 },
  description: { fontSize: 11, color: '#7f8c8d', marginTop: 4, lineHeight: 15 },
  actions: { flexDirection: 'row', marginTop: 10 },
  editBtn: { backgroundColor: '#2e64e5', flexDirection: 'row', padding: 6, borderRadius: 6, flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  deleteBtn: { backgroundColor: '#ff4d4d', flexDirection: 'row', padding: 6, borderRadius: 6, flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  
  // Stats Styles
  statsScroll: { maxHeight: 120, marginBottom: 15 },
  statsContainer: { paddingRight: 15 },
  statCard: { width: 110, height: 100, borderRadius: 20, padding: 15, marginRight: 12, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },

  // Filter Styles
  filterSection: { marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },
  filterChips: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, elevation: 1 },
  activeChip: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeChipText: { color: '#fff' },

  // Updated Styles for Modal Analytics
  headerMain: { padding: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, marginBottom: 15, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, flex: 0.65 },
  addButtonText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  analyticsTrigger: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, flex: 0.32 },
  analyticsTriggerText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },

  analyticsModalOverlay: { flex: 1, backgroundColor: '#f4f7fe' },
  analyticsModalContainer: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  
  miniStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  miniStatCard: { flex: 0.48, padding: 20, borderRadius: 18, alignItems: 'center', elevation: 2 },
  miniStatLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 5 },
  miniStatValue: { fontSize: 24, fontWeight: 'bold' },
  
  modalChartCard: { padding: 20, borderRadius: 24, elevation: 4, marginTop: 15 },
  chartTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  chartBarBg: { height: 14, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  chartBarFill: { height: '100%' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  whiteChartCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 3 },
  chartTitleDark: { color: '#1e293b', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  chartBarBgDark: { height: 14, backgroundColor: '#f0f2f5', borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  legendTextDark: { color: '#64748b', fontSize: 12, fontWeight: '600' }
});

export default ResidenceManageScreen;
