import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import { reservationService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const ReservationListScreen = () => {
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
    try {
      const response = await reservationService.getReservations();
      setReservations(response.data.data);
    } catch (error) {
      console.log('Error fetching reservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const handleCancel = async (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await reservationService.cancelReservation(id);
              fetchReservations();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          } 
        }
      ]
    );
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to permanently delete this reservation record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancelReservation(id); // Use the same service since it deletes
              fetchReservations();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record');
            }
          } 
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return '#2ecc71';
      case 'Pending': return '#f39c12';
      case 'Cancelled': return '#e74c3c';
      case 'Rejected': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }) => {
    const isHotel = item.bookingType === 'hotel';
    const mainTitle = isHotel ? (item.residenceId?.name || 'Hotel Stay') : (item.guideId?.name || 'Guided Tour');
    const statusColor = getStatusColor(item.status);
    
    return (
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <Text style={styles.bookingTypeLabel}>{item.bookingType?.toUpperCase()}</Text>
            <Text style={styles.hotelName} numberOfLines={1}>{mainTitle}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                {new Date(item.checkInDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.detailText}>{item.adults + item.children} Guests</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Total Investment</Text>
              <Text style={styles.priceValue}>LKR {Number(item.totalPrice).toLocaleString()}</Text>
            </View>
            <View style={styles.actionRow}>
              {item.status === 'Pending' && (
                <TouchableOpacity onPress={() => handleCancel(item._id)} style={styles.actionBtn}>
                  <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={[styles.actionBtn, { marginLeft: 10 }]}>
                <Ionicons name="trash-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#34495e" />
        <Text style={styles.loadingText}>Retrieving your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>My Bookings</Text>
              <Text style={styles.headerSub}>{reservations.length} Active Reservations</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={reservations}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34495e" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="calendar-outline" size={60} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>Start your journey by exploring our premium residences and tour guides.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.exploreText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 15, fontSize: 14, color: '#64748b', fontWeight: '600' },
  
  // Header
  header: { paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 45 },
  backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },

  list: { padding: 20, paddingBottom: 40 },
  
  // Card Design
  card: { backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 18, borderLeftWidth: 6, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  titleArea: { flex: 1 },
  bookingTypeLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  hotelName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },

  cardBody: { marginTop: 5 },
  detailGrid: { flexDirection: 'row', gap: 20, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#64748b', fontWeight: '600' },

  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  priceInfo: { flex: 1 },
  priceLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#34495e' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  exploreBtn: { backgroundColor: '#34495e', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, elevation: 5 },
  exploreText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ReservationListScreen;
