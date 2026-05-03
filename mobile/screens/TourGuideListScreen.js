import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { residenceService, reservationService, guideService, reviewService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl } from '../utils/imageHelper';

const TourGuideListScreen = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Review States
  const [guideReviews, setGuideReviews] = useState([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Booking Form States
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [guideToBook, setGuideToBook] = useState(null);
  const [fullName, setFullName] = useState(user?.name || '');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});

  const handleFullNameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setFullName(filtered);
    setErrors(prev => ({ ...prev, fullName: text !== filtered ? 'Only letters allowed' : '' }));
  };

  const handleIdChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setIdNumber(filtered);
    setErrors(prev => ({ ...prev, idNumber: (filtered.length > 0 && filtered.length !== 12) ? 'ID must be 12 digits' : '' }));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setErrors(prev => ({ ...prev, email: (text.length > 0 && !emailRegex.test(text)) ? 'Enter a valid email' : '' }));
  };

  const handlePhoneChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(filtered);
    setErrors(prev => ({ ...prev, phone: (filtered.length > 0 && filtered.length !== 10) ? 'Phone must be 10 digits' : '' }));
  };

  const handleCardNumberChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setCardNumber(filtered);
    setErrors(prev => ({ ...prev, cardNumber: (filtered.length > 0 && filtered.length !== 12) ? 'Card number must be 12 digits' : '' }));
  };

  const handleExpiryChange = (text) => {
    let filtered = text.replace(/[^0-9]/g, '');
    if (filtered.length >= 2) {
      filtered = filtered.slice(0, 2) + '/' + filtered.slice(2, 4);
    }
    setExpiry(filtered);
    setErrors(prev => ({ ...prev, expiry: (filtered.length > 0 && filtered.length !== 5) ? 'Use MM/YY format' : '' }));
  };

  const handleCvvChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setCvv(filtered);
    setErrors(prev => ({ ...prev, cvv: (filtered.length > 0 && filtered.length !== 3) ? 'CVV must be 3 digits' : '' }));
  };
  
  useEffect(() => {
    if (guideToBook) {
      calculatePrice(checkInDate, checkOutDate, guideToBook.price);
    }
  }, [checkInDate, checkOutDate, guideToBook]);

  const calculatePrice = (start, end, dailyRate) => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setTotalPrice(diffDays * dailyRate);
  };

  const onCheckInChange = (event, selectedDate) => {
    setShowCheckIn(false);
    if (selectedDate) {
      setCheckInDate(selectedDate);
      if (selectedDate >= checkOutDate) {
        setCheckOutDate(new Date(selectedDate.getTime() + 86400000));
      }
    }
  };

  const onCheckOutChange = (event, selectedDate) => {
    setShowCheckOut(false);
    if (selectedDate) {
      setCheckOutDate(selectedDate);
    }
  };
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredGuides, setFilteredGuides] = useState([]);

  const fetchGuides = async () => {
    try {
      const [guidesRes, reviewsRes] = await Promise.all([
        guideService.getGuides(),
        reviewService.getAllReviews()
      ]);
      
      const allGuides = guidesRes.data.data;
      const allReviews = reviewsRes.data.data;

      const guidesWithAverages = allGuides.map(guide => {
        const guideReviews = allReviews.filter(rev => 
          (rev.guideId?._id === guide._id) || (rev.guideId === guide._id)
        );
        
        const totalRating = guideReviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = guideReviews.length > 0 ? (totalRating / guideReviews.length).toFixed(1) : '0.0';
        
        return {
          ...guide,
          avgRating: avg,
          reviewCount: guideReviews.length
        };
      });

      setGuides(guidesWithAverages);
    } catch (error) {
      console.log('Error fetching guides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    let result = guides;
    if (searchQuery) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilter === 'Available') {
      result = result.filter(g => g.availability);
    } else if (activeFilter === 'Male' || activeFilter === 'Female') {
      result = result.filter(g => g.gender === activeFilter);
    } else if (activeFilter !== 'All') {
      result = result.filter(g => 
        g.language.some(lang => lang.toLowerCase() === activeFilter.toLowerCase())
      );
    }
    setFilteredGuides(result);
  }, [searchQuery, activeFilter, guides]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGuides();
  };

  const handleGuideSelect = async (guide) => {
    setSelectedGuide(guide);
    try {
      const response = await reviewService.getGuideReviews(guide._id);
      setGuideReviews(response.data.data);
    } catch (error) {
      console.log('Error fetching guide reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!userComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await reviewService.addReview({
        guideId: selectedGuide._id,
        userId: user?._id || user?.id,
        userName: user?.name || 'Anonymous User',
        rating: userRating,
        comment: userComment
      });
      Alert.alert('Success', 'Thank you for your feedback!');
      setIsReviewModalVisible(false);
      setUserComment('');
      setUserRating(5);
      // Refresh reviews
      const response = await reviewService.getGuideReviews(selectedGuide._id);
      setGuideReviews(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBookPress = (guide) => {
    setGuideToBook(guide);
    setTotalPrice(guide.price);
    setConfirmModalVisible(true);
  };

  const confirmBooking = async () => {
    if (!fullName || !idNumber || !email || !phone || !cardNumber || !expiry || !cvv) {
      Alert.alert('Error', 'Please fill all details including payment info');
      return;
    }

    if (Object.values(errors).some(e => e !== '')) {
      Alert.alert('Error', 'Please fix the validation errors before proceeding');
      return;
    }
    
    setBookingLoading(true);
    try {
      const bookingData = {
        bookingType: 'guide',
        guideId: guideToBook._id,
        fullName, idNumber, email, phone,
        checkInDate, checkOutDate,
        totalPrice, paymentMethod: 'Card'
      };
      await reservationService.createReservation(bookingData);
      Alert.alert('Success', 'Booking request sent for approval!');
      setConfirmModalVisible(false);
      setSelectedGuide(null);
    } catch (err) {
      Alert.alert('Error', 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleGuideSelect(item)} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: getImageUrl(item.image) }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={12} color="#f1c40f" />
            <Text style={styles.experience}> {item.avgRating} • {item.experience} Yrs Exp</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.availability ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusText, { color: item.availability ? '#2E7D32' : '#C62828' }]}>
            {item.availability ? t('available') : t('unavailable')}
          </Text>
        </View>
      </View>
      <View style={styles.tagContainer}>
        {item.language.map((lang, index) => (
          <View key={index} style={styles.tag}><Text style={styles.tagText}>{lang}</Text></View>
        ))}
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || "Expert tour guide with deep knowledge of local culture and history."}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>LKR {item.price?.toFixed(2)}/day</Text>
        <TouchableOpacity 
          style={[styles.miniBookBtn, !item.availability && styles.disabledBtn]} 
          onPress={() => item.availability && handleBookPress(item)}
          disabled={!item.availability}
        >
          <Text style={styles.miniBookBtnText}>{t('book_now')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.headerGradient}>
        <Text style={styles.title}>{t('tour_guides')}</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder={t('search')} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {['All', 'Available', 'Male', 'Female', 'English', 'Sinhala', 'Tamil'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                {t(filter.toLowerCase()) || filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filteredGuides}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Guide Detail Modal */}
      <Modal visible={!!selectedGuide} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedGuide && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedGuide(null)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.modalHeader}>
                  <Image 
                    source={{ uri: getImageUrl(selectedGuide.image) }} 
                    style={styles.largeAvatar} 
                  />
                  <Text style={styles.modalName}>{selectedGuide.name}</Text>
                  <View style={styles.ratingRowLarge}>
                    <Ionicons name="star" size={20} color="#f1c40f" />
                    <Text style={styles.ratingTextLarge}> {selectedGuide.avgRating} ({guideReviews.length} reviews)</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.addReviewBtn} onPress={() => setIsReviewModalVisible(true)}>
                  <Ionicons name="create-outline" size={18} color="#2e64e5" />
                  <Text style={styles.addReviewBtnText}>Rate this Guide</Text>
                </TouchableOpacity>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About Guide</Text>
                  <Text style={styles.descriptionText}>{selectedGuide.description || "Expert tour guide with deep knowledge of local culture and history."}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  {guideReviews.length > 0 ? (
                    guideReviews.map(rev => (
                      <View key={rev._id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewUser}>{rev.userName}</Text>
                          <View style={styles.starRowSmall}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Ionicons key={s} name="star" size={10} color={s <= rev.rating ? "#f1c40f" : "#eee"} />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewComment}>{rev.comment}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noReviews}>No reviews yet.</Text>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.modalBookBtn, !selectedGuide.availability && styles.disabledBtn]}
                  onPress={() => handleBookPress(selectedGuide)}
                  disabled={!selectedGuide.availability}
                >
                  <Text style={styles.bookBtnText}>Book Now - LKR {selectedGuide.price?.toFixed(2)}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={isReviewModalVisible} transparent animationType="fade">
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingContent}>
            <Text style={styles.ratingTitle}>Rate Guide</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                  <Ionicons name={n <= userRating ? "star" : "star-outline"} size={40} color="#f1c40f" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput 
              style={styles.reviewInput} 
              placeholder="Your experience..." 
              multiline 
              value={userComment} 
              onChangeText={setUserComment} 
            />
            <View style={styles.ratingActions}>
              <TouchableOpacity style={styles.ratingCancel} onPress={() => setIsReviewModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ratingSubmit} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Booking Form Modal */}
      <Modal visible={confirmModalVisible} animationType="slide" transparent={true}>
        <View style={styles.confirmOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.confirmContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.confirmTitle}>Complete Your Booking</Text>
              <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionTitle}>Guest Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.formInput} placeholder="John Doe" value={fullName} onChangeText={handleFullNameChange} />
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID / Passport Number</Text>
                <TextInput style={styles.formInput} placeholder="199512345678" value={idNumber} onChangeText={handleIdChange} maxLength={12} keyboardType="numeric" />
                {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput style={styles.formInput} placeholder="john@example.com" value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput style={styles.formInput} placeholder="0771234567" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={10} />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              <Text style={styles.formSectionTitle}>Select Dates</Text>
              <View style={styles.datePickerRow}>
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowCheckIn(true)}>
                  <Text style={styles.dateBoxLabel}>From</Text>
                  <Text style={styles.dateBoxValue}>{checkInDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowCheckOut(true)}>
                  <Text style={styles.dateBoxLabel}>To</Text>
                  <Text style={styles.dateBoxValue}>{checkOutDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              {showCheckIn && (
                <DateTimePicker
                  value={checkInDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onCheckInChange}
                />
              )}

              {showCheckOut && (
                <DateTimePicker
                  value={checkOutDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date(checkInDate.getTime() + 86400000)}
                  onChange={onCheckOutChange}
                />
              )}

              <Text style={styles.formSectionTitle}>Payment Information</Text>
              <View style={styles.paymentCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput 
                    style={styles.paymentInput} 
                    placeholder="1234 5678 9012" 
                    value={cardNumber} 
                    onChangeText={handleCardNumberChange} 
                    maxLength={12}
                    keyboardType="numeric" 
                  />
                  {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                    <TextInput style={styles.paymentInput} placeholder="12/25" value={expiry} onChangeText={handleExpiryChange} maxLength={5} keyboardType="numeric" />
                    {errors.expiry ? <Text style={styles.errorText}>{errors.expiry}</Text> : null}
                  </View>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput 
                      style={styles.paymentInput} 
                      placeholder="123" 
                      value={cvv} 
                      onChangeText={handleCvvChange} 
                      maxLength={3}
                      keyboardType="numeric" 
                      secureTextEntry 
                    />
                    {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
                  </View>
                </View>
              </View>

              <View style={styles.priceSummary}>
                <View style={styles.priceSummaryRow}>
                  <Text style={styles.priceSummaryLabel}>Daily Rate</Text>
                  <Text style={styles.priceSummaryVal}>LKR {guideToBook?.price?.toFixed(2)}</Text>
                </View>
                <View style={[styles.priceSummaryRow, { borderTopWidth: 1, borderTopColor: '#d1d5db', marginTop: 10, paddingTop: 10 }]}>
                  <Text style={styles.totalLabelLarge}>Total Amount</Text>
                  <Text style={styles.totalValLarge}>LKR {totalPrice.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking} disabled={bookingLoading}>
                {bookingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Pay & Confirm Booking</Text>}
              </TouchableOpacity>
              
              <View style={{ height: 30 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  experience: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tag: { backgroundColor: '#f0f4ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 10, color: '#2e64e5', fontWeight: '600' },
  cardDescription: { fontSize: 13, color: '#666', marginTop: 10, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  priceText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  miniBookBtn: { backgroundColor: '#2e64e5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  miniBookBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#ccc' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 20 },
  closeBtn: { alignSelf: 'flex-end' },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  largeAvatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#2e64e5', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  largeAvatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  modalName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  ratingRowLarge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingTextLarge: { fontSize: 14, color: '#666' },
  addReviewBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#f0f4ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  addReviewBtnText: { color: '#2e64e5', fontSize: 13, fontWeight: '600', marginLeft: 5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  descriptionText: { fontSize: 14, color: '#666', lineHeight: 20 },
  reviewItem: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewUser: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  starRowSmall: { flexDirection: 'row' },
  reviewComment: { fontSize: 13, color: '#777' },
  noReviews: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  modalBookBtn: { backgroundColor: '#2e64e5', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ratingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  ratingContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  ratingTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  starPicker: { flexDirection: 'row', marginBottom: 20 },
  reviewInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, width: '100%', height: 80, textAlignVertical: 'top', marginBottom: 20 },
  ratingActions: { flexDirection: 'row', width: '100%' },
  ratingCancel: { flex: 1, alignItems: 'center', padding: 12 },
  ratingSubmit: { flex: 1, backgroundColor: '#2e64e5', borderRadius: 12, alignItems: 'center', padding: 12 },
  cancelText: { color: '#777', fontWeight: '600' },
  submitText: { color: '#fff', fontWeight: 'bold' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  confirmContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  formSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e64e5', marginTop: 20, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '600' },
  formInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4, fontWeight: '600' },
  datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dateBox: { flex: 0.48, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  dateBoxLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  dateBoxValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  paymentCard: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  paymentInput: { backgroundColor: '#fff', borderRadius: 10, padding: 10, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#cbd5e1' },
  priceSummary: { backgroundColor: '#f0f4ff', padding: 15, borderRadius: 15, marginVertical: 20 },
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceSummaryLabel: { fontSize: 14, color: '#64748b' },
  priceSummaryVal: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  totalLabelLarge: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalValLarge: { fontSize: 22, fontWeight: 'bold', color: '#2e64e5' },
  confirmBtn: { backgroundColor: '#2e64e5', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3, shadowColor: '#2e64e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelLink: { marginTop: 15, alignItems: 'center' },
  cancelLinkText: { color: '#999' },
  filterScroll: { marginTop: 15 },
  filterContainer: { paddingHorizontal: 5, paddingBottom: 10 },
  filterChip: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  activeFilterChip: { 
    backgroundColor: '#fff',
    borderColor: '#fff'
  },
  filterText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  activeFilterText: { 
    color: '#2e64e5' 
  },
});

export default TourGuideListScreen;
