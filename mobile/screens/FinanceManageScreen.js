import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { reservationService, paymentService, transportBookingService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { LinearGradient } from 'expo-linear-gradient';

const FinanceManageScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('hotels'); // 'hotels' or 'guides'
  const [pendingBookings, setPendingBookings] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingType, setBookingType] = useState(''); // 'hotel' or 'guide'
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [activeStatus, setActiveStatus] = useState('All');
  const [filteredTransport, setFilteredTransport] = useState([]);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  // Live Revenue Calculation
  const calculateTotalRevenue = () => {
    const all = [...pendingBookings, ...guideBookings, ...transportBookings];
    return all
      .filter(b => b.status === 'Confirmed' || b.status === 'Approved')
      .reduce((sum, b) => sum + (parseFloat(b.price || b.totalPrice) || 0), 0);
  };
  const [editData, setEditData] = useState({ 
    fullName: '', 
    phone: '', 
    email: '',
    checkInDate: '', 
    checkOutDate: '',
    price: 0,
    itemName: ''
  });

  const fetchData = async () => {
    try {
      // Fetch unified reservations
      try {
        const response = await reservationService.getReservations();
        const allBookings = response.data.data;
        
        // Filter into hotels
        const hotels = allBookings.filter(b => b.bookingType === 'hotel');
        setPendingBookings(hotels);

        // Filter into guides
        const guides = allBookings.filter(b => b.bookingType === 'guide');
        setGuideBookings(guides);
      } catch (e) {
        console.log('Error fetching unified reservations:', e);
      }

      try {
        const tRes = await transportBookingService.getBookings();
        console.log('Transport bookings response:', JSON.stringify(tRes.data));
        const tData = Array.isArray(tRes.data.data) ? tRes.data.data : [];
        setTransportBookings(tData);
        console.log('Transport bookings set:', tData.length);
      } catch (e) {
        console.log('Error fetching transport bookings:', e?.response?.status, e?.response?.data || e.message);
      }

    } catch (error) {
      console.log('Error fetching finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const filter = (list) => {
      let result = list;
      
      // Filter by Status
      if (activeStatus !== 'All') {
        // 'Confirmed' also matches 'Approved' for transport bookings
        if (activeStatus === 'Confirmed') {
          result = result.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
        } else {
          result = result.filter(b => b.status === activeStatus);
        }
      }

      // Filter by Search
      if (searchQuery) {
        result = result.filter(b => 
          (b.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return result;
    };

    setFilteredHotels(filter(pendingBookings));
    setFilteredGuides(filter(guideBookings));
    setFilteredTransport(filter(transportBookings));
  }, [searchQuery, activeStatus, pendingBookings, guideBookings, transportBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleConfirmHotel = (id) => {
    Alert.alert('Approve Booking', 'Are you sure you want to approve this hotel booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
          try {
            await reservationService.confirmReservation(id);
            Alert.alert('Success', 'Hotel booking confirmed!');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to confirm booking');
          }
        }
      }
    ]);
  };

  const handleRejectHotel = (id) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this hotel booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await reservationService.rejectReservation(id);
            Alert.alert('Rejected', 'Hotel booking request rejected.');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to reject booking');
          }
        }
      }
    ]);
  };

  const handleDeleteHotel = (id) => {
    Alert.alert('Delete Record', 'Permanently delete this hotel booking record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reservationService.deleteReservation(id);
            Alert.alert('Deleted', 'Record removed from database.');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete record');
          }
        }
      }
    ]);
  };

  const handleConfirmGuide = (id) => {
    Alert.alert('Approve Guide', 'Approve this tour guide booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
          try {
            await reservationService.confirmReservation(id);
            Alert.alert('Success', 'Guide booking confirmed! Confirmation email sent.');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to confirm booking');
          }
        }
      }
    ]);
  };

  const handleRejectGuide = (id) => {
    Alert.alert('Reject Guide', 'Decline this guide booking request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await reservationService.rejectReservation(id);
            Alert.alert('Rejected', 'Booking request declined.');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to reject');
          }
        }
      }
    ]);
  };

  const handleDeleteGuide = (id) => {
    Alert.alert('Delete Guide Record', 'Permanently remove this guide booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reservationService.deleteReservation(id);
            Alert.alert('Deleted', 'Record removed.');
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const handleConfirmTransport = (id) => {
    Alert.alert('Approve Transport', 'Approve this transport booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
          try {
            await transportBookingService.updateStatus(id, 'Approved');
            Alert.alert('Success', 'Transport booking approved!');
            fetchData();
          } catch (e) { Alert.alert('Error', 'Failed to approve'); }
        }
      }
    ]);
  };

  const handleRejectTransport = (id) => {
    Alert.alert('Reject Transport', 'Decline this transport booking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await transportBookingService.updateStatus(id, 'Rejected');
            Alert.alert('Rejected', 'Booking request declined.');
            fetchData();
          } catch (e) { Alert.alert('Error', 'Failed to reject'); }
        }
      }
    ]);
  };

  const handleDeleteTransport = (id) => {
    Alert.alert('Delete Record', 'Delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await transportBookingService.deleteBooking(id);
            fetchData();
          } catch (e) { Alert.alert('Error', 'Failed to delete'); }
        }
      }
    ]);
  };

  const handleOpenPreview = (item, type) => {
    setSelectedBooking(item);
    setBookingType(type);

    let itemName = '';
    if (type === 'hotel') {
      itemName = item.residenceId?.name || 'Hotel Booking';
    } else if (type === 'guide') {
      itemName = item.guideId?.name || 'Tour Guide Booking';
    } else if (type === 'transport') {
      itemName = item.vehicle
        ? `${item.vehicle.vehicleModel} (${item.vehicle.vehicleNumber})`
        : 'Transport Booking';
    }

    setEditData({
      fullName: item.fullName || item.userId?.name || '',
      phone: item.phone || '',
      email: item.email || item.userId?.email || '',
      idNumber: item.idNumber || '',
      checkInDate: item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : '',
      checkOutDate: item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : '',
      price: item.totalPrice || item.price || 0,
      itemName,
      status: item.status || '',
      driver: item.driver ? item.driver.name : null,
      licenceNo: item.driver ? item.driver.licenceNo : null,
    });
    setPreviewModalVisible(true);
  };

  const generatePDF = async (data, type, shouldShare = true) => {
    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; }
            .container { padding: 40px; }
            .header { 
              background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
              padding: 40px;
              color: white;
              text-align: center;
              border-radius: 0 0 40px 40px;
            }
            .logo { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
            .receipt-label { 
              display: inline-block;
              background: rgba(255,255,255,0.2);
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              margin-top: 10px;
              text-transform: uppercase;
              font-weight: 600;
            }
            .content { padding: 40px; }
            .section { margin-bottom: 35px; }
            .section-title { 
              font-size: 14px; 
              font-weight: 700; 
              color: #64748b; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              margin-bottom: 15px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
            }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 15px; }
            .label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; display: block; }
            .value { font-size: 16px; font-weight: 600; color: #1e293b; }
            .booking-card { 
              background: #f8fafc;
              border-radius: 20px;
              padding: 25px;
              border: 1px solid #eef2f6;
            }
            .price-section { 
              margin-top: 40px;
              padding-top: 30px;
              border-top: 2px dashed #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label { font-size: 18px; font-weight: 700; color: #64748b; }
            .total-value { font-size: 32px; font-weight: 800; color: #34495e; }
            .footer { 
              margin-top: 60px; 
              text-align: center; 
              padding: 40px;
              border-top: 1px solid #f1f5f9;
              color: #94a3b8;
              font-size: 13px;
            }
            .qr-placeholder {
              width: 80px;
              height: 80px;
              background: #f1f5f9;
              margin: 20px auto;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #cbd5e1;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">HORIZON TOURISM</div>
            <div class="receipt-label">Finance Confirmation</div>
          </div>
          
          <div class="container">
            <div class="section">
              <div class="section-title">Client Details</div>
              <div class="info-grid">
                <div class="info-item"><span class="label">FULL NAME</span><span class="value">${data.fullName}</span></div>
                <div class="info-item"><span class="label">PHONE NUMBER</span><span class="value">${data.phone}</span></div>
                <div class="info-item"><span class="label">EMAIL ADDRESS</span><span class="value">${data.email}</span></div>
                <div class="info-item"><span class="label">DATE ISSUED</span><span class="value">${new Date().toLocaleDateString()}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Reservation Details</div>
              <div class="booking-card">
                <div class="info-item"><span class="label">SERVICE TYPE</span><span class="value">${type.toUpperCase()} BOOKING</span></div>
                <div class="info-item"><span class="label">ITEM NAME</span><span class="value" style="color: #34495e;">${data.itemName}</span></div>
                <div class="info-grid" style="margin-top: 15px;">
                  <div class="info-item"><span class="label">FROM</span><span class="value">${data.checkInDate}</span></div>
                  <div class="info-item"><span class="label">TO</span><span class="value">${data.checkOutDate}</span></div>
                </div>
              </div>
            </div>

            <div class="price-section">
              <div class="total-label">TOTAL PAID</div>
              <div class="total-value">LKR ${Number(data.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>

            <div class="footer">
              <p>Certified by Horizon Finance Department</p>
              <div class="qr-placeholder">VERIFIED DIGITAL RECORD</div>
              <p style="margin-top: 20px;">&copy; 2026 Horizon Tourism. Professional Management.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (shouldShare) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
      return uri;
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      return null;
    }
  };

  const handleDirectEmail = async (item, type) => {
    try {
      if (type === 'hotel') {
        await reservationService.sendReceipt(item._id);
      } else {
        await reservationService.sendReceipt(item._id);
      }
      Alert.alert('Success', 'Receipt email sent successfully!');
    } catch (error) {
      console.error('Email error:', error);
      Alert.alert('Error', 'Failed to send automatic email. Please check backend SMTP settings.');
    }
  };

  const renderHotelBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.fullName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#e8f5e9' : (item.status === 'Pending' ? '#fff8e1' : '#ffebee') }]}>
            <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#2e7d32' : (item.status === 'Pending' ? '#f57f17' : '#c62828') }]}>{item.status}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>LKR {item.totalPrice}</Text>
          {item.paymentMethod === 'Card' && (
            <View style={styles.cardBadge}>
              <Ionicons name="card" size={12} color="#34495e" />
              <Text style={styles.cardBadgeText}>CARD</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={14} color="#95a5a6" />
          <Text style={styles.detail}>{item.residenceId?.name || 'Property'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={14} color="#95a5a6" />
          <Text style={styles.detail}>{item.checkInDate.split('T')[0]} - {item.checkOutDate.split('T')[0]}</Text>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={styles.rejectBtnSmall} onPress={() => handleRejectHotel(item._id)}>
              <Ionicons name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleConfirmHotel(item._id)}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.previewBtn} onPress={() => handleOpenPreview(item, 'hotel')}>
          <Ionicons name="eye-outline" size={20} color="#34495e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.emailBtnSmall} onPress={() => handleDirectEmail(item, 'hotel')}>
          <Ionicons name="mail-outline" size={20} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDeleteHotel(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#95a5a6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGuideBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.fullName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#e8f5e9' : (item.status === 'Pending' ? '#fff8e1' : '#ffebee') }]}>
            <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#2e7d32' : (item.status === 'Pending' ? '#f57f17' : '#c62828') }]}>{item.status}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: '#8e44ad' }]}>LKR {item.totalPrice}</Text>
          <View style={[styles.cardBadge, { backgroundColor: '#f5f3ff' }]}>
            <Ionicons name="card" size={12} color="#8e44ad" />
            <Text style={[styles.cardBadgeText, { color: '#8e44ad' }]}>CARD</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="people" size={14} color="#95a5a6" />
          <Text style={styles.detail}>Tour Guide Booking</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={14} color="#95a5a6" />
          <Text style={styles.detail}>{item.checkInDate?.split('T')[0]} - {item.checkOutDate?.split('T')[0]}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={styles.rejectBtnSmall} onPress={() => handleRejectGuide(item._id)}>
              <Ionicons name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.approveBtn, { backgroundColor: '#8e44ad' }]} onPress={() => handleConfirmGuide(item._id)}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.previewBtn} onPress={() => handleOpenPreview(item, 'guide')}>
          <Ionicons name="eye-outline" size={20} color="#34495e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.emailBtnSmall} onPress={() => handleDirectEmail(item, 'guide')}>
          <Ionicons name="mail-outline" size={20} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDeleteGuide(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#95a5a6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransportBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.fullName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Approved' ? '#e8f5e9' : (item.status === 'Pending' ? '#fff8e1' : '#ffebee') }]}>
            <Text style={[styles.statusText, { color: item.status === 'Approved' ? '#2e7d32' : (item.status === 'Pending' ? '#f57f17' : '#c62828') }]}>{item.status}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: '#2980b9' }]}>LKR {item.totalPrice}</Text>
          <View style={[styles.cardBadge, { backgroundColor: '#ebf5ff' }]}>
            <Ionicons name="card" size={12} color="#2980b9" />
            <Text style={[styles.cardBadgeText, { color: '#2980b9' }]}>CARD</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={14} color="#95a5a6" />
          <Text style={styles.detail}>{item.vehicle?.vehicleModel} ({item.vehicle?.vehicleNumber})</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={14} color="#95a5a6" />
          <Text style={styles.detail}>{new Date(item.checkInDate).toLocaleDateString()} - {new Date(item.checkOutDate).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={styles.rejectBtnSmall} onPress={() => handleRejectTransport(item._id)}>
              <Ionicons name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.approveBtn, { backgroundColor: '#2980b9' }]} onPress={() => handleConfirmTransport(item._id)}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.previewBtn} onPress={() => handleOpenPreview(item, 'transport')}>
          <Ionicons name="eye-outline" size={20} color="#34495e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDeleteTransport(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#95a5a6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#34495e" />
      <Text style={styles.loaderText}>Syncing financial records...</Text>
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
            <Text style={styles.headerTitle}>Finance Dashboard</Text>
            <TouchableOpacity 
              style={styles.analyticsTrigger} 
              onPress={() => setAnalyticsVisible(true)}
            >
              <Ionicons name="stats-chart" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.revenueOverview}>
            <Text style={styles.revenueLabel}>TOTAL CONFIRMED REVENUE</Text>
            <Text style={styles.revenueValue}>LKR {calculateTotalRevenue().toLocaleString()}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.mainContent}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#95a5a6" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by guest or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        <View style={styles.tabSection}>
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'hotels' && styles.activeTab]} 
              onPress={() => setActiveTab('hotels')}
            >
              <Text style={[styles.tabText, activeTab === 'hotels' && styles.activeTabText]}>Hotels</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'guides' && styles.activeTab]} 
              onPress={() => setActiveTab('guides')}
            >
              <Text style={[styles.tabText, activeTab === 'guides' && styles.activeTabText]}>Guides</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'transport' && styles.activeTab]} 
              onPress={() => setActiveTab('transport')}
            >
              <Text style={[styles.tabText, activeTab === 'transport' && styles.activeTabText]}>Transport</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusFilterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'Pending', 'Confirmed', 'Rejected'].map(status => (
              <TouchableOpacity 
                key={status} 
                style={[styles.statusChip, activeStatus === status && styles.activeStatusChip]}
                onPress={() => setActiveStatus(status)}
              >
                <Text style={[styles.statusChipText, activeStatus === status && styles.activeStatusChipText]}>
                  {status === 'Confirmed' ? 'Confirmed/Approved' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={activeTab === 'hotels' ? filteredHotels : (activeTab === 'guides' ? filteredGuides : filteredTransport)}
          keyExtractor={item => item._id}
          renderItem={activeTab === 'hotels' ? renderHotelBooking : (activeTab === 'guides' ? renderGuideBooking : renderTransportBooking)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No bookings found for {activeTab}</Text></View>}
          contentContainerStyle={styles.listContent}
        />
      </View>
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayFull}>
          <SafeAreaView style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Financial Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#34495e" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.analyticsHeroCard}>
                  <Text style={styles.heroLabel}>Total Revenue</Text>
                  <Text style={styles.heroValue}>LKR {calculateTotalRevenue().toLocaleString()}</Text>
                  <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>LIVE SYNCED</Text></View>
               </LinearGradient>

               <View style={styles.miniStatsGrid}>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{pendingBookings.length}</Text>
                    <Text style={styles.miniStatLabel}>HOTELS</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{guideBookings.length}</Text>
                    <Text style={styles.miniStatLabel}>GUIDES</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{transportBookings.length}</Text>
                    <Text style={styles.miniStatLabel}>CARS</Text>
                  </View>
               </View>

               <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Approval Metrics</Text>
                  <View style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, { flex: ([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Confirmed' || b.status === 'Approved').length || 1), backgroundColor: '#2ecc71' }]} />
                    <View style={[styles.chartBar, { flex: ([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Pending').length || 1), backgroundColor: '#f39c12' }]} />
                    <View style={[styles.chartBar, { flex: ([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Rejected').length || 1), backgroundColor: '#e74c3c' }]} />
                  </View>
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#2ecc71' }]} /><Text style={styles.legendText}>Confirmed</Text></View>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#f39c12' }]} /><Text style={styles.legendText}>Pending</Text></View>
                  </View>
               </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={previewModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayFull}>
          <SafeAreaView style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#34495e" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View style={styles.previewCard}>
                  <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.previewHeader}>
                    <Text style={styles.previewLogo}>HORIZON</Text>
                    <Text style={styles.previewSub}>OFFICIAL RECEIPT</Text>
                  </LinearGradient>
                  <View style={styles.previewBody}>
                    <View style={styles.previewRow}><Text style={styles.pLabel}>GUEST</Text><Text style={styles.pValue}>{editData.fullName}</Text></View>
                    <View style={styles.previewRow}><Text style={styles.pLabel}>SERVICE</Text><Text style={styles.pValue}>{editData.itemName}</Text></View>
                    <View style={styles.previewRow}><Text style={styles.pLabel}>DATE</Text><Text style={styles.pValue}>{editData.checkInDate}</Text></View>
                    <View style={styles.previewDivider} />
                    <View style={styles.previewRow}><Text style={styles.pLabelTotal}>TOTAL AMOUNT</Text><Text style={styles.pValueTotal}>LKR {Number(editData.price).toLocaleString()}</Text></View>
                  </View>
               </View>

               <TouchableOpacity style={styles.shareBtnLarge} onPress={() => generatePDF(editData, bookingType)}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                  <Text style={styles.shareBtnText}>Share as PDF Document</Text>
               </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f7fe' 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f4f7fe'
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#34495e',
    fontWeight: '600'
  },
  headerMain: { 
    padding: 25, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    paddingBottom: 35,
    paddingTop: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTopRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  analyticsTrigger: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  revenueOverview: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20, 
    padding: 15, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)' 
  },
  revenueLabel: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 1,
    marginBottom: 5 
  },
  revenueValue: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '900' 
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20
  },
  searchSection: {
    marginBottom: 15
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    paddingHorizontal: 15, 
    height: 50, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 15, 
    color: '#2c3e50' 
  },
  tabSection: {
    marginBottom: 15
  },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 5, 
    elevation: 2 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 12 
  },
  activeTab: { 
    backgroundColor: '#34495e' 
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#95a5a6' 
  },
  activeTabText: { 
    color: '#fff' 
  },
  statusFilterSection: {
    marginBottom: 15
  },
  statusChip: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  activeStatusChip: { 
    backgroundColor: '#34495e', 
    borderColor: '#34495e' 
  },
  statusChipText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#95a5a6' 
  },
  activeStatusChipText: { 
    color: '#fff' 
  },
  listContent: {
    paddingBottom: 30
  },
  bookingCard: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    padding: 18, 
    marginBottom: 15, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  guestName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  statusBadge: { 
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '800', 
    textTransform: 'uppercase' 
  },
  amount: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#34495e' 
  },
  cardBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f4ff', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
    marginTop: 5 
  },
  cardBadgeText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#34495e', 
    marginLeft: 4 
  },
  cardBody: { 
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  detail: { 
    fontSize: 13, 
    color: '#7f8c8d', 
    marginLeft: 8, 
    fontWeight: '500' 
  },
  actionContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  approveBtn: { 
    flex: 1, 
    backgroundColor: '#2ecc71', 
    flexDirection: 'row', 
    paddingVertical: 10, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  approveBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 6,
    fontSize: 13
  },
  previewBtn: { 
    flex: 1, 
    backgroundColor: '#f0f4ff', 
    flexDirection: 'row', 
    paddingVertical: 10, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  previewBtnSmall: {
    width: 45,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rejectBtnSmall: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#fdeae9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emailBtnSmall: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#ebf5ff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  deleteBtnSmall: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600'
  },

  // Modal Full Styles
  modalOverlayFull: { 
    flex: 1, 
    backgroundColor: '#f4f7fe' 
  },
  modalContentFull: { 
    flex: 1, 
    padding: 25 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  analyticsHeroCard: { 
    padding: 30, 
    borderRadius: 28, 
    alignItems: 'center', 
    marginBottom: 25,
    elevation: 6
  },
  heroLabel: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 12, 
    fontWeight: '800', 
    letterSpacing: 1,
    marginBottom: 5 
  },
  heroValue: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '900' 
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 15
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  miniStatsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25 
  },
  miniStatCard: { 
    flex: 0.31, 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 3
  },
  miniStatValue: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  miniStatLabel: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#95a5a6',
    marginTop: 4
  },
  chartCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 28, 
    elevation: 4 
  },
  chartTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginBottom: 20 
  },
  chartBarContainer: { 
    height: 16, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 8, 
    flexDirection: 'row', 
    overflow: 'hidden' 
  },
  chartBar: { 
    height: '100%' 
  },
  chartLegend: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 12 
  },
  dot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 8 
  },
  legendText: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '700' 
  },

  // Preview Card Styles
  previewCard: { 
    backgroundColor: '#fff', 
    borderRadius: 28, 
    overflow: 'hidden', 
    elevation: 8,
    marginBottom: 25
  },
  previewHeader: { 
    padding: 30, 
    alignItems: 'center' 
  },
  previewLogo: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: -1 
  },
  previewSub: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 10, 
    fontWeight: '800', 
    marginTop: 5,
    letterSpacing: 2
  },
  previewBody: { 
    padding: 25 
  },
  previewRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  pLabel: { 
    fontSize: 11, 
    color: '#94a3b8', 
    fontWeight: '800' 
  },
  pValue: { 
    fontSize: 15, 
    color: '#2c3e50', 
    fontWeight: '700' 
  },
  previewDivider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 15 
  },
  pLabelTotal: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '800' 
  },
  pValueTotal: { 
    fontSize: 24, 
    color: '#34495e', 
    fontWeight: '900' 
  },
  shareBtnLarge: { 
    backgroundColor: '#34495e', 
    flexDirection: 'row', 
    padding: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4
  },
  shareBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 12 
  }
});

export default FinanceManageScreen;
