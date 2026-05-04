import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { guideService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getImageUrl } from '../utils/imageHelper';

const GuideManageScreen = () => {
  const navigation = useNavigation();
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
    // ═══════════════════════════════════════════════════
    // VALIDATION START — Guide Create / Edit Form
    // Rule 1: All required fields must be filled
    if (!name || !idNumber || !email || !phone || !language || !experience || !price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    // Rule 2: Block save if live input validators caught format errors
    if (Object.values(errors).some(e => e !== '')) {
      Alert.alert('Error', 'Please fix the validation errors before saving.');
      return;
    }
    // VALIDATION END
    // ═══════════════════════════════════════════════════

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
        <View style={[styles.statusBadge, { backgroundColor: item.availability ? '#e8f5e9' : '#ffebee' }]}>
          <Text style={[styles.statusText, { color: item.availability ? '#2e7d32' : '#c62828' }]}>
            {item.availability ? 'AVAILABLE' : 'BOOKED'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={22} color="#34495e" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={22} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: getImageUrl(item.image) }} style={styles.listImage} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color="#95a5a6" />
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color="#34495e" />
            <Text style={[styles.cardSub, { fontWeight: 'bold', color: '#34495e' }]}>LKR {item.price?.toLocaleString()}</Text>
          </View>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Ionicons name="person-outline" size={10} color="#34495e" />
              <Text style={styles.tagText}>{item.gender}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#ebf5ff' }]}>
              <Ionicons name="ribbon-outline" size={10} color="#2980b9" />
              <Text style={[styles.tagText, { color: '#2980b9' }]}>{item.experience}y EXP</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Ionicons name="language-outline" size={14} color="#95a5a6" />
        <Text style={styles.cardLang}>{Array.isArray(item.language) ? item.language.join(' • ') : item.language}</Text>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#34495e" />
      <Text style={styles.loaderText}>Loading guides...</Text>
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
            <Text style={styles.headerTitle}>Manage Guides</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => { resetForm(); setModalVisible(true); }}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Add New Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.analyticsTrigger} 
              onPress={() => setAnalyticsVisible(true)}
            >
              <Ionicons name="stats-chart" size={20} color="#fff" />
              <Text style={styles.analyticsTriggerText}>Insights</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.mainContent}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#95a5a6" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search guides..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchGuides}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No guides found</Text></View>}
        />
      </View>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayFull}>
          <SafeAreaView style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guide Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#34495e" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.analyticsHeroCard}>
                <Text style={styles.heroLabel}>Active Tour Guides</Text>
                <Text style={styles.heroValue}>{guides.length}</Text>
                <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>OFFICIAL STAFF</Text></View>
              </LinearGradient>

              <View style={styles.miniStatsGrid}>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatValue}>{guides.filter(g => g.gender === 'Male').length}</Text>
                  <Text style={styles.miniStatLabel}>MALE</Text>
                </View>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatValue}>{guides.filter(g => g.gender === 'Female').length}</Text>
                  <Text style={styles.miniStatLabel}>FEMALE</Text>
                </View>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatValue}>{guides.filter(g => g.availability).length}</Text>
                  <Text style={styles.miniStatLabel}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Experience Distribution</Text>
                {(() => {
                  const junior = guides.filter(g => g.experience <= 5).length;
                  const mid = guides.filter(g => g.experience > 5 && g.experience <= 10).length;
                  const senior = guides.filter(g => g.experience > 10).length;
                  const total = guides.length || 1;

                  return (
                    <View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>0-5 Years</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(junior/total)*100}%`, backgroundColor: '#3498db' }]} />
                        </View>
                        <Text style={styles.expVal}>{junior}</Text>
                      </View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>6-10 Years</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(mid/total)*100}%`, backgroundColor: '#f39c12' }]} />
                        </View>
                        <Text style={styles.expVal}>{mid}</Text>
                      </View>
                      <View style={styles.expBarRow}>
                        <Text style={styles.expLabel}>10+ Years</Text>
                        <View style={styles.expBarContainer}>
                          <View style={[styles.expBarFill, { width: `${(senior/total)*100}%`, backgroundColor: '#2ecc71' }]} />
                        </View>
                        <Text style={styles.expVal}>{senior}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Guide Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayFull}>
          <SafeAreaView style={styles.modalContentFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Update Guide' : 'Register Guide'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#34495e" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <View style={styles.pickedImageWrapper}>
                      <Image source={{ uri: getImageUrl(image) }} style={styles.pickedImage} />
                      <View style={styles.editIconBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="person" size={40} color="#cbd5e1" />
                      <Text style={styles.imagePlaceholderText}>ADD PHOTO</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="Enter full name" value={name} onChangeText={handleNameChange} />
                  {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1.2, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>ID Number</Text>
                    <TextInput style={styles.input} placeholder="12 digits" value={idNumber} onChangeText={handleIdChange} maxLength={12} keyboardType="numeric" />
                    {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
                  </View>
                  <View style={[styles.formGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                    <TextInput style={styles.input} placeholder="0" value={experience} onChangeText={handleExperienceChange} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Contact Details</Text>
                  <View style={styles.inputIconGroup}>
                    <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput style={styles.inputWithIcon} placeholder="Email address" value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  <View style={[styles.inputIconGroup, { marginTop: 10 }]}>
                    <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput style={styles.inputWithIcon} placeholder="Phone number" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" maxLength={10} />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Daily Rate (LKR)</Text>
                    <TextInput style={styles.input} placeholder="0.00" value={price} onChangeText={handlePriceChange} keyboardType="decimal-pad" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Gender</Text>
                    <View style={styles.genderToggle}>
                      <TouchableOpacity 
                        style={[styles.genderOption, gender === 'Male' && styles.genderActive]} 
                        onPress={() => setGender('Male')}
                      >
                        <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.genderOption, gender === 'Female' && styles.genderActive]} 
                        onPress={() => setGender('Female')}
                      >
                        <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Languages Spoken</Text>
                  <TextInput style={styles.input} placeholder="e.g. English, Sinhala" value={language} onChangeText={handleLanguageChange} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>About Guide</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    placeholder="Brief professional summary..." 
                    value={description} 
                    onChangeText={setDescription} 
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <View>
                    <Text style={styles.switchLabel}>Available for Booking</Text>
                    <Text style={styles.switchSub}>Allow users to see this guide</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#cbd5e1", true: "#34495e" }}
                    thumbColor={availability ? "#fff" : "#f4f3f4"}
                    onValueChange={setAvailability}
                    value={availability}
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                  <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.saveGradient}>
                    <Text style={styles.saveButtonText}>{editingId ? 'UPDATE PROFILE' : 'REGISTER GUIDE'}</Text>
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
    marginBottom: 25 
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addButton: { 
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 10,
    fontSize: 14
  },
  analyticsTrigger: { 
    flex: 0.32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  analyticsTriggerText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13
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
  filterSection: {
    marginBottom: 15
  },
  filterChip: { 
    paddingHorizontal: 18, 
    paddingVertical: 9, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  activeChip: { 
    backgroundColor: '#34495e', 
    borderColor: '#34495e' 
  },
  chipText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#95a5a6' 
  },
  activeChipText: { 
    color: '#fff' 
  },
  listContent: {
    paddingBottom: 30
  },
  card: { 
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
    alignItems: 'center',
    marginBottom: 15 
  },
  statusBadge: { 
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '800' 
  },
  actions: { 
    flexDirection: 'row' 
  },
  actionBtn: { 
    marginLeft: 15 
  },
  cardBody: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  imageWrapper: {
    width: 75,
    height: 75,
    borderRadius: 20,
    backgroundColor: '#f4f7fe',
    overflow: 'hidden',
    elevation: 2
  },
  listImage: { 
    width: '100%', 
    height: '100%' 
  },
  cardInfo: { 
    flex: 1,
    marginLeft: 15 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginBottom: 5 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  cardSub: { 
    fontSize: 13, 
    color: '#7f8c8d', 
    marginLeft: 8, 
    fontWeight: '500' 
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8
  },
  tagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34495e',
    marginLeft: 4
  },
  cardFooter: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  cardLang: { 
    fontSize: 12, 
    color: '#94a3b8', 
    marginLeft: 8,
    fontWeight: '600'
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
  expBarRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  expLabel: { 
    width: 80, 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '700' 
  },
  expBarContainer: { 
    flex: 1, 
    height: 10, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 5, 
    marginHorizontal: 10,
    overflow: 'hidden' 
  },
  expBarFill: { 
    height: '100%', 
    borderRadius: 5 
  },
  expVal: { 
    width: 25, 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    textAlign: 'right' 
  },

  // Form Styles
  imagePicker: { 
    alignSelf: 'center', 
    marginBottom: 30 
  },
  pickedImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  pickedImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 60 
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#34495e',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  imagePlaceholder: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'
  },
  imagePlaceholderText: { 
    fontSize: 10, 
    color: '#94a3b8', 
    fontWeight: 'bold', 
    marginTop: 8 
  },
  formGroup: { 
    marginBottom: 20 
  },
  formRow: { 
    flexDirection: 'row' 
  },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748b', 
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 15, 
    color: '#2c3e50', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  inputIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15
  },
  inputIcon: {
    marginRight: 10
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#2c3e50'
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  errorText: { 
    color: '#e74c3c', 
    fontSize: 11, 
    marginTop: 5, 
    marginLeft: 5,
    fontWeight: '600' 
  },
  genderToggle: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  genderOption: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 12 
  },
  genderActive: { 
    backgroundColor: '#34495e' 
  },
  genderText: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#94a3b8' 
  },
  genderTextActive: { 
    color: '#fff' 
  },
  switchContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  switchLabel: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  switchSub: { 
    fontSize: 11, 
    color: '#94a3b8',
    marginTop: 2
  },
  saveButton: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 8, 
    shadowColor: '#34495e',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  saveGradient: { 
    padding: 18, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 1 
  }
});

export default GuideManageScreen;
