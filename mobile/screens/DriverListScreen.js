import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Image, Linking, ScrollView, SafeAreaView, Platform, Modal } from 'react-native';
import { driverService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DriverListScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState('Available');
  const [filterExperience, setFilterExperience] = useState('All');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      <View style={styles.cardTop}>
        <View style={styles.avatarWrapper}>
          {item.image && item.image !== 'default-driver.png' ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={35} color="#cbd5e1" />
            </View>
          )}
          <View style={[styles.statusIndicator, { backgroundColor: item.available ? '#2ecc71' : '#e74c3c' }]} />
        </View>
        
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.name}</Text>
          <View style={styles.expBadge}>
            <Ionicons name="ribbon" size={14} color="#34495e" />
            <Text style={styles.expText}>{item.experience} Years Exp.</Text>
          </View>
        </View>
        
        <View style={styles.priceBox}>
          <Text style={styles.priceSymbol}>LKR</Text>
          <Text style={styles.priceAmount}>{item.price}</Text>
          <Text style={styles.pricePer}>/day</Text>
        </View>
      </View>

      <View style={styles.cardMiddle}>
        <Text style={styles.bio} numberOfLines={2}>
          {item.description || "Experienced professional driver committed to your safety and comfort throughout your journey."}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailTag}>
            <Ionicons name="card-outline" size={14} color="#64748b" />
            <Text style={styles.detailLabel}>{item.licenseNo}</Text>
          </View>
          <View style={styles.detailTag}>
            <Ionicons name="mail-outline" size={14} color="#64748b" />
            <Text style={styles.detailLabel} numberOfLines={1}>{item.email || 'Contact for info'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <TouchableOpacity 
          style={styles.primaryAction} 
          onPress={() => handleCall(item.phone)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.actionGradient}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionText}>Contact Driver</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={() => {
            setSelectedDriver(item);
            setModalVisible(true);
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color="#34495e" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Expert Drivers</Text>
              <Text style={styles.headerSub}>Reliable chauffeurs for your tours</Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterScroll}
            style={styles.filterContainer}
          >
            <TouchableOpacity 
              style={[styles.filterChip, filterAvailable === 'Available' && styles.activeChip]} 
              onPress={() => setFilterAvailable('Available')}
            >
              <Text style={[styles.filterText, filterAvailable === 'Available' && styles.activeFilterText]}>Available Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, filterAvailable === 'All' && styles.activeChip]} 
              onPress={() => setFilterAvailable('All')}
            >
              <Text style={[styles.filterText, filterAvailable === 'All' && styles.activeFilterText]}>All Status</Text>
            </TouchableOpacity>

            <View style={styles.vDivider} />

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
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#34495e" />
          <Text style={styles.loadingText}>Finding best drivers...</Text>
        </View>
      ) : (
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
              <Ionicons name="people-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No matching drivers</Text>
              <Text style={styles.emptySub}>Try changing your filters or check back later</Text>
            </View>
          }
        />
      )}

      {/* Driver Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalAvatarWrapper}>
                {selectedDriver?.image && selectedDriver.image !== 'default-driver.png' ? (
                  <Image source={{ uri: selectedDriver.image }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#cbd5e1" />
                  </View>
                )}
                <View style={[styles.modalStatus, { backgroundColor: selectedDriver?.available ? '#2ecc71' : '#e74c3c' }]} />
              </View>
              <Text style={styles.modalName}>{selectedDriver?.name}</Text>
              <View style={styles.modalBadge}>
                <Ionicons name="ribbon-outline" size={14} color="#fff" />
                <Text style={styles.modalBadgeText}>{selectedDriver?.experience} Years Experience</Text>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Driver Details</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconBg}>
                    <Ionicons name="card-outline" size={20} color="#34495e" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>License No</Text>
                    <Text style={styles.detailValue}>{selectedDriver?.licenseNo}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconBg}>
                    <Ionicons name="call-outline" size={20} color="#34495e" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Phone Number</Text>
                    <Text style={styles.detailValue}>{selectedDriver?.phone}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconBg}>
                    <Ionicons name="mail-outline" size={20} color="#34495e" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Email Address</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{selectedDriver?.email || 'Not Provided'}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconBg}>
                    <Ionicons name="cash-outline" size={20} color="#34495e" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Daily Rate</Text>
                    <Text style={styles.detailValue}>LKR {selectedDriver?.price}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>About Driver</Text>
              <Text style={styles.modalBio}>
                {selectedDriver?.description || "A professional and dedicated driver with extensive knowledge of local routes and a commitment to passenger safety and punctuality."}
              </Text>

              <TouchableOpacity 
                style={styles.modalCallBtn}
                onPress={() => handleCall(selectedDriver?.phone)}
              >
                <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.modalCallGradient}>
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.modalCallText}>Call Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  loadingText: {
    marginTop: 15,
    color: '#64748b',
    fontWeight: '600'
  },
  header: {
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
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
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  filterContainer: {
    marginTop: 5,
    marginBottom: 5
  },
  filterScroll: {
    paddingRight: 20,
    alignItems: 'center'
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  activeChip: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    elevation: 5
  },
  filterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '800',
  },
  activeFilterText: {
    color: '#34495e',
  },
  vDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  listContainer: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 35,
    padding: 2
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  avatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 0.3
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  expText: {
    fontSize: 11,
    color: '#34495e',
    marginLeft: 5,
    fontWeight: '800',
  },
  priceBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  priceSymbol: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800'
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34495e',
  },
  pricePer: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600'
  },
  cardMiddle: {
    marginTop: 18,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  bio: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500'
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center'
  },
  primaryAction: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#34495e',
    shadowOpacity: 0.2
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.5
  },
  secondaryAction: {
    width: 50,
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  modalHeader: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 40
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12
  },
  modalAvatarWrapper: {
    position: 'relative',
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    marginBottom: 15
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff'
  },
  modalAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalStatus: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff'
  },
  modalName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 5
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  modalBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8
  },
  modalBody: {
    padding: 25
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 15,
    marginTop: 5
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  detailItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  detailIconBg: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 1
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 12,
    color: '#34495e',
    fontWeight: '900',
    marginTop: 2
  },
  modalBio: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 25
  },
  modalCallBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#34495e',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  modalCallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18
  },
  modalCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.5
  }
});

export default DriverListScreen;
