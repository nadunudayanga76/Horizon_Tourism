import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { reservationService, paymentService, transportBookingService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { LinearGradient } from 'expo-linear-gradient';

const FinanceManageScreen = () => {
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
              background: linear-gradient(135deg, #2e64e5 0%, #7e22ce 100%);
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
            .total-value { font-size: 32px; font-weight: 800; color: #2e64e5; }
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
            <div class="receipt-label">Booking Confirmation</div>
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
                <div class="info-item"><span class="label">SERVICE TYPE</span><span class="value">${type === 'hotel' ? 'Hotel Accommodation' : 'Tour Guide Services'}</span></div>
                <div class="info-item"><span class="label">BOOKED ITEM</span><span class="value" style="color: #7e22ce;">${data.itemName}</span></div>
                <div class="info-grid" style="margin-top: 15px;">
                  <div class="info-item"><span class="label">CHECK-IN</span><span class="value">${data.checkInDate}</span></div>
                  <div class="info-item"><span class="label">CHECK-OUT</span><span class="value">${data.checkOutDate}</span></div>
                </div>
              </div>
            </div>

            <div class="price-section">
              <div class="total-label">TOTAL AMOUNT</div>
              <div class="total-value">LKR ${Number(data.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>

            <div class="footer">
              <p>This is a computer-generated document. No signature is required.</p>
              <p>For support, contact us at support@horizontourism.com</p>
              <div class="qr-placeholder">SECURE DIGITAL RECEIPT</div>
              <p style="margin-top: 20px;">&copy; 2026 Horizon Tourism. All rights reserved.</p>
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
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>LKR {item.totalPrice}</Text>
          {item.paymentMethod === 'Card' && (
            <View style={styles.cardBadge}>
              <Ionicons name="card" size={12} color="#2e64e5" />
              <Text style={styles.cardBadgeText}>CARD</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detail}><Ionicons name="call-outline" /> {item.phone}</Text>
        <Text style={styles.detail}><Ionicons name="business-outline" /> {item.residenceId?.name || 'Property'}</Text>
        <Text style={styles.detail}><Ionicons name="calendar-outline" /> {item.checkInDate.split('T')[0]} to {item.checkOutDate.split('T')[0]}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectHotel(item._id)}>
              <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
              <Text style={[styles.actionBtnText, { color: '#e74c3c' }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => handleConfirmHotel(item._id)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2ecc71" />
              <Text style={[styles.actionBtnText, { color: '#2ecc71' }]}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={() => handleOpenPreview(item, 'hotel')}>
          <Ionicons name="eye-outline" size={20} color="#2e64e5" />
          <Text style={[styles.actionBtnText, { color: '#2e64e5' }]}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.emailDirectBtn]} onPress={() => handleDirectEmail(item, 'hotel')}>
          <Ionicons name="mail-outline" size={20} color="#7e22ce" />
          <Text style={[styles.actionBtnText, { color: '#7e22ce' }]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteHotel(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGuideBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.fullName}</Text>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: '#9b59b6' }]}>LKR {item.totalPrice}</Text>
          {item.paymentMethod === 'Card' && (
            <View style={[styles.cardBadge, { backgroundColor: '#f5f3ff' }]}>
              <Ionicons name="card" size={12} color="#7e22ce" />
              <Text style={[styles.cardBadgeText, { color: '#7e22ce' }]}>CARD</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detail}><Ionicons name="call-outline" /> {item.phone}</Text>
        <Text style={styles.detail}><Ionicons name="calendar-outline" /> {item.checkInDate?.split('T')[0]} to {item.checkOutDate?.split('T')[0]}</Text>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectGuide(item._id)}>
              <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
              <Text style={[styles.actionBtnText, { color: '#e74c3c' }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => handleConfirmGuide(item._id)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2ecc71" />
              <Text style={[styles.actionBtnText, { color: '#2ecc71' }]}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={() => handleOpenPreview(item, 'guide')}>
          <Ionicons name="eye-outline" size={20} color="#2e64e5" />
          <Text style={[styles.actionBtnText, { color: '#2e64e5' }]}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.emailDirectBtn]} onPress={() => handleDirectEmail(item, 'guide')}>
          <Ionicons name="mail-outline" size={20} color="#7e22ce" />
          <Text style={[styles.actionBtnText, { color: '#7e22ce' }]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteGuide(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
  const renderTransportBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.fullName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'Approved' ? '#2ecc71' : (item.status === 'Pending' ? '#f1c40f' : '#e74c3c') }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: '#2e64e5' }]}>LKR {item.totalPrice}</Text>
          <View style={styles.cardBadge}>
            <Ionicons name="card" size={12} color="#2e64e5" />
            <Text style={styles.cardBadgeText}>CARD</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detail}><Ionicons name="car-outline" /> {item.vehicle?.vehicleModel} ({item.vehicle?.vehicleNumber})</Text>
        {item.driver && <Text style={styles.detail}><Ionicons name="person-outline" /> Driver: {item.driver.name}</Text>}
        <Text style={styles.detail}><Ionicons name="calendar-outline" /> {new Date(item.checkInDate).toLocaleDateString()} to {new Date(item.checkOutDate).toLocaleDateString()}</Text>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectTransport(item._id)}>
              <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
              <Text style={[styles.actionBtnText, { color: '#e74c3c' }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => handleConfirmTransport(item._id)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2ecc71" />
              <Text style={[styles.actionBtnText, { color: '#2ecc71' }]}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={() => handleOpenPreview(item, 'transport')}>
          <Ionicons name="eye-outline" size={20} color="#2e64e5" />
          <Text style={[styles.actionBtnText, { color: '#2e64e5' }]}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteTransport(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#2e64e5" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View /> 
        <TouchableOpacity 
          style={styles.analyticsTrigger} 
          onPress={() => setAnalyticsVisible(true)}
        >
          <Ionicons name="stats-chart" size={20} color="#2e64e5" />
          <Text style={styles.analyticsTriggerText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput 
          style={styles.searchInput} 
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter Chips */}
      <View style={styles.statusFilterContainer}>
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

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Financial Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={styles.modalSummaryRow}>
                <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.modalSummaryCardFull}>
                  <View style={styles.revenueIconBg}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.modalSummaryLabel}>Total Confirmed Revenue</Text>
                    <Text style={styles.modalSummaryValueLarge}>LKR {calculateTotalRevenue().toLocaleString()}</Text>
                  </View>
                </LinearGradient>
              </View>

              <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={[styles.analyticsCardGradient, { marginTop: 25 }]}>
                <View style={styles.analyticsHeader}>
                  <Ionicons name="pie-chart" size={20} color="#fff" />
                  <Text style={[styles.analyticsTitle, { color: '#fff' }]}>Booking Metrics</Text>
                </View>
                
                <View style={styles.chartContainer}>
                  {/* Booking Distribution Bar */}
                  <View style={styles.chartRow}>
                    <View style={styles.chartLabels}>
                      <Text style={[styles.chartLabel, { color: 'rgba(255,255,255,0.8)' }]}>Service Type Distribution</Text>
                      <Text style={[styles.chartValue, { color: '#fff' }]}>{pendingBookings.length}H / {guideBookings.length}G / {transportBookings.length}T</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <View style={[styles.progressBarFill, { width: `${(pendingBookings.length / (pendingBookings.length + guideBookings.length + transportBookings.length || 1)) * 100}%`, backgroundColor: '#fff' }]} />
                      <View style={[styles.progressBarFill, { width: `${(guideBookings.length / (pendingBookings.length + guideBookings.length + transportBookings.length || 1)) * 100}%`, backgroundColor: '#f39c12' }]} />
                      <View style={[styles.progressBarFill, { width: `${(transportBookings.length / (pendingBookings.length + guideBookings.length + transportBookings.length || 1)) * 100}%`, backgroundColor: '#00d2ff' }]} />
                    </View>
                  </View>

                  {/* Status Breakdown Bar */}
                  <View style={[styles.chartRow, { marginTop: 20 }]}>
                    <View style={styles.chartLabels}>
                      <Text style={[styles.chartLabel, { color: 'rgba(255,255,255,0.8)' }]}>Global Approval Status</Text>
                      <Text style={[styles.chartValue, { color: '#fff' }]}>{([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Confirmed' || b.status === 'Approved').length)} Approved</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <View style={[styles.progressBarFill, { width: `${([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Confirmed' || b.status === 'Approved').length / ([...pendingBookings, ...guideBookings, ...transportBookings].length || 1)) * 100}%`, backgroundColor: '#2ecc71' }]} />
                      <View style={[styles.progressBarFill, { width: `${([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Pending').length / ([...pendingBookings, ...guideBookings, ...transportBookings].length || 1)) * 100}%`, backgroundColor: '#ff9f43' }]} />
                      <View style={[styles.progressBarFill, { width: `${([...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Rejected').length / ([...pendingBookings, ...guideBookings, ...transportBookings].length || 1)) * 100}%`, backgroundColor: '#e74c3c' }]} />
                    </View>
                  </View>

                  {/* Detailed Counts */}
                  <View style={[styles.statusGrid, { marginTop: 25 }]}>
                    <View style={[styles.statusMiniStat, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={styles.statusMiniValueWhite}>{[...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Confirmed' || b.status === 'Approved').length}</Text>
                      <Text style={styles.statusMiniLabelWhite}>Confirmed</Text>
                    </View>
                    <View style={[styles.statusMiniStat, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={styles.statusMiniValueWhite}>{[...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Pending').length}</Text>
                      <Text style={styles.statusMiniLabelWhite}>Pending</Text>
                    </View>
                    <View style={[styles.statusMiniStat, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={styles.statusMiniValueWhite}>{[...pendingBookings, ...guideBookings, ...transportBookings].filter(b => b.status === 'Rejected').length}</Text>
                      <Text style={styles.statusMiniLabelWhite}>Rejected</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>

              {/* Transport Insights Card */}
              <View style={[styles.analyticsCard, { marginTop: 20, backgroundColor: '#fff' }]}>
                <View style={styles.analyticsHeader}>
                  <Ionicons name="car-sport" size={22} color="#00d2ff" />
                  <Text style={styles.analyticsTitle}>Transport Insights</Text>
                </View>
                
                <View style={styles.chartContainer}>
                  <View style={styles.chartRow}>
                    <View style={styles.chartLabels}>
                      <Text style={styles.chartLabel}>Driver Utilization</Text>
                      <Text style={styles.chartValue}>
                        {transportBookings.filter(b => b.driver).length} / {transportBookings.length} Bookings
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${(transportBookings.filter(b => b.driver).length / (transportBookings.length || 1)) * 100}%`, backgroundColor: '#00d2ff' }]} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>With Driver: {transportBookings.filter(b => b.driver).length}</Text>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Self Drive: {transportBookings.length - transportBookings.filter(b => b.driver).length}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusGrid, { marginTop: 15 }]}>
                    <View style={[styles.statusMiniCard, { borderLeftColor: '#00d2ff', marginRight: 10 }]}>
                      <Text style={styles.statusMiniLabel}>Transport Rev</Text>
                      <Text style={[styles.statusMiniValue, { color: '#00d2ff' }]}>
                        LKR {transportBookings.reduce((sum, b) => sum + (b.status === 'Approved' ? b.totalPrice : 0), 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.statusMiniCard, { borderLeftColor: '#f39c12' }]}>
                      <Text style={styles.statusMiniLabel}>Driver Rev</Text>
                      <Text style={[styles.statusMiniValue, { color: '#f39c12' }]}>
                        LKR {transportBookings.reduce((sum, b) => {
                          if (b.status === 'Approved' && b.driver) {
                            // Assuming total price includes driver price, we might need a way to track just driver rev
                            // For now, showing count of driver bookings as a proxy or simple percentage if needed
                            return sum + (b.totalPrice * 0.2); // Just as an example proxy
                          }
                          return sum;
                        }, 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.tabContainer}>
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
          <Text style={[styles.tabText, activeTab === 'guides' && styles.activeTabText]}>Tour Guides</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'transport' && styles.activeTab]} 
          onPress={() => setActiveTab('transport')}
        >
          <Text style={[styles.tabText, activeTab === 'transport' && styles.activeTabText]}>Transport</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'hotels' ? filteredHotels : (activeTab === 'guides' ? filteredGuides : filteredTransport)}
        keyExtractor={item => item._id}
        renderItem={activeTab === 'hotels' ? renderHotelBooking : (activeTab === 'guides' ? renderGuideBooking : renderTransportBooking)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} bookings to display.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.editSection}>

                {/* Status Badge */}
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                  <View style={[{
                    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
                    backgroundColor:
                      editData.status === 'Approved' || editData.status === 'Confirmed' ? '#dcfce7' :
                      editData.status === 'Rejected' ? '#fee2e2' : '#fef9c3'
                  }]}>
                    <Text style={{
                      fontWeight: 'bold', fontSize: 14,
                      color:
                        editData.status === 'Approved' || editData.status === 'Confirmed' ? '#16a34a' :
                        editData.status === 'Rejected' ? '#dc2626' : '#ca8a04'
                    }}>{editData.status?.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.viewGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <Text style={styles.viewValue}>{editData.fullName || '—'}</Text>
                </View>

                <View style={styles.viewGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <Text style={styles.viewValue}>{editData.email || '—'}</Text>
                </View>

                <View style={styles.viewGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <Text style={styles.viewValue}>{editData.phone || '—'}</Text>
                </View>

                {editData.idNumber ? (
                  <View style={styles.viewGroup}>
                    <Text style={styles.inputLabel}>ID Number</Text>
                    <Text style={styles.viewValue}>{editData.idNumber}</Text>
                  </View>
                ) : null}

                {bookingType === 'transport' && (
                  <>
                    <View style={styles.viewGroup}>
                      <Text style={styles.inputLabel}>Vehicle</Text>
                      <Text style={styles.viewValue}>{editData.itemName || '—'}</Text>
                    </View>

                    {editData.driver ? (
                      <View style={styles.viewGroup}>
                        <Text style={styles.inputLabel}>Assigned Driver</Text>
                        <Text style={styles.viewValue}>{editData.driver}</Text>
                      </View>
                    ) : null}
                  </>
                )}

                {bookingType !== 'transport' && (
                  <View style={styles.viewGroup}>
                    <Text style={styles.inputLabel}>
                      {bookingType === 'hotel' ? 'Hotel' : 'Tour Guide'}
                    </Text>
                    <Text style={styles.viewValue}>{editData.itemName || '—'}</Text>
                  </View>
                )}

                <View style={styles.viewGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={[styles.viewValue, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Ionicons name="card-outline" size={20} color="#2e64e5" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 16, color: '#2e64e5', fontWeight: 'bold' }}>CREDIT CARD</Text>
                  </View>
                </View>

                <View style={styles.viewGroup}>
                  <Text style={styles.inputLabel}>Total Price (LKR)</Text>
                  <Text style={[styles.viewValue, { color: '#2e64e5', fontWeight: 'bold', fontSize: 20 }]}>LKR {Number(editData.price).toLocaleString()}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.inputLabel}>Check-in</Text>
                    <Text style={styles.viewValue}>{editData.checkInDate || '—'}</Text>
                  </View>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.inputLabel}>Check-out</Text>
                    <Text style={styles.viewValue}>{editData.checkOutDate || '—'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewCard}>
                <LinearGradient
                  colors={bookingType === 'transport' ? ['#0f2027', '#2e64e5'] : ['#2e64e5', '#7e22ce']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.previewHeader}
                >
                  <Text style={styles.previewLogo}>HORIZON</Text>
                  <Text style={styles.previewType}>{bookingType.toUpperCase()} RECEIPT</Text>
                </LinearGradient>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName}>{editData.fullName}</Text>
                  <Text style={styles.previewItem}>{editData.itemName}</Text>
                  <Text style={styles.previewPrice}>LKR {Number(editData.price).toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.footerBtn, styles.shareBtn, { flex: 1 }]} 
                onPress={() => generatePDF(editData, bookingType)}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.footerBtnText}>Share PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f7fe' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dashboardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  analyticsTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  analyticsTriggerText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },

  modalSummaryRow: { marginTop: 10 },
  modalSummaryCardFull: { width: '100%', padding: 20, borderRadius: 20, elevation: 5, flexDirection: 'row', alignItems: 'center' },
  revenueIconBg: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 15, marginRight: 15 },
  modalSummaryLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  modalSummaryValueLarge: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  // Analytics Styles
  analyticsSection: { marginBottom: 20 },
  analyticsCard: { padding: 18, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#eff6ff' },
  analyticsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  analyticsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginLeft: 10 },
  chartContainer: { width: '100%' },
  chartRow: { marginBottom: 20 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  chartValue: { fontSize: 13, color: '#1e293b', fontWeight: '700' },
  progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statusMiniCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 15, marginRight: 8, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  statusMiniLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  statusMiniValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },

  analyticsCardGradient: { padding: 20, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  statusMiniStat: { flex: 1, padding: 12, borderRadius: 15, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  statusMiniValueWhite: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusMiniLabelWhite: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },

  statusFilterContainer: { marginBottom: 15 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  activeStatusChip: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  statusChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeStatusChipText: { color: '#fff' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#eef2f8', borderRadius: 15, padding: 6, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontWeight: '600', color: '#94a3b8' },
  activeTabText: { color: '#2e64e5' },
  bookingCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  guestName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  statusText: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  amount: { fontSize: 17, fontWeight: 'bold', color: '#2e64e5' },
  cardBody: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detail: { fontSize: 14, color: '#475569', marginBottom: 6, fontWeight: '400' },
  cardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  cardBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#2e64e5', marginLeft: 4 },
  actionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginRight: 8, marginTop: 8, backgroundColor: '#f8fafc' },
  actionBtnText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  confirmBtn: { backgroundColor: '#f0fdf4' },
  rejectBtn: { backgroundColor: '#fef2f2' },
  pdfBtn: { backgroundColor: '#eff6ff' },
  emailDirectBtn: { backgroundColor: '#f5f3ff' },
  deleteBtn: { paddingHorizontal: 8 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '90%' },
  previewModalContainer: { flex: 1, backgroundColor: '#f4f7fe', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalScroll: { flex: 1 },
  editSection: { marginBottom: 25 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 16, color: '#1e293b', marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  viewGroup: { marginBottom: 12 },
  viewValue: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 15, color: '#334155', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  previewCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0' },
  previewHeader: { padding: 25, alignItems: 'center' },
  previewLogo: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  previewType: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  previewContent: { padding: 25, alignItems: 'center' },
  previewName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  previewItem: { fontSize: 15, color: '#64748b', marginTop: 6, fontWeight: '500' },
  previewPrice: { fontSize: 28, fontWeight: '800', color: '#2e64e5', marginTop: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#f4f7fe' },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  shareBtn: { backgroundColor: '#2e64e5' },
  emailBtn: { backgroundColor: '#7e22ce' },
  footerBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});

export default FinanceManageScreen;
