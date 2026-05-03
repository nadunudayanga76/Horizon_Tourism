import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Modal, RefreshControl, TextInput, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { feedbackService, reviewService, reelService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { UPLOAD_URL } from '../utils/config';

const FeedbackManageScreen = () => {
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

  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleUploadReel = async () => {
    if (editingReel) {
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

    if (!selectedVideo) {
      alert('Please select a video file first');
      return;
    }
    if (!reelTitle.trim()) {
      alert('Please enter a title for your reel');
      return;
    }

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
            <View style={[styles.avatar, { backgroundColor: isGuide ? '#7e22ce' : '#2e64e5' }]}>
              <Text style={styles.avatarText}>{item.userName?.charAt(0) || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userText}>{item.userName}</Text>
              <Text style={styles.propertyTarget}>
                <Ionicons name={isGuide ? 'person' : 'business'} size={11} color={isGuide ? '#7e22ce' : '#2e64e5'} />
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
          <View style={[styles.tag, { backgroundColor: isGuide ? '#f5f3ff' : '#e0e7ff' }]}>
            <Text style={[styles.tagText, { color: isGuide ? '#7e22ce' : '#2e64e5' }]}>
              {isGuide ? 'GUIDE' : 'PROPERTY'}
            </Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#7e22ce" />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <LinearGradient colors={['#7e22ce', '#4f14a1']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Feedback Dashboard</Text>
            <Text style={styles.headerSub}>
              {typeFilter === 'All' && ratingFilter === 'All' 
                ? `${totalGlobal} total reviews collected`
                : `${totalInView} reviews match current filters`}
            </Text>
          </View>
          <TouchableOpacity style={styles.analyticsTrigger} onPress={() => setAnalyticsVisible(true)}>
            <Ionicons name="stats-chart" size={18} color="#fff" />
            <Text style={styles.analyticsTriggerText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity 
            style={[styles.analyticsTrigger, { backgroundColor: '#ff7675', elevation: 4 }]} 
            onPress={openReelModal}
          >
            <Ionicons name="videocam" size={18} color="#fff" />
            <Text style={styles.analyticsTriggerText}>Create Reel</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stat pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Ionicons name="star" size={14} color="#f1c40f" />
            <Text style={styles.pillText}>{avgRating} avg</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="thumbs-up-outline" size={14} color="#2ecc71" />
            <Text style={styles.pillText}>{positive} positive</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="thumbs-down-outline" size={14} color="#e74c3c" />
            <Text style={styles.pillText}>{negative} critical</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} 
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons name="star" size={16} color={activeTab === 'reviews' ? '#7e22ce' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>User Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reels' && styles.activeTab]} 
          onPress={() => setActiveTab('reels')}
        >
          <Ionicons name="videocam" size={16} color={activeTab === 'reels' ? '#7e22ce' : '#64748b'} />
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
                    {star === 'All' ? 'All Stars' : `${star} ★`}
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
              <LinearGradient colors={['#7e22ce', '#4f14a1']} style={styles.scoreCard}>
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
                  <Ionicons name="pie-chart-outline" size={20} color="#7e22ce" />
                  <Text style={styles.analyticsTitle}>Feedback Volume</Text>
                </View>
                <View style={styles.volumeRow}>
                  {[
                    { label: 'Guide Reviews', count: guideReviews.length, color: '#7e22ce', icon: 'person' },
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
                  <Ionicons name="bar-chart-outline" size={20} color="#7e22ce" />
                  <Text style={styles.analyticsTitle}>Category Ratings</Text>
                </View>
                {[
                  { label: 'Tour Guides', avg: avgGuideRating, count: guideReviews.length, color: '#7e22ce' },
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
            <LinearGradient colors={['#7e22ce', '#4f14a1']} style={styles.formHeader}>
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
                <View style={styles.inputWrapper}>
                  <Ionicons name="text-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="E.g. Amazing Sunset in Ella"
                    value={reelTitle}
                    onChangeText={setReelTitle}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Description Input */}
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>Reel Description</Text>
                <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
                  <Ionicons name="document-text-outline" size={20} color="#64748b" style={[styles.inputIcon, { marginTop: 2 }]} />
                  <TextInput 
                    style={[styles.textInput, { textAlignVertical: 'top' }]}
                    placeholder="Tell us more about this reel..."
                    value={reelDescription}
                    onChangeText={setReelDescription}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Upload Action */}
                <TouchableOpacity 
                  style={[styles.uploadButton, (uploading || (!selectedVideo && !editingReel)) && styles.disabledButton]} 
                  onPress={handleUploadReel}
                  disabled={uploading || (!selectedVideo && !editingReel)}
                >
                  <LinearGradient 
                    colors={uploading || (!selectedVideo && !editingReel) ? ['#cbd5e1', '#94a3b8'] : ['#7e22ce', '#4f14a1']} 
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  analyticsTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  analyticsTriggerText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Filters
  filterSection: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterScroll: { paddingHorizontal: 16 },
  filterGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  divider: { width: 1, height: 20, backgroundColor: '#ddd', marginHorizontal: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeFilterChip: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' },
  filterChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeFilterChipText: { color: '#fff' },
  // Cards
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  propertyCard: { borderLeftWidth: 4, borderLeftColor: '#2e64e5' },
  guideCard: { borderLeftWidth: 4, borderLeftColor: '#7e22ce' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff7675', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  propertyTarget: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ratingContainer: { flexDirection: 'row', marginTop: 2 },
  commentText: { fontSize: 14, color: '#444', lineHeight: 21, marginBottom: 10 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: '#f1f5f9' },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: '#94a3b8' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, color: '#999', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#f8f9fa', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },

  // Score card
  scoreCard: { borderRadius: 20, padding: 22, flexDirection: 'row', marginBottom: 20, gap: 20 },
  scoreLeft: { alignItems: 'center', justifyContent: 'center', width: 90 },
  scoreNum: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 58 },
  scoreLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center' },
  scoreRight: { flex: 1, justifyContent: 'center' },
  starBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  starBarLabel: { flexDirection: 'row', alignItems: 'center', width: 28 },
  starBarNum: { color: '#fff', fontSize: 11, marginLeft: 2 },
  starBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  starBarFill: { height: '100%', borderRadius: 3 },
  starBarCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11, width: 22, textAlign: 'right' },

  // Sentiment
  sentimentRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sentimentCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2, borderTopWidth: 4 },
  sentimentNum: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  sentimentLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  // Analytics card
  analyticsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  analyticsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  analyticsTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  // Volume
  volumeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  volumeItem: { alignItems: 'center', width: 80 },
  volumeIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  volumeNum: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  volumeLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2, marginBottom: 8 },
  volumeBarTrack: { width: 8, height: 60, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  volumeBarFill: { width: '100%', borderRadius: 4 },
  volumePct: { fontSize: 11, color: '#94a3b8', marginTop: 6 },

  // Category
  catRow: { marginBottom: 16 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  catAvg: { fontSize: 14, fontWeight: '700' },
  catTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  catFill: { height: '100%', borderRadius: 4 },
  catCount: { fontSize: 11, color: '#94a3b8' },

  // Summary gradient
  summaryGrad: { borderRadius: 20, padding: 20, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  // Reel Upload Styles
  uploadForm: { marginTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  videoPreviewPlaceholder: { height: 150, backgroundColor: '#f1f5f9', borderRadius: 16, marginTop: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1' },
  videoPreviewText: { marginTop: 10, color: '#64748b', fontSize: 14, fontWeight: '600' },
  uploadButton: { height: 55, borderRadius: 15, marginTop: 35, overflow: 'hidden', elevation: 4, shadowColor: '#7e22ce', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  disabledButton: { opacity: 0.8, elevation: 0 },

  // New Form Styles
  formHeader: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  formSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  closeModalBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  videoPicker: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
  pickerGradient: { padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 20 },
  pickerIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 2 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  pickerSub: { fontSize: 12, color: '#64748b', marginTop: 4 },

  selectedVideoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  videoInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  videoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  videoFileName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  videoFileSize: { fontSize: 12, color: '#64748b', marginTop: 2 },
  removeVideoBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center' },
  
  helperText: { fontSize: 11, color: '#e74c3c', marginTop: 12, textAlign: 'center', fontWeight: '600' },

  // Tab Styles
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent', gap: 8 },
  activeTab: { borderBottomColor: '#7e22ce' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#7e22ce' },

  // Reel Manage Styles
  reelManageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  reelPreviewBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  reelPreviewDuration: { fontSize: 9, color: '#7e22ce', fontWeight: '800', marginTop: 2 },
  reelManageInfo: { flex: 1, marginLeft: 12 },
  reelManageTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  reelManageDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  reelManageDate: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  reelActionBtns: { flexDirection: 'row', gap: 8 },
  reelEditBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  reelDeleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
});

export default FeedbackManageScreen;
