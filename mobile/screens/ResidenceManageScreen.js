import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, Modal, SafeAreaView } from 'react-native';
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
      <Image 
        source={{ uri: item.image?.startsWith('http') ? item.image : 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <View style={styles.itemHeader}>
          <Text style={styles.categoryBadge}>{item.category || 'Hotel'}</Text>
          <Text style={styles.price}>LKR {item.price}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#95a5a6" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate('AddResidence', { item })}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.btnText}>Edit Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.headerMain}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Properties</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => navigation.navigate('AddResidence')}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.analyticsTrigger} 
              onPress={() => setAnalyticsVisible(true)}
            >
              <Ionicons name="stats-chart" size={20} color="#fff" />
              <Text style={styles.analyticsTriggerText}>Stats</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={false}>
        <View style={styles.analyticsModalOverlay}>
          <SafeAreaView style={styles.analyticsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Property Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.miniStatsGrid}>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatLabel}>TOTAL</Text>
                  <Text style={[styles.miniStatValue, { color: '#34495e' }]}>{stats.total}</Text>
                </View>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatLabel}>AVAILABLE</Text>
                  <Text style={[styles.miniStatValue, { color: '#2ecc71' }]}>{stats.available}</Text>
                </View>
              </View>

              <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.modalChartCard}>
                <Text style={styles.chartTitle}>Availability Status</Text>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBarFill, { width: `${(stats.available / (stats.total || 1)) * 100}%`, backgroundColor: '#2ecc71' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.unavailable / (stats.total || 1)) * 100}%`, backgroundColor: '#e74c3c' }]} />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                    <Text style={styles.legendText}>Booked</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={[styles.whiteChartCard, { marginTop: 25 }]}>
                <Text style={styles.chartTitleDark}>Property Distribution</Text>
                <View style={styles.chartBarBgDark}>
                  <View style={[styles.chartBarFill, { width: `${(stats.hotels / (stats.total || 1)) * 100}%`, backgroundColor: '#3498db' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.villas / (stats.total || 1)) * 100}%`, backgroundColor: '#f39c12' }]} />
                  <View style={[styles.chartBarFill, { width: `${(stats.homestays / (stats.total || 1)) * 100}%`, backgroundColor: '#9b59b6' }]} />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
                    <Text style={styles.legendTextDark}>Hotels</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f39c12' }]} />
                    <Text style={styles.legendTextDark}>Villas</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#95a5a6" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search properties..." 
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
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f7fe' 
  },
  headerMain: { 
    padding: 25, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    marginBottom: 0, 
    paddingBottom: 40,
    paddingTop: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    flex: 1,
    textAlign: 'center'
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  addButton: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flex: 0.65 
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 8, 
    fontSize: 14 
  },
  analyticsTrigger: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flex: 0.32 
  },
  analyticsTriggerText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  filterSection: { 
    padding: 20,
    marginTop: -20,
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    borderRadius: 18, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 15, 
    height: 50 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 15, 
    color: '#1e293b' 
  },
  filterChips: { 
    flexDirection: 'row',
    marginBottom: 5,
  },
  chip: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 25, 
    backgroundColor: '#fff', 
    marginRight: 10, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee'
  },
  activeChip: { 
    backgroundColor: '#34495e', 
    borderColor: '#34495e' 
  },
  chipText: { 
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '700' 
  },
  activeChipText: { 
    color: '#fff' 
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    marginBottom: 18, 
    overflow: 'hidden', 
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row' 
  },
  image: { 
    width: 130, 
    height: '100%',
    minHeight: 160
  },
  info: { 
    flex: 1, 
    padding: 15, 
    justifyContent: 'space-between' 
  },
  itemHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 5
  },
  categoryBadge: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#34495e', 
    backgroundColor: '#ebf2ff', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8,
    textTransform: 'uppercase'
  },
  price: { 
    fontSize: 15, 
    fontWeight: '900', 
    color: '#2c3e50' 
  },
  name: { 
    fontSize: 17, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginBottom: 4 
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  location: { 
    fontSize: 12, 
    color: '#95a5a6', 
    marginLeft: 4,
    fontWeight: '500'
  },
  description: { 
    fontSize: 11, 
    color: '#7f8c8d', 
    lineHeight: 16,
    marginBottom: 10
  },
  actions: { 
    flexDirection: 'row', 
    gap: 8
  },
  editBtn: { 
    backgroundColor: '#3498db', 
    flexDirection: 'row', 
    paddingVertical: 10, 
    borderRadius: 12, 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  deleteBtn: { 
    backgroundColor: '#fdeae9', 
    paddingVertical: 10, 
    borderRadius: 12, 
    width: 45,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  btnText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginLeft: 6 
  },
  
  // Modal Styles
  analyticsModalOverlay: { flex: 1, backgroundColor: '#f4f7fe' },
  analyticsModalContainer: { flex: 1, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  miniStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  miniStatCard: { flex: 0.48, padding: 20, borderRadius: 22, alignItems: 'center', backgroundColor: '#fff', elevation: 3 },
  miniStatLabel: { fontSize: 13, color: '#95a5a6', fontWeight: '700', marginBottom: 5 },
  miniStatValue: { fontSize: 26, fontWeight: '900' },
  modalChartCard: { padding: 25, borderRadius: 28, elevation: 6, marginTop: 15 },
  chartTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  chartBarBg: { height: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden', flexDirection: 'row' },
  chartBarFill: { height: '100%' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  whiteChartCard: { backgroundColor: '#fff', padding: 25, borderRadius: 28, elevation: 4 },
  chartTitleDark: { color: '#2c3e50', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  chartBarBgDark: { height: 16, backgroundColor: '#f0f2f5', borderRadius: 8, overflow: 'hidden', flexDirection: 'row' },
  legendTextDark: { color: '#64748b', fontSize: 13, fontWeight: '700' }
});

export default ResidenceManageScreen;
