import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Modal, RefreshControl, TextInput, Alert,
  StatusBar, SafeAreaView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { reviewService, reelService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { UPLOAD_URL } from '../utils/config';

const FeedbackManageScreen = () => {
  const navigation = useNavigation();
  const [propertyReviews, setPropertyReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  
  // Reel Upload States
  const [reelModalVisible, setReelModalVisible] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'reels'
  const [allReels, setAllReels] = useState([]);
  const [editingReel, setEditingReel] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [reelErrors, setReelErrors] = useState({ title: '', description: '' });
  
  // Filter States
  const [typeFilter, setTypeFilter] = useState('All'); // 'All', 'Hotels', 'Guides'
  const [ratingFilter, setRatingFilter] = useState('All'); // 'All', '5', '4', '3', '2', '1'

  const fetchData = async () => {
    try {
      const propResponse = await reviewService.getAllReviews();
      setPropertyReviews(propResponse.data.data || []);
      setFilteredReviews(propResponse.data.data || []);

      const reelsResponse = await reelService.getReels();
      setAllReels(reelsResponse.data.data || []);
    } catch (error) {
      console.log('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  useEffect(() => {
    let result = propertyReviews;
    if (typeFilter !== 'All') {
      result = result.filter(r => typeFilter === 'Hotels' ? r.residenceId : r.guideId);
    }
    if (ratingFilter !== 'All') {
      result = result.filter(r => r.rating === parseInt(ratingFilter));
    }
    setFilteredReviews(result);
  }, [typeFilter, ratingFilter, propertyReviews]);

  // ─── Analytics Calculations ───────────────────────────────────────────────
  // Use filteredReviews for live dashboard stats
  const currentReviews = filteredReviews;
  const allData = propertyReviews; // Keep global for some stats if needed
  
  const totalInView = currentReviews.length;
  const totalGlobal = allData.length;

  const avgRating = totalInView > 0
    ? (currentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalInView).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: currentReviews.filter(r => r.rating === star).length,
  }));

  const guideReviews = currentReviews.filter(r => r.guideId);
  const residenceReviews = currentReviews.filter(r => r.residenceId);

  const avgGuideRating = guideReviews.length > 0
    ? (guideReviews.reduce((s, r) => s + r.rating, 0) / guideReviews.length).toFixed(1)
    : 'N/A';

  const avgResidenceRating = residenceReviews.length > 0
    ? (residenceReviews.reduce((s, r) => s + r.rating, 0) / residenceReviews.length).toFixed(1)
    : 'N/A';

  const positive = currentReviews.filter(r => r.rating >= 4).length;
  const negative = currentReviews.filter(r => r.rating <= 2).length;
  const neutral  = currentReviews.filter(r => r.rating === 3).length;

  // ─── Reel Upload Logic ───────────────────────────────────────────────────
  const openReelModal = () => {
    setReelModalVisible(true);
  };

  const handleSelectVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0]);
    }
  };

  const handleEditReel = (reel) => {
    setEditingReel(reel);
    setReelTitle(reel.title);
    setReelDescription(reel.description);
    setReelModalVisible(true);
  };

  const handleDeleteReel = async (id) => {
    Alert.alert(
      "Delete Reel",
      "Are you sure you want to delete this reel?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await reelService.deleteReel(id);
              if (res.data.success) {
                Alert.alert('Success', 'Reel deleted successfully');
                fetchData();
              }
            } catch (error) {
              Alert.alert('Error', 'Error deleting reel');
            }
          }
        }
      ]
    );
  };

  const handleDeleteReview = async (id) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await reviewService.deleteReview(id);
              if (res.data.success) {
                Alert.alert('Success', 'Review deleted successfully');
                fetchData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          }
        }
      ]
    );
  };



  const handleUploadReel = async () => {
    if (editingReel) {
      // --- VALIDATION START: Check mandatory fields for Marketing Reels ---
      if (!reelTitle.trim() || !reelDescription.trim()) {
        setReelErrors({
          title: !reelTitle.trim() ? 'Title is required' : '',
          description: !reelDescription.trim() ? 'Description is required' : ''
        });
        return;
      }
      // --- VALIDATION END ---
      // Update logic
      setUploading(true);
      try {
        const response = await reelService.updateReel(editingReel._id, {
          title: reelTitle,
          description: reelDescription
        });
        if (response.data.success) {
          alert('Reel updated successfully!');
          setReelModalVisible(false);
          setEditingReel(null);
          setReelTitle('');
          setReelDescription('');
          fetchData();
        }
      } catch (error) {
        alert('Error updating reel');
      } finally {
        setUploading(false);
      }
      return;
    }

    // ═══════════════════════════════════════════════
    // VALIDATION START — Marketing Reel Create Form
    // Rule 1: Title and Description are mandatory fields
    if (!reelTitle.trim() || !reelDescription.trim()) {
      setReelErrors({
        title: !reelTitle.trim() ? 'Title is required' : '',
        description: !reelDescription.trim() ? 'Description is required' : ''
      });
      return;
    }
    // Rule 2: A video file must be selected before publishing
    if (!selectedVideo) {
      alert('Please select a video file first');
      return;
    }
    // VALIDATION END
    // ═══════════════════════════════════════════════

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', reelTitle);
      formData.append('description', reelDescription);
      
      const uri = selectedVideo.uri;
      const fileName = selectedVideo.fileName || uri.split('/').pop();
      const fileType = selectedVideo.mimeType || `video/${uri.split('.').pop()}`;

      formData.append('video', {
        uri,
        name: fileName,
        type: fileType,
      });

      const response = await reelService.createReel(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        alert('Reel uploaded successfully!');
        setReelModalVisible(false);
        setReelTitle('');
        setReelDescription('');
        setSelectedVideo(null);
      }
    } catch (error) {
      console.log('Error uploading reel:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload reel';
      alert(`Upload Error: ${errorMsg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────
  const renderReelItem = ({ item }) => (
    <View style={styles.reelManageCard}>
      <View style={styles.reelPreviewBox}>
        <Video
          source={{ uri: `${UPLOAD_URL}/${item.videoUrl}` }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted={true}
        />
        <Ionicons name="film" size={24} color="rgba(126, 34, 206, 0.6)" />
        <Text style={styles.reelPreviewDuration}>Reel</Text>
      </View>
      <View style={styles.reelManageInfo}>
        <Text style={styles.reelManageTitle}>{item.title}</Text>
        <Text style={styles.reelManageDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.reelManageDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.reelActionBtns}>
        <TouchableOpacity style={styles.reelEditBtn} onPress={() => handleEditReel(item)}>
          <Ionicons name="create-outline" size={18} color="#2e64e5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reelDeleteBtn} onPress={() => handleDeleteReel(item._id)}>
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const StarBar = ({ star, count, max }) => {
    const pct = max > 0 ? (count / max) * 100 : 0;
    const color = star >= 4 ? '#2ecc71' : star === 3 ? '#f39c12' : '#e74c3c';
    return (
      <View style={styles.starBarRow}>
        <View style={styles.starBarLabel}>
          <Ionicons name="star" size={11} color="#f1c40f" />
          <Text style={styles.starBarNum}>{star}</Text>
        </View>
        <View style={styles.starBarTrack}>
          <View style={[styles.starBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.starBarCount}>{count}</Text>
      </View>
    );
  };


  const renderPropertyItem = ({ item }) => {
    const isGuide = !!item.guideId;
    const target = isGuide
      ? (item.guideId?.name || 'Tour Guide')
      : (item.residenceId?.name || 'Property');
    return (
      <View style={[styles.card, isGuide ? styles.guideCard : styles.propertyCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: '#34495e' }]}>
              <Text style={styles.avatarText}>{item.userName?.charAt(0) || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userText}>{item.userName}</Text>
              <Text style={styles.propertyTarget}>
                <Ionicons name={isGuide ? 'person' : 'business'} size={11} color="#34495e" />
                {' '}{target}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={13} color="#F7B731" />
            ))}
          </View>
        </View>
        <Text style={styles.commentText}>{item.comment}</Text>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.tagText, { color: '#34495e' }]}>
              {isGuide ? 'GUIDE' : 'PROPERTY'}
            </Text>
          </View>
          <View style={styles.cardFooterActions}>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => handleDeleteReview(item._id)} style={styles.reviewDeleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#34495e" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Branded Premium Header */}
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          {/* Decorative background element */}
          <View style={styles.headerDecoration} />
          
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Feedback Dashboard</Text>
              <View style={styles.realtimeRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.headerSub}>Live Insights</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.glassAnalyticsTrigger} onPress={() => setAnalyticsVisible(true)}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerStatsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Feedback</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{totalGlobal}</Text>
                <Text style={styles.statUnit}>Reviews</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.premiumCreateBtn} onPress={openReelModal}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.btnInnerGrad}>
                <Ionicons name="videocam" size={20} color="#34495e" />
                <Text style={styles.btnText}>Create Reel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.pillRow}>
            <View style={styles.glassPill}>
              <Ionicons name="star" size={14} color="#f1c40f" />
              <Text style={styles.pillText}>{avgRating} Rating</Text>
            </View>
            <View style={styles.glassPill}>
              <Ionicons name="checkmark-done-circle" size={16} color="#2ecc71" />
              <Text style={styles.pillText}>{positive} Positive</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} 
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons name="chatbubbles" size={16} color={activeTab === 'reviews' ? '#34495e' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>User Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reels' && styles.activeTab]} 
          onPress={() => setActiveTab('reels')}
        >
          <Ionicons name="videocam" size={16} color={activeTab === 'reels' ? '#34495e' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>Marketing Reels</Text>
        </TouchableOpacity>
      </View>

      {/* Filters (Only for Reviews) */}
      {activeTab === 'reviews' && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterGroup}>
              {['All', 'Hotels', 'Guides'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.filterChip, typeFilter === type && styles.activeFilterChip]}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text style={[styles.filterChipText, typeFilter === type && styles.activeFilterChipText]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.filterGroup}>
              {['All', '5', '4', '3', '2', '1'].map(star => (
                <TouchableOpacity 
                  key={star} 
                  style={[styles.filterChip, ratingFilter === star && styles.activeFilterChip]}
                  onPress={() => setRatingFilter(star)}
                >
                  <Text style={[styles.filterChipText, ratingFilter === star && styles.activeFilterChipText]}>
                    {star === 'All' ? 'All' : `${star} ★`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* List */}
      <FlatList
        data={activeTab === 'reviews' ? filteredReviews : allReels}
        keyExtractor={item => item._id}
        renderItem={activeTab === 'reviews' ? renderPropertyItem : renderReelItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={activeTab === 'reviews' ? "star-half-outline" : "videocam-outline"} size={60} color="#ddd" />
            <Text style={styles.emptyText}>
              {activeTab === 'reviews' ? 'No reviews match your filters' : 'No marketing reels found'}
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7e22ce" />}
      />

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Feedback Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

              {/* ── Overall Score ── */}
              <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.scoreCard}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreNum}>{avgRating}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(parseFloat(avgRating)) ? 'star' : 'star-outline'}
                        size={16}
                        color="#f1c40f"
                      />
                    ))}
                  </View>
                  <Text style={styles.scoreLabel}>Overall Rating</Text>
                </View>
                <View style={styles.scoreRight}>
                  {ratingCounts.map(({ star, count }) => (
                    <StarBar key={star} star={star} count={count} max={totalInView} />
                  ))}
                </View>
              </LinearGradient>

              {/* ── Sentiment breakdown ── */}
              <View style={styles.sentimentRow}>
                <View style={[styles.sentimentCard, { borderTopColor: '#2ecc71' }]}>
                  <Ionicons name="happy-outline" size={26} color="#2ecc71" />
                  <Text style={[styles.sentimentNum, { color: '#2ecc71' }]}>{positive}</Text>
                  <Text style={styles.sentimentLabel}>Positive{'\n'}(4-5 ★)</Text>
                </View>
                <View style={[styles.sentimentCard, { borderTopColor: '#f39c12' }]}>
                  <Ionicons name="remove-circle-outline" size={26} color="#f39c12" />
                  <Text style={[styles.sentimentNum, { color: '#f39c12' }]}>{neutral}</Text>
                  <Text style={styles.sentimentLabel}>Neutral{'\n'}(3 ★)</Text>
                </View>
                <View style={[styles.sentimentCard, { borderTopColor: '#e74c3c' }]}>
                  <Ionicons name="sad-outline" size={26} color="#e74c3c" />
                  <Text style={[styles.sentimentNum, { color: '#e74c3c' }]}>{negative}</Text>
                  <Text style={styles.sentimentLabel}>Critical{'\n'}(1-2 ★)</Text>
                </View>
              </View>

              {/* ── Feedback volume ── */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeader}>
                  <Ionicons name="pie-chart-outline" size={20} color="#34495e" />
                  <Text style={styles.analyticsTitle}>Feedback Volume</Text>
                </View>
                <View style={styles.volumeRow}>
                    {[
                    { label: 'Guide Reviews', count: guideReviews.length, color: '#34495e', icon: 'person' },
                    { label: 'Property Reviews', count: residenceReviews.length, color: '#2e64e5', icon: 'business' },
                  ].map(({ label, count, color, icon }) => {
                    const pct = totalInView > 0 ? ((count / totalInView) * 100).toFixed(0) : 0;
                    return (
                      <View key={label} style={styles.volumeItem}>
                        <View style={[styles.volumeIcon, { backgroundColor: color + '22' }]}>
                          <Ionicons name={icon} size={18} color={color} />
                        </View>
                        <Text style={styles.volumeNum}>{count}</Text>
                        <Text style={styles.volumeLabel}>{label}</Text>
                        <View style={styles.volumeBarTrack}>
                          <View style={[styles.volumeBarFill, { height: `${pct}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.volumePct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ── Category ratings ── */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeader}>
                  <Ionicons name="bar-chart-outline" size={20} color="#34495e" />
                  <Text style={styles.analyticsTitle}>Category Ratings</Text>
                </View>
                {[
                  { label: 'Tour Guides', avg: avgGuideRating, count: guideReviews.length, color: '#34495e' },
                  { label: 'Properties', avg: avgResidenceRating, count: residenceReviews.length, color: '#2e64e5' },
                  { label: 'Current View', avg: avgRating, count: totalInView, color: '#ff7675' },
                ].map(({ label, avg, count, color }) => {
                  const pct = avg !== 'N/A' ? (parseFloat(avg) / 5) * 100 : 0;
                  return (
                    <View key={label} style={styles.catRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.catLabelRow}>
                          <Text style={styles.catLabel}>{label}</Text>
                          <Text style={[styles.catAvg, { color }]}>{avg} ★</Text>
                        </View>
                        <View style={styles.catTrack}>
                          <View style={[styles.catFill, { width: `${pct}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.catCount}>{count} reviews</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* ── Summary stats ── */}
              <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.summaryGrad}>
                <View style={styles.summaryRow}>
                  {[
                    { label: 'Total In View', value: totalInView, icon: 'chatbubbles' },
                    { label: 'This Month', value: currentReviews.filter(r => {
                        const d = new Date(r.createdAt);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      }).length, icon: 'calendar' },
                    { label: 'Selected Avg', value: avgRating + '★', icon: 'star' },
                  ].map(({ label, value, icon }) => (
                    <View key={label} style={styles.summaryItem}>
                      <Ionicons name={icon} size={22} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.summaryValue}>{value}</Text>
                      <Text style={styles.summaryLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reel Creation Modal */}
      <Modal visible={reelModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '85%' }]}>
            <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.formHeader}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.formTitle}>{editingReel ? 'Update Reel' : 'Create New Reel'}</Text>
                  <Text style={styles.formSub}>{editingReel ? 'Make changes to your reel' : 'Share your amazing journey'}</Text>
                </View>
                <TouchableOpacity onPress={() => { setReelModalVisible(false); setEditingReel(null); setReelTitle(''); setReelDescription(''); }} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
              <View style={styles.uploadForm}>
                
                {/* Video Selection Area (Only for Create Mode) */}
                {!editingReel && (
                  <>
                    <Text style={styles.inputLabel}>Marketing Video</Text>
                    {!selectedVideo ? (
                      <TouchableOpacity style={styles.videoPicker} onPress={handleSelectVideo}>
                        <LinearGradient colors={['#f8f9fa', '#e2e8f0']} style={styles.pickerGradient}>
                          <View style={styles.pickerIconBg}>
                            <Ionicons name="videocam" size={32} color="#7e22ce" />
                          </View>
                          <Text style={styles.pickerTitle}>Select Video File</Text>
                          <Text style={styles.pickerSub}>MP4, MOV up to 15MB</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.selectedVideoCard}>
                        <View style={styles.videoInfoRow}>
                          <View style={styles.videoIconBox}>
                            <Ionicons name="film" size={24} color="#7e22ce" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.videoFileName} numberOfLines={1}>
                              {selectedVideo.uri.split('/').pop()}
                            </Text>
                            <Text style={styles.videoFileSize}>
                              {((selectedVideo.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB • Ready
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedVideo(null)} style={styles.removeVideoBtn}>
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {editingReel && (
                  <View style={[styles.selectedVideoCard, { backgroundColor: '#f1f5f9', borderStyle: 'dashed' }]}>
                    <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                      <Ionicons name="information-circle-outline" size={14} /> Video content cannot be changed during edit. Create a new reel if you want to change the video.
                    </Text>
                  </View>
                )}

                {/* Title Input */}
                <Text style={[styles.inputLabel, { marginTop: 24 }]}>Reel Title</Text>
                <View style={[styles.inputWrapper, reelErrors.title ? styles.inputError : null]}>
                  <Ionicons name="text-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="E.g. Amazing Sunset in Ella"
                    value={reelTitle}
                    onChangeText={(txt) => {
                      setReelTitle(txt);
                      setReelErrors(prev => ({ ...prev, title: txt.trim() ? '' : 'Title is required' }));
                    }}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                {reelErrors.title ? <Text style={styles.liveErrorText}>{reelErrors.title}</Text> : null}

                {/* Description Input */}
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>Reel Description</Text>
                <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingVertical: 12 }, reelErrors.description ? styles.inputError : null]}>
                  <Ionicons name="document-text-outline" size={20} color="#64748b" style={[styles.inputIcon, { marginTop: 2 }]} />
                  <TextInput 
                    style={[styles.textInput, { textAlignVertical: 'top' }]}
                    placeholder="Tell us more about this reel..."
                    value={reelDescription}
                    onChangeText={(txt) => {
                      setReelDescription(txt);
                      setReelErrors(prev => ({ ...prev, description: txt.trim() ? '' : 'Description is required' }));
                    }}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                {reelErrors.description ? <Text style={styles.liveErrorText}>{reelErrors.description}</Text> : null}

                {/* Upload Action */}
                <TouchableOpacity 
                  style={[styles.uploadButton, (uploading || (!selectedVideo && !editingReel)) && styles.disabledButton]} 
                  onPress={handleUploadReel}
                  disabled={uploading || (!selectedVideo && !editingReel)}
                >
                  <LinearGradient 
                    colors={uploading || (!selectedVideo && !editingReel) ? ['#cbd5e1', '#94a3b8'] : ['#34495e', '#2c3e50']} 
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {uploading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator color="#fff" />
                        <Text style={[styles.uploadButtonText, { marginLeft: 10 }]}>
                          {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Connecting...'}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name={editingReel ? "save-outline" : "cloud-upload"} size={22} color="#fff" />
                        <Text style={styles.uploadButtonText}>{editingReel ? 'Update Reel Details' : 'Publish Marketing Reel'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                {(!selectedVideo && !editingReel) && (
                  <Text style={styles.helperText}>* Please select a video to enable publishing</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Branded Premium Header
  header: { paddingBottom: 30, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  headerDecoration: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, marginBottom: 35 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  realtimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginRight: 8 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  
  glassAnalyticsTrigger: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  headerStatsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: { fontSize: 44, fontWeight: '900', color: '#fff', lineHeight: 48 },
  statUnit: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  
  premiumCreateBtn: { borderRadius: 18, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  btnInnerGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  btnText: { color: '#34495e', fontWeight: '900', fontSize: 14 },

  pillRow: { flexDirection: 'row', gap: 12 },
  glassPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, elevation: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderBottomWidth: 3, borderBottomColor: 'transparent', gap: 10 },
  activeTab: { borderBottomColor: '#34495e' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  activeTabText: { color: '#34495e' },

  // Filters
  filterSection: { backgroundColor: '#fff', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterScroll: { paddingHorizontal: 20 },
  filterGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  activeFilterChip: { backgroundColor: '#34495e', borderColor: '#34495e' },
  filterChipText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  activeFilterChipText: { color: '#fff' },

  // Feed Cards
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  propertyCard: { borderLeftWidth: 5, borderLeftColor: '#2e64e5' },
  guideCard: { borderLeftWidth: 5, borderLeftColor: '#34495e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  userText: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  propertyTarget: { fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: '600' },
  ratingContainer: { flexDirection: 'row', gap: 2 },
  commentText: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 15, fontWeight: '500' },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, color: '#94a3b8', fontSize: 16, fontWeight: '600' },

  // Analytics Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#f8fafc', borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '92%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },

  scoreCard: { borderRadius: 25, padding: 25, flexDirection: 'row', marginBottom: 20, elevation: 8 },
  scoreLeft: { alignItems: 'center', justifyContent: 'center', width: 100 },
  scoreNum: { fontSize: 56, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: '700', textTransform: 'uppercase' },
  scoreRight: { flex: 1, justifyContent: 'center' },
  starBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  starBarLabel: { flexDirection: 'row', alignItems: 'center', width: 30 },
  starBarNum: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: '800' },
  starBarTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  starBarFill: { height: '100%', borderRadius: 4 },
  starBarCount: { color: 'rgba(255,255,255,0.9)', fontSize: 11, width: 25, textAlign: 'right', fontWeight: '700' },

  sentimentRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sentimentCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, alignItems: 'center', elevation: 3, borderTopWidth: 5 },
  sentimentNum: { fontSize: 26, fontWeight: '900', marginTop: 8 },
  sentimentLabel: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 5, fontWeight: '700', textTransform: 'uppercase' },

  analyticsCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 3 },
  analyticsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  analyticsTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },

  volumeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  volumeItem: { alignItems: 'center', width: 100 },
  volumeIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  volumeNum: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  volumeLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 12, fontWeight: '700' },
  volumeBarTrack: { width: 10, height: 70, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end' },
  volumeBarFill: { width: '100%', borderRadius: 5 },
  volumePct: { fontSize: 12, color: '#34495e', marginTop: 8, fontWeight: '800' },

  catRow: { marginBottom: 20 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  catAvg: { fontSize: 15, fontWeight: '900' },
  catTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  catFill: { height: '100%', borderRadius: 5 },
  catCount: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  cardFooterActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewDeleteBtn: { padding: 5, borderRadius: 8, backgroundColor: '#fef2f2' },

  summaryGrad: { borderRadius: 25, padding: 25, marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 8 },
  summaryValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase' },

  // Reels
  reelManageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 25, marginBottom: 12, elevation: 3 },
  reelPreviewBox: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#f1f5f9', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  reelPreviewDuration: { position: 'absolute', bottom: 4, right: 4, fontSize: 8, color: '#fff', fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 4 },
  reelManageInfo: { flex: 1, marginLeft: 15 },
  reelManageTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  reelManageDesc: { fontSize: 13, color: '#64748b', marginTop: 3 },
  reelManageDate: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '600' },
  reelActionBtns: { flexDirection: 'row', gap: 10 },
  reelEditBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  reelDeleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },

  // Form
  formHeader: { padding: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  formSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: '600' },
  closeModalBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  uploadForm: { marginTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#f1f5f9', paddingHorizontal: 15, height: 55 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  videoPicker: { borderRadius: 25, overflow: 'hidden', marginTop: 5 },
  pickerGradient: { padding: 35, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 25, backgroundColor: '#f8fafc' },
  pickerIconBg: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  pickerSub: { fontSize: 13, color: '#94a3b8', marginTop: 5, fontWeight: '600' },
  selectedVideoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 10, borderWidth: 1.5, borderColor: '#34495e', elevation: 4 },
  videoInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  videoIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  videoFileName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  videoFileSize: { fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: '600' },
  removeVideoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  uploadButton: { height: 60, borderRadius: 20, marginTop: 40, overflow: 'hidden', elevation: 8 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  disabledButton: { opacity: 0.6 },
  helperText: { fontSize: 12, color: '#ef4444', marginTop: 15, textAlign: 'center', fontWeight: '800' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  liveErrorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginTop: 5, marginLeft: 5 },
});

export default FeedbackManageScreen;
