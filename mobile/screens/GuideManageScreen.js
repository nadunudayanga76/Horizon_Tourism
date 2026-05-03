import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { guideService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getImageUrl } from '../utils/imageHelper';

const GuideManageScreen = () => {
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState(true);
  const [price, setPrice] = useState('');
  const [gender, setGender] = useState('Male');
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchGuides = async () => {
    try {
      const response = await guideService.getGuides();
      setGuides(response.data.data);
      setFilteredGuides(response.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setName(filtered);
    setErrors(prev => ({ ...prev, name: text !== filtered ? 'Only letters are allowed' : '' }));
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

  const handleLanguageChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s,]/g, '');
    setLanguage(filtered);
    setErrors(prev => ({ ...prev, language: text !== filtered ? 'Only letters and commas allowed' : '' }));
  };

  const handleExperienceChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '');
    setExperience(filtered);
    setErrors(prev => ({ ...prev, experience: text !== filtered ? 'Only numbers allowed' : '' }));
  };

  const handlePriceChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const final = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    setPrice(final);
    setErrors(prev => ({ ...prev, price: text !== final ? 'Only numbers allowed' : '' }));
  };

  const handleDescriptionChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s.,]/g, '');
    setDescription(filtered);
    setErrors(prev => ({ ...prev, description: text !== filtered ? 'Only letters allowed' : '' }));
  };

  useEffect(() => {
    let result = guides;
    
    if (activeFilter === 'Male') result = result.filter(g => g.gender === 'Male');
    if (activeFilter === 'Female') result = result.filter(g => g.gender === 'Female');
    if (activeFilter === 'Available') result = result.filter(g => g.availability === true);

    if (searchQuery) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredGuides(result);
  }, [searchQuery, activeFilter, guides]);

  useEffect(() => {
    fetchGuides();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !idNumber || !email || !phone || !language || !experience || !price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (Object.values(errors).some(e => e !== '')) {
      Alert.alert('Error', 'Please fix the validation errors before saving.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('idNumber', idNumber);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('language', language); 
      formData.append('experience', experience);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('gender', gender);
      formData.append('availability', availability);

      if (image && !image.startsWith('http')) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: image, name: filename, type });
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingId) {
        await guideService.updateGuide(editingId, formData, config);
        Alert.alert('Success', 'Tour guide updated successfully');
      } else {
        await guideService.addGuide(formData, config);
        Alert.alert('Success', 'Tour guide added successfully');
      }
      setModalVisible(false);
      resetForm();
      fetchGuides();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Action failed. Please check your data.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to remove this guide?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await guideService.deleteGuide(id);
            fetchGuides();
          } catch (err) {
            Alert.alert('Error', 'Could not delete guide');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setName('');
    setIdNumber('');
    setEmail('');
    setPhone('');
    setLanguage('');
    setExperience('');
    setDescription('');
    setPrice('');
    setGender('Male');
    setAvailability(true);
    setImage(null);
    setEditingId(null);
    setErrors({});
  };

  const openEdit = (item) => {
    // Safety checks for item properties
    const itemLang = item.language ? (Array.isArray(item.language) ? item.language.join(', ') : String(item.language)) : '';
    const itemPrice = item.price ? String(item.price) : '';
    const itemExp = item.experience ? String(item.experience) : '0';

    setName(item.name || '');
    setIdNumber(item.idNumber || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setLanguage(itemLang);
    setExperience(itemExp);
    setDescription(item.description || '');
    setPrice(itemPrice);
    setGender(item.gender || 'Male');
    setAvailability(!!item.availability);
    setImage(item.image);
    setEditingId(item._id);

    // Initial validation check for edit - only set if invalid
    const initialErrors = {};
    if (item.name && item.name !== String(item.name).replace(/[^a-zA-Z\s]/g, '')) {
      initialErrors.name = 'Only letters allowed';
    }
    if (item.idNumber && String(item.idNumber).length !== 12) {
      initialErrors.idNumber = 'ID must be 12 digits';
    }
    if (item.phone && String(item.phone).length !== 10) {
      initialErrors.phone = 'Phone must be 10 digits';
    }
    if (itemLang && itemLang !== itemLang.replace(/[^a-zA-Z\s,]/g, '')) {
      initialErrors.language = 'Only letters allowed';
    }
    
    setErrors(initialErrors);
    setModalVisible(true);
  };

  const renderGuideItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: item.availability ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>{item.availability ? 'Available' : 'Unavailable'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={20} color="#2e64e5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
            <Ionicons name="trash" size={20} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Image source={{ uri: getImageUrl(item.image) }} style={styles.listImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color="#2e64e5" />
            <Text style={[styles.cardSub, { fontWeight: 'bold', color: '#2e64e5' }]}>LKR {item.price?.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="transgender-outline" size={14} color="#666" />
            <Text style={styles.cardSub}>{item.gender}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.cardExp}>{item.experience} Years Experience</Text>
        <Text style={styles.cardLang}>{Array.isArray(item.language) ? item.language.join(' • ') : item.language}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.header}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Ionicons name="person-add" size={20} color="#2e64e5" />
            <Text style={styles.addButtonText}>Add New Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.analyticsTrigger} 
            onPress={() => setAnalyticsVisible(true)}
          >
            <Ionicons name="stats-chart" size={18} color="#2e64e5" />
            <Text style={styles.analyticsTriggerText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.analyticsModalOverlay}>
          <View style={styles.analyticsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guide Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.analyticsRow}>
                <View style={[styles.analyticsItemCard, { backgroundColor: '#eef2f8' }]}>
                  <Text style={styles.analyticsLabelDark}>Total Guides</Text>
                  <Text style={[styles.analyticsValueDark, { color: '#2e64e5' }]}>{guides.length}</Text>
                </View>
                <View style={[styles.analyticsItemCard, { backgroundColor: '#eef2f8' }]}>
                  <Text style={styles.analyticsLabelDark}>Available Now</Text>
                  <Text style={[styles.analyticsValueDark, { color: '#2ecc71' }]}>
                    {guides.filter(g => g.availability).length}
                  </Text>
                </View>
              </View>

              <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.modalChartCard}>
                <Text style={styles.chartTitle}>Gender Distribution</Text>
                <View style={styles.chartBarBg}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${(guides.filter(g => g.gender === 'Male').length / (guides.length || 1)) * 100}%`,
                        backgroundColor: '#3498db' 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${(guides.filter(g => g.gender === 'Female').length / (guides.length || 1)) * 100}%`,
                        backgroundColor: '#e91e63' 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
                    <Text style={styles.legendText}>Male ({guides.filter(g => g.gender === 'Male').length})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e91e63' }]} />
                    <Text style={styles.legendText}>Female ({guides.filter(g => g.gender === 'Female').length})</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Availability Status Chart */}
              <View style={[styles.modalWhiteCard, { marginTop: 20 }]}>
                <Text style={styles.chartTitleDark}>Availability Status</Text>
                <View style={styles.chartBarBgDark}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${(guides.filter(g => g.availability).length / (guides.length || 1)) * 100}%`,
                        backgroundColor: '#2ecc71' 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${(guides.filter(g => !g.availability).length / (guides.length || 1)) * 100}%`,
                        backgroundColor: '#e74c3c' 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.legendTextDark}>Available ({guides.filter(g => g.availability).length})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                    <Text style={styles.legendTextDark}>Booked ({guides.filter(g => !g.availability).length})</Text>
                  </View>
                </View>
              </View>

              {/* Experience Distribution Chart */}
              <View style={[styles.modalWhiteCard, { marginTop: 20 }]}>
                <Text style={styles.chartTitleDark}>Experience Distribution</Text>
                {(() => {
                  const junior = guides.filter(g => g.experience <= 5).length;
                  const mid = guides.filter(g => g.experience > 5 && g.experience <= 10).length;
                  const senior = guides.filter(g => g.experience > 10).length;
                  const total = guides.length || 1;

                  return (
                    <View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>Junior (0-5 yrs)</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(junior/total)*100}%`, backgroundColor: '#3498db' }]} />
                        </View>
                        <Text style={styles.expVal}>{junior}</Text>
                      </View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>Mid-Level (6-10 yrs)</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(mid/total)*100}%`, backgroundColor: '#f39c12' }]} />
                        </View>
                        <Text style={styles.expVal}>{mid}</Text>
                      </View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>Expert (10+ yrs)</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(senior/total)*100}%`, backgroundColor: '#9b59b6' }]} />
                        </View>
                        <Text style={styles.expVal}>{senior}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by name..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['All', 'Male', 'Female', 'Available'].map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.activeChip]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredGuides}
        keyExtractor={item => item._id}
        renderItem={renderGuideItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Update Guide' : 'Register New Guide'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: getImageUrl(image) }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>Upload Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={handleNameChange} />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>ID Number *</Text>
                  <TextInput style={styles.input} placeholder="199512345678" value={idNumber} onChangeText={handleIdChange} maxLength={12} keyboardType="numeric" />
                  {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Experience (Yrs) *</Text>
                  <TextInput style={styles.input} placeholder="5" value={experience} onChangeText={handleExperienceChange} keyboardType="numeric" />
                  {errors.experience ? <Text style={styles.errorText}>{errors.experience}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price (LKR) *</Text>
                  <TextInput style={styles.input} placeholder="1500.00" value={price} onChangeText={handlePriceChange} keyboardType="decimal-pad" />
                  {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput style={styles.input} placeholder="0771234567" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={10} />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity 
                    style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]} 
                    onPress={() => setGender('Male')}
                  >
                    <Ionicons name="male" size={18} color={gender === 'Male' ? '#fff' : '#666'} />
                    <Text style={[styles.genderBtnText, gender === 'Male' && styles.genderBtnTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]} 
                    onPress={() => setGender('Female')}
                  >
                    <Ionicons name="female" size={18} color={gender === 'Female' ? '#fff' : '#666'} />
                    <Text style={[styles.genderBtnText, gender === 'Female' && styles.genderBtnTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages (Comma separated) *</Text>
                <TextInput style={styles.input} placeholder="English, Sinhala, Tamil" value={language} onChangeText={handleLanguageChange} />
                {errors.language ? <Text style={styles.errorText}>{errors.language}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Short Description</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Tell us about the guide..." 
                  value={description} 
                  onChangeText={handleDescriptionChange} 
                  multiline={true}
                  numberOfLines={4}
                />
                {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Available for Booking</Text>
                <Switch
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={availability ? "#2e64e5" : "#f4f3f4"}
                  onValueChange={setAvailability}
                  value={availability}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Information' : 'Create Guide'}</Text>
              </TouchableOpacity>
              
              {/* Extra spacing for scroll */}
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { padding: 25, paddingBottom: 50, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, flex: 0.65 },
  addButtonText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 10, fontSize: 14 },
  analyticsTrigger: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, flex: 0.32 },
  analyticsTriggerText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  listContainer: { padding: 20, marginTop: -20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  actionBtn: { marginLeft: 15, padding: 5 },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  listImage: { width: 70, height: 70, borderRadius: 12, marginRight: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1c1c', marginBottom: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardSub: { color: '#666', marginLeft: 8, fontSize: 14 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 15, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardExp: { color: '#2e64e5', fontWeight: 'bold', fontSize: 13 },
  cardLang: { color: '#666', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  formScroll: { flex: 1 },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  pickedImage: { width: 120, height: 120, borderRadius: 60 },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  imagePlaceholderText: { fontSize: 12, color: '#999', marginTop: 5 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#e1e4e8' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4, fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12 },
  saveBtn: { backgroundColor: '#2e64e5', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 10, elevation: 5, shadowColor: '#2e64e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8' },
  genderBtnActive: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  genderBtnText: { marginLeft: 8, fontSize: 15, color: '#666', fontWeight: '600' },
  genderBtnTextActive: { color: '#fff' },

  // Updated Styles for Modal Analytics
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  analyticsTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, elevation: 2 },
  analyticsTriggerText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  
  analyticsModalOverlay: { flex: 1, backgroundColor: '#f4f7fe' },
  analyticsModalContainer: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  analyticsItemCard: { flex: 0.48, padding: 20, borderRadius: 18, alignItems: 'center', elevation: 2 },
  analyticsLabelDark: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 5 },
  analyticsValueDark: { fontSize: 24, fontWeight: 'bold' },
  
  modalChartCard: { padding: 20, borderRadius: 24, elevation: 4, marginTop: 15 },
  chartTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  chartBarBg: { height: 14, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  chartBarFill: { height: '100%' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // New Analytics Styles
  modalWhiteCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 3 },
  chartTitleDark: { color: '#1e293b', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  chartBarBgDark: { height: 14, backgroundColor: '#f0f2f5', borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  legendTextDark: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  
  expBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  expLabel: { width: 100, fontSize: 11, color: '#64748b', fontWeight: '600' },
  expBarContainer: { flex: 1, height: 8, backgroundColor: '#f0f2f5', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  expBarFill: { height: '100%', borderRadius: 4 },
  expVal: { width: 20, fontSize: 12, fontWeight: 'bold', color: '#1e293b', textAlign: 'right' },

  // Filter Styles
  filterSection: { paddingHorizontal: 20, marginTop: -15, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 15, height: 50, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  chipScroll: { marginTop: 15 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#e1e4e8', elevation: 2 },
  activeChip: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  activeChipText: { color: '#fff' }
});

export default GuideManageScreen;
