import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, SafeAreaView, Modal, TextInput, Alert } from 'react-native';
import { residenceService, reviewService } from '../services/api';
import { API_URL } from '../utils/config';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageHelper';

const { width, height } = Dimensions.get('window');

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
    navigation.setOptions({
      headerShown: false,
    });
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
      
      // Refresh reviews
      const response = await reviewService.getResidenceReviews(id);
      setReviews(response.data.data);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Could not submit review';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleBooking = () => {
    navigation.navigate('BookingForm', { residence });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!residence) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Residence not found</Text>
      </View>
    );
  }

  const allImages = residence.images?.length > 0 ? residence.images : (residence.image ? [residence.image] : []);
  const mainImageToShow = selectedImage || allImages[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';
  
  const imageUrl = getImageUrl(mainImageToShow);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.mainImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.imageGradient}
          />
          <SafeAreaView style={styles.topActions}>
            <TouchableOpacity style={styles.actionCircle} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content Box */}
        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.residenceName}>{residence.name}</Text>
              <Text style={styles.locationText}>{residence.location}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>${residence.price}</Text>
              <Text style={styles.pricePer}>/night</Text>
            </View>
          </View>

          {allImages.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {allImages.map((imgUri, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImage(imgUri)}>
                  <View style={[styles.galleryImageContainer, selectedImage === imgUri && { opacity: 0.6 }]}>
                    <Image source={{ uri: getImageUrl(imgUri) }} style={styles.galleryImage} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.sectionTitle}>Property details</Text>
          <View style={styles.pillsRow}>
            <View style={styles.pill}><Ionicons name="scan-outline" size={14} color="#555" /><Text style={styles.pillText}>150 m²</Text></View>
            <View style={styles.pill}><Ionicons name="person-outline" size={14} color="#555" /><Text style={styles.pillText}>4 guests</Text></View>
            <View style={styles.pill}><MaterialIcons name="bathtub" size={14} color="#555" /><Text style={styles.pillText}>1 bath</Text></View>
            <View style={styles.pill}><Ionicons name="bed-outline" size={14} color="#555" /><Text style={styles.pillText}>2 beds</Text></View>
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {residence.description || "Experience luxury and comfort in the heart of the city."}
            <Text style={styles.readMore}> Read more</Text>
          </Text>

          {/* Ratings & Reviews Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Rating and reviews</Text>
            <TouchableOpacity 
              style={styles.addReviewBtn} 
              onPress={() => setIsReviewModalVisible(true)}
            >
              <Ionicons name="create-outline" size={16} color="#2e64e5" />
              <Text style={styles.addReviewBtnText}>Rate & Review</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#f1c40f" />
            <Text style={styles.ratingScore}> {avgRating}</Text>
            <Text style={styles.ratingCount}> • {reviews.length} reviews</Text>
          </View>

          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.slice(0, 3).map((item) => (
                <View key={item._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserBadge}>
                      <Text style={styles.badgeText}>{item.userName?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUserName}>{item.userName}</Text>
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons 
                            key={star} 
                            name="star" 
                            size={12} 
                            color={star <= item.rating ? "#f1c40f" : "#eee"} 
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noReviews}>No reviews yet. Be the first to rate!</Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalPrice}>LKR {residence.price} <Text style={{ fontSize: 16, fontWeight: 'normal' }}>total</Text></Text>
          <Text style={styles.priceSub}>Per night • Best rate</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, !residence.availability && { backgroundColor: '#999' }]}
          onPress={handleBooking}
          disabled={!residence.availability}
        >
          <Text style={styles.bookBtnText}>{residence.availability ? 'Book now' : 'Sold Out'}</Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReviewModalVisible}
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate your experience</Text>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity key={num} onPress={() => setUserRating(num)}>
                  <Ionicons 
                    name={num <= userRating ? "star" : "star-outline"} 
                    size={36} 
                    color="#f1c40f" 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review here..."
              multiline
              numberOfLines={4}
              value={userComment}
              onChangeText={setUserComment}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsReviewModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  imageContainer: { width: width, height: height * 0.45 },
  mainImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  topActions: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  actionCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  contentBox: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  residenceName: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  locationText: { fontSize: 15, color: '#777' },
  priceContainer: { alignItems: 'flex-end' },
  priceAmount: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  pricePer: { fontSize: 14, color: '#777' },
  galleryScroll: { marginBottom: 25 },
  galleryImageContainer: { width: 100, height: 80, marginRight: 10, borderRadius: 12, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginTop: 10 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  pillText: { fontSize: 13, color: '#333', marginLeft: 6, fontWeight: '500' },
  description: { fontSize: 15, color: '#444', lineHeight: 24, marginBottom: 20 },
  readMore: { fontWeight: '700', color: '#1a1a1a' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 5 },
  addReviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addReviewBtnText: { fontSize: 13, fontWeight: '600', color: '#2e64e5', marginLeft: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  ratingScore: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  ratingCount: { fontSize: 16, color: '#777' },
  reviewsList: { marginTop: 15 },
  reviewCard: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewUserBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2e64e5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  reviewUserName: { fontSize: 15, fontWeight: '700', color: '#333' },
  starRow: { flexDirection: 'row', marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewComment: { fontSize: 14, color: '#555', lineHeight: 20 },
  noReviews: { fontSize: 14, color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingHorizontal: 24, paddingTop: 15, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  priceSub: { fontSize: 13, color: '#777', marginTop: 2 },
  bookBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 20, textAlign: 'center' },
  ratingPicker: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  reviewInput: { backgroundColor: '#f5f5f5', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 15, color: '#333', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 10 },
  cancelBtnText: { color: '#777', fontSize: 16, fontWeight: '600' },
  submitBtn: { flex: 2, backgroundColor: '#2e64e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 18, color: 'red' },
});

export default ResidenceDetailScreen;
