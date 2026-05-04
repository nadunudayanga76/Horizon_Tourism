import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
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
      <View style={styles.cardTop}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: getImageUrl(item.image) }} style={styles.avatar} />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#f1c40f" />
            <Text style={styles.ratingText}>{item.avgRating}</Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: item.availability ? '#2ecc71' : '#e74c3c' }]} />
          </View>
          <Text style={styles.experience}>{item.experience} Years Experience • {item.gender}</Text>
          <View style={styles.tagContainer}>
            {item.language.slice(0, 3).map((lang, index) => (
              <View key={index} style={styles.tag}><Text style={styles.tagText}>{lang}</Text></View>
            ))}
            {item.language.length > 3 && <Text style={styles.moreTags}>+{item.language.length - 3}</Text>}
          </View>
        </View>
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || "Expert tour guide with deep knowledge of local culture and history."}
      </Text>
      
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.priceLabel}>Daily Rate</Text>
          <Text style={styles.priceText}>LKR {item.price?.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.miniBookBtn, !item.availability && styles.disabledBtn]} 
          onPress={() => item.availability && handleBookPress(item)}
          disabled={!item.availability}
        >
          <LinearGradient 
            colors={item.availability ? ['#34495e', '#2c3e50'] : ['#bdc3c7', '#95a5a6']} 
            style={styles.bookGradient}
          >
            <Text style={styles.miniBookBtnText}>{t('book_now')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.headerGradient}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{t('tour_guides')}</Text>
            <View style={styles.headerCount}>
              <Text style={styles.countText}>{filteredGuides.length} active</Text>
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder={t('search_guides')} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
              placeholderTextColor="#94a3b8"
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
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#34495e" />
          <Text style={styles.loaderText}>Finding best guides...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGuides}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No guides found for this filter</Text>
            </View>
          }
        />
      )}

      {/* Guide Detail Modal */}
      <Modal visible={!!selectedGuide} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedGuide && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalDragHandle} />
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedGuide(null)}>
                  <Ionicons name="close-circle" size={32} color="#34495e" />
                </TouchableOpacity>
                
                <View style={styles.modalHero}>
                  <View style={styles.largeAvatarWrapper}>
                    <Image source={{ uri: getImageUrl(selectedGuide.image) }} style={styles.largeAvatar} />
                    <View style={styles.modalStatusBadge}>
                      <Text style={styles.modalStatusText}>{selectedGuide.availability ? 'AVAILABLE' : 'BOOKED'}</Text>
                    </View>
                  </View>
                  <Text style={styles.modalName}>{selectedGuide.name}</Text>
                  <View style={styles.modalStatsRow}>
                    <View style={styles.modalStatItem}>
                      <Ionicons name="star" size={16} color="#f1c40f" />
                      <Text style={styles.modalStatText}>{selectedGuide.avgRating} ({selectedGuide.reviewCount})</Text>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStatItem}>
                      <Ionicons name="ribbon" size={16} color="#34495e" />
                      <Text style={styles.modalStatText}>{selectedGuide.experience}y Exp</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.rateBtn} onPress={() => setIsReviewModalVisible(true)}>
                    <Ionicons name="create-outline" size={18} color="#34495e" />
                    <Text style={styles.rateBtnText}>Write a Review</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>About Professional</Text>
                  <Text style={styles.modalDescription}>{selectedGuide.description || "Expert tour guide with deep knowledge of local culture and history."}</Text>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.modalSectionTitle}>Client Feedback</Text>
                    <Text style={styles.reviewCountLabel}>{guideReviews.length} total</Text>
                  </View>
                  {guideReviews.length > 0 ? (
                    guideReviews.map(rev => (
                      <View key={rev._id} style={styles.reviewCard}>
                        <View style={styles.reviewTop}>
                          <Text style={styles.reviewUser}>{rev.userName}</Text>
                          <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Ionicons key={s} name="star" size={10} color={s <= rev.rating ? "#f1c40f" : "#e2e8f0"} />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewText}>{rev.comment}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyReviews}>
                      <Text style={styles.noReviewsText}>Be the first to review this guide</Text>
                    </View>
                  )}
                </View>

                <View style={{ height: 100 }} />
              </ScrollView>
            )}
            
            {selectedGuide && (
              <View style={styles.modalBottomBar}>
                <View>
                  <Text style={styles.bottomPriceLabel}>Total for 1 day</Text>
                  <Text style={styles.bottomPriceVal}>LKR {selectedGuide.price?.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.mainBookBtn, !selectedGuide.availability && styles.disabledBtn]}
                  onPress={() => handleBookPress(selectedGuide)}
                  disabled={!selectedGuide.availability}
                >
                  <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.mainBookGradient}>
                    <Text style={styles.mainBookBtnText}>BOOK NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={isReviewModalVisible} transparent animationType="fade">
        <View style={styles.glassOverlay}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>Rate Experience</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                  <Ionicons name={n <= userRating ? "star" : "star-outline"} size={42} color="#f1c40f" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput 
              style={styles.reviewInput} 
              placeholder="Tell us about your trip..." 
              multiline 
              value={userComment} 
              onChangeText={setUserComment} 
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.ratingActions}>
              <TouchableOpacity style={styles.ratingCancel} onPress={() => setIsReviewModalVisible(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ratingSubmit} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT REVIEW</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Booking Form Modal */}
      <Modal visible={confirmModalVisible} animationType="slide" transparent={true}>
        <View style={styles.bookingOverlay}>
          <SafeAreaView style={styles.bookingSafe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bookingContainer}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingTitle}>Reservation Details</Text>
                <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="#34495e" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={styles.bookingFormScroll}>
                <View style={styles.formSection}>
                  <Text style={styles.formSectionHeader}>Guest Details</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} placeholder="Enter your name" value={fullName} onChangeText={handleFullNameChange} />
                    {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.label}>ID / Passport</Text>
                    <TextInput style={styles.input} placeholder="12 digit ID number" value={idNumber} onChangeText={handleIdChange} maxLength={12} keyboardType="numeric" />
                    {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputBox, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <Text style={styles.label}>Phone</Text>
                      <TextInput style={styles.input} placeholder="07XXXXXXXX" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={10} />
                    </View>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionHeader}>Tour Dates</Text>
                  <View style={styles.dateSelectorRow}>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckIn(true)}>
                      <Ionicons name="calendar-outline" size={18} color="#34495e" />
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>START DATE</Text>
                        <Text style={styles.dateVal}>{checkInDate.toLocaleDateString()}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckOut(true)}>
                      <Ionicons name="calendar" size={18} color="#34495e" />
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>END DATE</Text>
                        <Text style={styles.dateVal}>{checkOutDate.toLocaleDateString()}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {showCheckIn && (
                  <DateTimePicker value={checkInDate} mode="date" display="default" minimumDate={new Date()} onChange={onCheckInChange} />
                )}

                {showCheckOut && (
                  <DateTimePicker value={checkOutDate} mode="date" display="default" minimumDate={new Date(checkInDate.getTime() + 86400000)} onChange={onCheckOutChange} />
                )}

                <View style={styles.formSection}>
                  <Text style={styles.formSectionHeader}>Secure Payment</Text>
                  <View style={styles.cardContainer}>
                    <View style={styles.inputBox}>
                      <Text style={styles.label}>Card Number</Text>
                      <TextInput style={styles.cardInput} placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChangeText={handleCardNumberChange} maxLength={12} keyboardType="numeric" />
                    </View>
                    <View style={styles.row}>
                      <View style={[styles.inputBox, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Expiry</Text>
                        <TextInput style={styles.cardInput} placeholder="MM/YY" value={expiry} onChangeText={handleExpiryChange} maxLength={5} keyboardType="numeric" />
                      </View>
                      <View style={[styles.inputBox, { flex: 1 }]}>
                        <Text style={styles.label}>CVV</Text>
                        <TextInput style={styles.cardInput} placeholder="XXX" value={cvv} onChangeText={handleCvvChange} maxLength={3} keyboardType="numeric" secureTextEntry />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tour Duration</Text>
                    <Text style={styles.summaryVal}>{Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1} Days</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Base Fare</Text>
                    <Text style={styles.summaryVal}>LKR {guideToBook?.price?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalVal}>LKR {totalPrice.toLocaleString()}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.finalBookBtn} onPress={confirmBooking} disabled={bookingLoading}>
                  <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.finalGradient}>
                    {bookingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.finalBtnText}>CONFIRM & PAY NOW</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
              </ScrollView>
            </KeyboardAvoidingView>
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
  headerGradient: { 
    padding: 25, 
    paddingTop: Platform.OS === 'ios' ? 10 : 40, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: '900',
    letterSpacing: 0.5
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    paddingHorizontal: 15, 
    height: 52,
    elevation: 4
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500'
  },
  list: { 
    padding: 20,
    paddingTop: 10
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 15,
    color: '#34495e',
    fontWeight: '600'
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 20, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10
  },
  cardTop: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  imageWrapper: {
    width: 75,
    height: 75,
    marginRight: 18
  },
  avatar: { 
    width: 75, 
    height: 75, 
    borderRadius: 22,
    backgroundColor: '#f1f5f9'
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333',
    marginLeft: 3
  },
  cardInfo: { 
    flex: 1 
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b',
    flex: 1
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10
  },
  experience: { 
    fontSize: 12, 
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500'
  },
  tagContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 10 
  },
  tag: { 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10, 
    marginRight: 6 
  },
  tagText: { 
    fontSize: 9, 
    color: '#34495e', 
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  moreTags: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold'
  },
  cardDescription: { 
    fontSize: 13, 
    color: '#475569', 
    marginTop: 15, 
    lineHeight: 20,
    fontWeight: '400'
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15, 
    paddingTop: 15,
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  priceLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  priceText: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: '#34495e' 
  },
  miniBookBtn: { 
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4
  },
  bookGradient: {
    paddingHorizontal: 20, 
    paddingVertical: 10, 
  },
  miniBookBtnText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  disabledBtn: { 
    opacity: 0.5 
  },
  
  // Detail Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    height: '92%', 
    padding: 0 
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12
  },
  closeBtn: { 
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10
  },
  modalHero: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 40
  },
  largeAvatarWrapper: {
    width: 110,
    height: 110,
    marginBottom: 15
  },
  largeAvatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 35, 
    backgroundColor: '#f1f5f9'
  },
  modalStatusBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#34495e',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900'
  },
  modalName: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#1e293b',
    marginTop: 10
  },
  modalStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalStatText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginLeft: 8
  },
  modalStatDivider: {
    width: 1,
    height: 15,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20
  },
  modalActions: {
    paddingHorizontal: 25,
    marginBottom: 20
  },
  rateBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  rateBtnText: { 
    color: '#34495e', 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
  modalSection: { 
    paddingHorizontal: 25,
    marginBottom: 30 
  },
  modalSectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginBottom: 12 
  },
  modalDescription: { 
    fontSize: 14, 
    color: '#64748b', 
    lineHeight: 22,
    fontWeight: '400'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  reviewCountLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700'
  },
  reviewCard: { 
    backgroundColor: '#f8fafc',
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 15 
  },
  reviewTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  reviewUser: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#334155' 
  },
  reviewStars: { 
    flexDirection: 'row' 
  },
  reviewText: { 
    fontSize: 13, 
    color: '#64748b',
    lineHeight: 18
  },
  emptyReviews: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20
  },
  noReviewsText: { 
    fontSize: 13, 
    color: '#94a3b8', 
    fontStyle: 'italic' 
  },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#34495e'
  },
  mainBookBtn: { 
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#34495e',
    shadowOpacity: 0.3
  },
  mainBookGradient: {
    paddingHorizontal: 35,
    paddingVertical: 15
  },
  mainBookBtnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 14,
    letterSpacing: 1
  },

  // Rating Overlay Styles
  glassOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(52, 73, 94, 0.8)', 
    justifyContent: 'center', 
    padding: 25 
  },
  ratingBox: { 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center',
    elevation: 20
  },
  ratingTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#1e293b', 
    marginBottom: 25 
  },
  starPicker: { 
    flexDirection: 'row', 
    marginBottom: 30 
  },
  reviewInput: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 20, 
    padding: 20, 
    width: '100%', 
    height: 120, 
    textAlignVertical: 'top', 
    marginBottom: 25,
    fontSize: 15,
    color: '#334155',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  ratingActions: { 
    flexDirection: 'row', 
    width: '100%' 
  },
  ratingCancel: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 15 
  },
  ratingSubmit: { 
    flex: 1.5, 
    backgroundColor: '#34495e', 
    borderRadius: 15, 
    alignItems: 'center', 
    padding: 15,
    elevation: 4
  },
  cancelText: { 
    color: '#94a3b8', 
    fontWeight: '800',
    fontSize: 13
  },
  submitText: { 
    color: '#fff', 
    fontWeight: '900',
    fontSize: 13
  },

  // Booking Form Styles
  bookingOverlay: { 
    flex: 1, 
    backgroundColor: '#f4f7fe'
  },
  bookingSafe: {
    flex: 1
  },
  bookingContainer: { 
    flex: 1,
    padding: 25 
  },
  bookingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  bookingTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#1e293b' 
  },
  bookingFormScroll: {
    flex: 1
  },
  formSection: {
    marginBottom: 30
  },
  formSectionHeader: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: '#34495e', 
    marginBottom: 15,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  inputBox: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 12, 
    color: '#94a3b8', 
    marginBottom: 8, 
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 15, 
    color: '#1e293b', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  errorText: { 
    color: '#e74c3c', 
    fontSize: 11, 
    marginTop: 5, 
    fontWeight: '600' 
  },
  row: { 
    flexDirection: 'row' 
  },
  dateSelectorRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  datePickerBtn: { 
    flex: 0.48, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  dateInfo: {
    marginLeft: 10
  },
  dateLabel: { 
    fontSize: 9, 
    color: '#94a3b8', 
    fontWeight: '900' 
  },
  dateVal: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#34495e' 
  },
  cardContainer: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    elevation: 3
  },
  cardInput: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 15, 
    color: '#1e293b', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  summaryBox: { 
    backgroundColor: '#f8fafc', 
    padding: 25, 
    borderRadius: 25, 
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10
  },
  summaryLabel: { 
    fontSize: 14, 
    color: '#64748b',
    fontWeight: '500'
  },
  summaryVal: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 15
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#1e293b' 
  },
  totalVal: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#34495e' 
  },
  finalBookBtn: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 10,
    shadowColor: '#34495e',
    shadowOpacity: 0.3
  },
  finalGradient: {
    padding: 20, 
    alignItems: 'center' 
  },
  finalBtnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 16,
    letterSpacing: 1
  },
  
  // Filter Styles
  filterScroll: { 
    marginTop: 20 
  },
  filterContainer: { 
    paddingHorizontal: 0, 
    paddingBottom: 10 
  },
  filterChip: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  activeFilterChip: { 
    backgroundColor: '#fff',
    borderColor: '#fff',
    elevation: 5
  },
  filterText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  activeFilterText: { 
    color: '#34495e' 
  },
  emptyState: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default TourGuideListScreen;
