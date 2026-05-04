import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, SafeAreaView, Modal, TextInput, Alert, StatusBar, Platform } from 'react-native';
import { residenceService, reviewService } from '../services/api';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageHelper';

const { width } = Dimensions.get('window');

const ResidenceDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const [residence, setResidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await residenceService.getResidence(id);
        setResidence(response.data.data);
      } catch (error) {
        console.log('Error fetching detail:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await reviewService.getResidenceReviews(id);
        setReviews(response.data.data);
      } catch (error) {
        console.log('Error fetching reviews:', error);
      }
    };

    fetchDetail();
    fetchReviews();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!userComment.trim()) {
      Alert.alert('Error', 'Please add a comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await reviewService.addReview({
        residenceId: id,
        userId: user?._id || user?.id,
        userName: user?.name || 'Anonymous',
        rating: userRating,
        comment: userComment
      });
      Alert.alert('Success', 'Your review has been submitted');
      setIsReviewModalVisible(false);
      setUserComment('');
      setUserRating(5);
      const response = await reviewService.getResidenceReviews(id);
      setReviews(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#34495e" />
        <Text style={styles.loaderText}>Loading details...</Text>
      </View>
    );
  }

  const allImages = residence.images?.length > 0 ? residence.images : (residence.image ? [residence.image] : []);
  const mainImageToShow = selectedImage || allImages[0];
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Immersive Header */}
        <View style={styles.headerArea}>
          <Image source={{ uri: getImageUrl(mainImageToShow) }} style={styles.mainHeroImage} />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.heroOverlay} />
        </View>

        {/* Content Section */}
        <View style={styles.mainContent}>
          <View style={styles.topInfo}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{residence.category || 'Luxury Stay'}</Text>
            </View>
            <Text style={styles.resName}>{residence.name}</Text>
            <View style={styles.locContainer}>
              <Ionicons name="location" size={16} color="#64748b" />
              <Text style={styles.locText}>{residence.location}</Text>
            </View>
          </View>

          {/* Gallery */}
          {allImages.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {allImages.map((img, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setSelectedImage(img)} style={styles.galleryItem}>
                    <Image source={{ uri: getImageUrl(img) }} style={styles.galleryImg} />
                    {selectedImage === img && <View style={styles.activeGalleryBorder} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Info Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}><Ionicons name="expand-outline" size={20} color="#34495e" /></View>
              <Text style={styles.statVal}>150 m²</Text>
              <Text style={styles.statLab}>Area</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}><Ionicons name="people-outline" size={20} color="#34495e" /></View>
              <Text style={styles.statVal}>4 Guests</Text>
              <Text style={styles.statLab}>Capacity</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}><MaterialIcons name="bathtub" size={20} color="#34495e" /></View>
              <Text style={styles.statVal}>2 Bath</Text>
              <Text style={styles.statLab}>Private</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}><Ionicons name="bed-outline" size={20} color="#34495e" /></View>
              <Text style={styles.statVal}>2 Beds</Text>
              <Text style={styles.statLab}>King Size</Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Property</Text>
            <Text style={styles.descText}>
              {residence.description || "Experience the ultimate luxury and comfort in this stunning property. Designed for those who appreciate the finer things in life, offering panoramic views and premium amenities."}
            </Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Amenities</Text>
            <View style={styles.amenityRow}>
              <View style={styles.amenityItem}><Ionicons name="wifi" size={20} color="#64748b" /><Text style={styles.amenityText}>Free WiFi</Text></View>
              <View style={styles.amenityItem}><Ionicons name="snow-outline" size={20} color="#64748b" /><Text style={styles.amenityText}>Air Con</Text></View>
              <View style={styles.amenityItem}><Ionicons name="restaurant-outline" size={20} color="#64748b" /><Text style={styles.amenityText}>Breakfast</Text></View>
              <View style={styles.amenityItem}><Ionicons name="tv-outline" size={20} color="#64748b" /><Text style={styles.amenityText}>Smart TV</Text></View>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.sectionTitle}>Guest Reviews</Text>
                <View style={styles.ratingSummary}>
                  <Ionicons name="star" size={16} color="#f1c40f" />
                  <Text style={styles.avgText}>{avgRating}</Text>
                  <Text style={styles.countText}>({reviews.length} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setIsReviewModalVisible(true)}>
                <Text style={styles.writeReviewText}>Rate Now</Text>
              </TouchableOpacity>
            </View>

            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((item) => (
                <View key={item._id} style={styles.reviewCard}>
                  <View style={styles.reviewUser}>
                    <View style={styles.userIcon}><Text style={styles.userLetter}>{item.userName?.charAt(0)}</Text></View>
                    <View style={{flex: 1}}>
                      <Text style={styles.reviewName}>{item.userName}</Text>
                      <View style={styles.starRow}>
                        {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={10} color={s <= item.rating ? "#f1c40f" : "#e2e8f0"} />)}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noReviewsBox}>
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text style={styles.noReviewsText}>No reviews yet. Be the first to share your experience!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceColumn}>
          <Text style={styles.bottomPrice}>LKR {residence.price.toLocaleString()}</Text>
          <Text style={styles.priceSub}>per night (tax included)</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, !residence.availability && styles.disabledBtn]}
          onPress={() => navigation.navigate('BookingForm', { residence })}
          disabled={!residence.availability}
        >
          <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.bookGradient}>
            <Text style={styles.bookBtnText}>{residence.availability ? 'Reserve Now' : 'Fully Booked'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 10}} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={isReviewModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewModal}>
            <Text style={styles.modalTitle}>Rate Your Stay</Text>
            <View style={styles.starPicker}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setUserRating(n)}>
                  <Ionicons name={n <= userRating ? "star" : "star-outline"} size={40} color="#f1c40f" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput 
              style={styles.reviewInput} 
              placeholder="How was your experience?" 
              multiline 
              value={userComment} 
              onChangeText={setUserComment} 
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsReviewModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Review</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, color: '#34495e', fontWeight: '600' },
  headerArea: { height: 450, position: 'relative' },
  mainHeroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  topNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  navCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroContent: { position: 'absolute', bottom: 30, left: 25, right: 25 },
  categoryTag: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  categoryText: { color: '#34495e', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  topInfo: { marginBottom: 25 },
  resName: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 8, letterSpacing: -0.5 },
  locContainer: { flexDirection: 'row', alignItems: 'center' },
  locText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#64748b' },
  mainContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, padding: 25 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 15 },
  galleryScroll: { paddingBottom: 10 },
  galleryItem: { width: 120, height: 90, borderRadius: 20, marginRight: 12, overflow: 'hidden', position: 'relative' },
  galleryImg: { width: '100%', height: '100%' },
  activeGalleryBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 3, borderColor: '#34495e', borderRadius: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  statBox: { alignItems: 'center', flex: 1 },
  statIconBox: { width: 45, height: 45, backgroundColor: '#f1f5f9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statVal: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  statLab: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  descText: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '500' },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  amenityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, width: '48%', marginBottom: 12 },
  amenityText: { marginLeft: 10, fontSize: 13, fontWeight: '700', color: '#64748b' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  avgText: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginHorizontal: 6 },
  countText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  writeReviewBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9' },
  writeReviewText: { fontSize: 13, fontWeight: '900', color: '#34495e' },
  reviewCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, marginBottom: 15 },
  reviewUser: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userLetter: { color: '#fff', fontWeight: '900', fontSize: 16 },
  reviewName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  starRow: { flexDirection: 'row', marginTop: 2 },
  reviewDate: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  noReviewsBox: { alignItems: 'center', paddingVertical: 30 },
  noReviewsText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 10, fontWeight: '600' },
  bottomBar: { paddingHorizontal: 25, paddingVertical: 18, paddingBottom: Platform.OS === 'ios' ? 40 : 30, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' },
  priceColumn: { flex: 1 },
  bottomPrice: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  priceSub: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  bookBtn: { flex: 1.2, height: 55, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: '#34495e', shadowOpacity: 0.2 },
  bookGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  disabledBtn: { opacity: 0.6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  reviewModal: { width: '85%', backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 20 },
  starPicker: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
  reviewInput: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, height: 120, textAlignVertical: 'top', fontSize: 15, color: '#1e293b', marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '900' },
  submitBtn: { flex: 1.5, backgroundColor: '#34495e', borderRadius: 15, paddingVertical: 15, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' }
});

export default ResidenceDetailScreen;
