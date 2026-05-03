import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, 
  TextInput, Alert, ActivityIndicator, ScrollView, Switch, 
  Image, KeyboardAvoidingView, Platform, RefreshControl,
  StatusBar, SafeAreaView, Dimensions
} from 'react-native';
import { transportService, driverService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getImageUrl } from '../utils/imageHelper';

const TransportManageScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Vehicles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  // --- VEHICLE STATE ---
  const [vehicles, setVehicles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // --- DRIVER STATE ---
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverActiveFilter, setDriverActiveFilter] = useState('All');
  
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [availability, setAvailability] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- DRIVER STATE ---
  const [drivers, setDrivers] = useState([]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [idNo, setIdNo] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [driverPrice, setDriverPrice] = useState('');
  const [driverImage, setDriverImage] = useState(null);
  const [driverAvailable, setDriverAvailable] = useState(true);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [driverErrors, setDriverErrors] = useState({});

  const fetchData = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        transportService.getVehicles(),
        driverService.getDrivers()
      ]);
      setVehicles(vRes.data.data);
      setDrivers(dRes.data.data);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // --- VEHICLE FUNCTIONS ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const pickDriverImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setDriverImage(result.assets[0].uri);
  };

  const handleVehicleSubmit = async () => {
    // --- VALIDATION START: Comprehensive Vehicle Registration Rules ---
    if (!vehicleType || !vehicleModel || !vehicleNumber || !mobileNumber || !location || !price) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (!image && !editingId) {
      Alert.alert('Validation Error', 'Vehicle photo is compulsory');
      return;
    }
    // Rule: Model must contain letters
    if (!/[a-zA-Z]/.test(vehicleModel)) {
      Alert.alert('Validation Error', 'Model must contain letters, not just numbers');
      return;
    }
    // Rule: Specific Sri Lankan Plate Format (e.g. WP KG-1234)
    const plateRegex = /^[a-zA-Z]{2}\s[a-zA-Z]{2,3}-\d{4}$/i;
    if (!plateRegex.test(vehicleNumber)) {
      Alert.alert('Validation Error', 'Plate format must be like "wp KG-1234" or "wp BAF-1245"');
      return;
    }
    // Rule: 10 digit phone number
    if (mobileNumber.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits');
      return;
    }
    // --- VALIDATION END ---
    try {
      const formData = new FormData();
      formData.append('vehicleType', vehicleType);
      formData.append('vehicleModel', vehicleModel);
      formData.append('vehicleNumber', vehicleNumber);
      formData.append('mobileNumber', mobileNumber);
      formData.append('location', location);
      formData.append('price', price);
      formData.append('availability', availability.toString());
      formData.append('maintenance', maintenance.toString());

      if (image && !image.startsWith('http')) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: image, name: filename, type });
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingId) {
        await transportService.updateVehicle(editingId, formData, config);
      } else {
        await transportService.addVehicle(formData, config);
      }
      
      setModalVisible(false);
      resetVehicleForm();
      fetchData();
      Alert.alert('Success', `Vehicle ${editingId ? 'updated' : 'added'} successfully`);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save vehicle details';
      Alert.alert('Error', msg);
    }
  };

  const resetVehicleForm = () => {
    setVehicleType(''); setVehicleModel(''); setVehicleNumber(''); setMobileNumber('');
    setLocation(''); setPrice(''); setImage(null); setAvailability(true);
    setMaintenance(false); setEditingId(null);
  };

  const openVehicleEdit = (item) => {
    setVehicleType(item.vehicleType); setVehicleModel(item.vehicleModel || '');
    setVehicleNumber(item.vehicleNumber || ''); setMobileNumber(item.mobileNumber || '');
    setLocation(item.location || ''); setPrice(item.price.toString());
    setImage(item.image); setAvailability(item.availability);
    setMaintenance(item.maintenance || false); setEditingId(item._id);
    setVehicleErrors({});
    setModalVisible(true);
  };

  const deleteVehicle = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await transportService.deleteVehicle(id); fetchData(); } catch (e) {}
        }
      }
    ]);
  };

  // --- DRIVER FUNCTIONS ---
  const handleDriverSubmit = async () => {
    // ═══════════════════════════════════════════════════
    // VALIDATION START — Driver Create / Edit Form
    // Rule 1: All mandatory fields must be filled
    if (!driverName || !licenseNo || !idNo || !driverPhone || !description || !experience || !driverPrice) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    // Rule 2: Profile photo is mandatory
    if (!driverImage) {
      Alert.alert('Validation Error', 'Driver photo is compulsory');
      return;
    }
    // Rule 3: Phone must be exactly 10 digits
    if (driverPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits');
      return;
    }
    // Rule 4: License number must be exactly 10 digits
    if (licenseNo.length !== 10) {
      Alert.alert('Validation Error', 'License number must be exactly 10 digits');
      return;
    }
    // Rule 5: NIC/ID must be exactly 12 digits
    if (idNo.length !== 12) {
      Alert.alert('Validation Error', 'ID number must be exactly 12 digits');
      return;
    }
    // Rule 6: Experience must be a realistic value (1-99 years)
    if (parseInt(experience) < 1 || parseInt(experience) > 99) {
      Alert.alert('Validation Error', 'Experience must be between 1 and 99 years');
      return;
    }
    // VALIDATION END
    // ═══════════════════════════════════════════════════
    try {
      const formData = new FormData();
      formData.append('name', driverName);
      formData.append('licenseNo', licenseNo);
      formData.append('idNo', idNo);
      formData.append('phone', driverPhone);
      formData.append('email', driverEmail);
      formData.append('description', description);
      formData.append('experience', experience);
      formData.append('price', parseFloat(driverPrice));
      formData.append('available', driverAvailable.toString());

      if (driverImage && !driverImage.startsWith('http')) {
        const filename = driverImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: driverImage, name: filename, type });
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (editingDriverId) {
        await driverService.updateDriver(editingDriverId, formData, config);
      } else {
        await driverService.addDriver(formData, config);
      }
      
      setDriverModalVisible(false);
      resetDriverForm();
      fetchData();
      Alert.alert('Success', `Driver ${editingDriverId ? 'updated' : 'added'} successfully`);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save driver details';
      Alert.alert('Error', msg);
    }
  };

  const resetDriverForm = () => {
    setDriverName(''); setLicenseNo(''); setIdNo(''); setDriverPhone('');
    setDriverEmail(''); setDescription(''); setExperience(''); setDriverPrice('');
    setDriverImage(null); setDriverAvailable(true); setEditingDriverId(null);
  };

  const openDriverEdit = (item) => {
    setDriverName(item.name); setLicenseNo(item.licenseNo); setIdNo(item.idNo);
    setDriverPhone(item.phone); setDriverEmail(item.email || ''); setDescription(item.description);
    setExperience(item.experience); setDriverPrice(item.price.toString());
    setDriverImage(item.image); setDriverAvailable(item.available); setEditingDriverId(item._id);
    setDriverErrors({});
    setDriverModalVisible(true);
  };

  const deleteDriver = (id) => {
    Alert.alert('Delete Driver', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await driverService.deleteDriver(id); fetchData(); } catch (e) {}
        }
      }
    ]);
  };

  const filteredDrivers = drivers.filter(d => {
    const nameStr = d.name || '';
    const licenseStr = d.licenseNo || '';
    const matches = nameStr.toLowerCase().includes(driverSearchQuery.toLowerCase()) || 
                    licenseStr.toLowerCase().includes(driverSearchQuery.toLowerCase());
    
    if (driverActiveFilter === 'Available') return matches && d.available;
    if (driverActiveFilter === 'Senior') return matches && parseInt(d.experience || 0) >= 5;
    if (driverActiveFilter === 'Junior') return matches && parseInt(d.experience || 0) < 5;
    
    return matches;
  });


  // --- RENDER HELPERS ---
  const filteredVehicles = vehicles.filter(v => {
    const matches = v.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    v.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'Available') return matches && v.availability && !v.maintenance;
    if (activeFilter === 'Maintenance') return matches && v.maintenance;
    return matches;
  });

  const getStats = () => {
    const vTypes = { Car: 0, Van: 0, Bike: 0, SUV: 0 };
    vehicles.forEach(v => { if (vTypes[v.vehicleType] !== undefined) vTypes[v.vehicleType]++; });

    const vStatus = { Available: 0, Maintenance: 0, Booked: 0 };
    vehicles.forEach(v => {
      if (v.maintenance) vStatus.Maintenance++;
      else if (v.availability) vStatus.Available++;
      else vStatus.Booked++;
    });

    const dExp = { Junior: 0, Mid: 0, Senior: 0 };
    drivers.forEach(d => {
      const exp = parseInt(d.experience);
      if (exp <= 3) dExp.Junior++;
      else if (exp <= 8) dExp.Mid++;
      else dExp.Senior++;
    });

    return {
      totalV: vehicles.length, 
      availableV: vStatus.Available,
      inMaintenanceV: vStatus.Maintenance,
      bookedV: vStatus.Booked,
      vTypes,
      vStatus,
      totalD: drivers.length, 
      availableD: drivers.filter(d => d.available).length,
      dExp
    };
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fleet Management</Text>
            <TouchableOpacity style={styles.analyticsTrigger} onPress={() => setAnalyticsVisible(true)}>
              <Ionicons name="bar-chart" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Vehicles' && styles.activeTab]} 
              onPress={() => setActiveTab('Vehicles')}
            >
              <Ionicons name="car-outline" size={18} color={activeTab === 'Vehicles' ? '#34495e' : '#fff'} />
              <Text style={[styles.tabText, activeTab === 'Vehicles' && styles.activeTabText]}>Vehicles</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Drivers' && styles.activeTab]} 
              onPress={() => setActiveTab('Drivers')}
            >
              <Ionicons name="people-outline" size={18} color={activeTab === 'Drivers' ? '#34495e' : '#fff'} />
              <Text style={[styles.tabText, activeTab === 'Drivers' && styles.activeTabText]}>Drivers</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => { 
                if(activeTab === 'Vehicles') { resetVehicleForm(); setModalVisible(true); }
                else { resetDriverForm(); setDriverModalVisible(true); }
              }}
            >
              <Ionicons name="add-circle" size={20} color="#34495e" />
              <Text style={styles.addButtonText}>Add New {activeTab === 'Vehicles' ? 'Vehicle' : 'Driver'}</Text>
            </TouchableOpacity>
            
            {(activeTab === 'Vehicles' || activeTab === 'Drivers') && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                <TextInput 
                  style={styles.searchInput}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={activeTab === 'Vehicles' ? searchQuery : driverSearchQuery}
                  onChangeText={activeTab === 'Vehicles' ? setSearchQuery : setDriverSearchQuery}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.analyticsModalOverlay}>
          <View style={styles.analyticsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fleet Insights</Text>
              <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setAnalyticsVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.analyticsScroll}>
              {/* Fleet Composition Section */}
              <View style={styles.analyticsSection}>
                <Text style={styles.sectionHeading}>Fleet Composition</Text>
                <View style={styles.chartCard}>
                  {Object.entries(stats.vTypes).map(([type, count]) => {
                    const percentage = stats.totalV > 0 ? (count / stats.totalV) * 100 : 0;
                    return (
                      <View key={type} style={styles.chartRow}>
                        <View style={styles.chartLabelRow}>
                          <Text style={styles.chartLabel}>{type}</Text>
                          <Text style={styles.chartValue}>{count}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <LinearGradient 
                            colors={['#34495e', '#5d6d7e']} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={[styles.progressBarFill, { width: `${percentage}%` }]} 
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Fleet Status Section */}
              <View style={styles.analyticsSection}>
                <Text style={styles.sectionHeading}>Operations Status</Text>
                <View style={styles.statusGrid}>
                  <View style={[styles.statusMiniCard, { borderLeftColor: '#2ecc71', borderLeftWidth: 4 }]}>
                    <Text style={styles.statusMiniLabel}>Available</Text>
                    <Text style={[styles.statusMiniValue, { color: '#2ecc71' }]}>{stats.availableV}</Text>
                  </View>
                  <View style={[styles.statusMiniCard, { borderLeftColor: '#f1c40f', borderLeftWidth: 4 }]}>
                    <Text style={styles.statusMiniLabel}>Maintenance</Text>
                    <Text style={[styles.statusMiniValue, { color: '#f1c40f' }]}>{stats.inMaintenanceV}</Text>
                  </View>
                  <View style={[styles.statusMiniCard, { borderLeftColor: '#e74c3c', borderLeftWidth: 4 }]}>
                    <Text style={styles.statusMiniLabel}>In Use</Text>
                    <Text style={[styles.statusMiniValue, { color: '#e74c3c' }]}>{stats.bookedV}</Text>
                  </View>
                </View>
                <View style={styles.statusCombinedBar}>
                  <View style={[styles.barPart, { flex: stats.availableV || 1, backgroundColor: '#2ecc71' }]} />
                  <View style={[styles.barPart, { flex: stats.inMaintenanceV || 1, backgroundColor: '#f1c40f' }]} />
                  <View style={[styles.barPart, { flex: stats.bookedV || 1, backgroundColor: '#e74c3c' }]} />
                </View>
              </View>

              {/* Driver Experience Section */}
              <View style={styles.analyticsSection}>
                <Text style={styles.sectionHeading}>Driver Expertise</Text>
                <View style={styles.chartCard}>
                  {[
                    { label: 'Junior (0-3y)', count: stats.dExp.Junior, color: '#95a5a6' },
                    { label: 'Intermediate (4-8y)', count: stats.dExp.Mid, color: '#3498db' },
                    { label: 'Expert (9y+)', count: stats.dExp.Senior, color: '#2c3e50' }
                  ].map((item, idx) => {
                    const percentage = stats.totalD > 0 ? (item.count / stats.totalD) * 100 : 0;
                    return (
                      <View key={idx} style={styles.chartRow}>
                        <View style={styles.chartLabelRow}>
                          <Text style={styles.chartLabel}>{item.label}</Text>
                          <Text style={styles.chartValue}>{item.count}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#34495e" />
          <Text style={styles.loaderText}>Syncing Fleet Data...</Text>
        </View>
      ) : activeTab === 'Vehicles' ? (
        <>
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Available', 'Maintenance'].map(f => (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.filterChip, activeFilter === f && styles.activeChipBtn]} 
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[styles.chipText, activeFilter === f && styles.activeChipBtnText]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredVehicles}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: getImageUrl(item.image) }} style={styles.cardImage} />
                  <View style={[styles.statusBadge, { backgroundColor: item.maintenance ? '#fef3c7' : (item.availability ? '#dcfce7' : '#fee2e2') }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.maintenance ? '#f59e0b' : (item.availability ? '#22c55e' : '#ef4444') }]} />
                    <Text style={[styles.statusText, { color: item.maintenance ? '#b45309' : (item.availability ? '#15803d' : '#b91c1c') }]}>
                      {item.maintenance ? 'Service' : (item.availability ? 'Ready' : 'In Use')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardType}>{item.vehicleType}</Text>
                      <Text style={styles.cardModel}>{item.vehicleModel}</Text>
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceValue}>LKR {item.price}</Text>
                      <Text style={styles.priceUnit}>/day</Text>
                    </View>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Ionicons name="card-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{item.vehicleNumber}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{item.location}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openVehicleEdit(item)} style={[styles.actionBtn, styles.editBtn]}>
                      <Ionicons name="create-outline" size={18} color="#34495e" />
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteVehicle(item._id)} style={[styles.actionBtn, styles.deleteBtn]}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <>
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Available', 'Senior', 'Junior'].map(f => (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.filterChip, driverActiveFilter === f && styles.activeChipBtn]} 
                  onPress={() => setDriverActiveFilter(f)}
                >
                  <Text style={[styles.chipText, driverActiveFilter === f && styles.activeChipBtnText]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredDrivers}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={styles.avatarWrapper}>
                  {item.image && item.image !== 'default-driver.png' ? (
                    <Image source={{ uri: getImageUrl(item.image) }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#94a3b8" />
                    </View>
                  )}
                  <View style={[styles.driverStatusDot, { backgroundColor: item.available ? '#22c55e' : '#ef4444' }]} />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.driverName}>{item.name}</Text>
                  <View style={styles.driverExpBadge}>
                    <Ionicons name="ribbon-outline" size={12} color="#64748b" />
                    <Text style={styles.driverExpText}>{item.experience} Years Exp.</Text>
                  </View>
                </View>
                <View style={styles.driverPriceTag}>
                  <Text style={styles.driverPriceVal}>LKR {item.price}</Text>
                </View>
              </View>
              <View style={styles.driverBody}>
                <Text style={styles.driverDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.driverDetailsGrid}>
                  <View style={styles.driverDetail}>
                    <Ionicons name="phone-portrait-outline" size={14} color="#94a3b8" />
                    <Text style={styles.detailText}>{item.phone}</Text>
                  </View>
                  <View style={styles.driverDetail}>
                    <Ionicons name="shield-outline" size={14} color="#94a3b8" />
                    <Text style={styles.detailText}>{item.licenseNo}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openDriverEdit(item)} style={[styles.actionBtn, styles.editBtn]}>
                  <Ionicons name="create-outline" size={18} color="#34495e" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDriver(item._id)} style={[styles.actionBtn, styles.deleteBtn]}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </>
    )}

      {/* Vehicle Form Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? <Image source={{ uri: getImageUrl(image) }} style={styles.pickedImage} /> : (
                  <View style={styles.imagePlaceholder}><Ionicons name="camera" size={40} color="#ccc" /><Text style={styles.imagePlaceholderText}>Upload Photo</Text></View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Type *</Text>
                <View style={styles.typeSelector}>
                  {['Car', 'Van', 'Bike', 'SUV'].map(t => (
                    <TouchableOpacity key={t} style={[styles.typeChip, vehicleType === t && styles.activeTypeChip]} onPress={() => setVehicleType(t)}>
                      <Text style={[styles.typeChipText, vehicleType === t && styles.activeTypeChipText]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Model *</Text>
                  <TextInput 
                    style={[styles.input, vehicleErrors.model && styles.inputError]} 
                    value={vehicleModel} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^a-zA-Z0-9\s-]/g, '');
                      setVehicleModel(filtered);
                      let err = '';
                      if (!filtered) err = 'Model is required';
                      else if (!/[a-zA-Z]/.test(filtered)) err = 'Must contain letters';
                      setVehicleErrors(prev => ({ ...prev, model: err }));
                    }} 
                  />
                  {vehicleErrors.model ? <Text style={styles.errorText}>{vehicleErrors.model}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Plate *</Text>
                  <TextInput 
                    style={[styles.input, vehicleErrors.plate && styles.inputError]} 
                    value={vehicleNumber} 
                    placeholder="wp KG-1234"
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^a-zA-Z0-9\s-]/g, '');
                      setVehicleNumber(filtered);
                      const plateRegex = /^[a-zA-Z]{2}\s[a-zA-Z]{2,3}-\d{4}$/i;
                      let err = '';
                      if (!filtered) err = 'Plate is required';
                      else if (!plateRegex.test(filtered)) err = 'Format: wp KG-1234';
                      setVehicleErrors(prev => ({ ...prev, plate: err }));
                    }} 
                  />
                  {vehicleErrors.plate ? <Text style={styles.errorText}>{vehicleErrors.plate}</Text> : null}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Phone *</Text>
                  <TextInput 
                    style={[styles.input, vehicleErrors.phone && styles.inputError]} 
                    value={mobileNumber} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setMobileNumber(filtered);
                      let err = '';
                      if (!filtered) err = 'Phone is required';
                      else if (filtered.length !== 10) err = 'Must be 10 digits';
                      setVehicleErrors(prev => ({ ...prev, phone: err }));
                    }} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                  {vehicleErrors.phone ? <Text style={styles.errorText}>{vehicleErrors.phone}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price/Day *</Text>
                  <TextInput 
                    style={[styles.input, vehicleErrors.price && styles.inputError]} 
                    value={price} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      if ((cleaned.match(/\./g) || []).length <= 1) {
                        setPrice(cleaned);
                        let err = '';
                        if (!cleaned) err = 'Price is required';
                        else if (parseFloat(cleaned) <= 0) err = 'Must be > 0';
                        setVehicleErrors(prev => ({ ...prev, price: err }));
                      }
                    }} 
                    keyboardType="decimal-pad" 
                  />
                  {vehicleErrors.price ? <Text style={styles.errorText}>{vehicleErrors.price}</Text> : null}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput 
                  style={[styles.input, vehicleErrors.location && styles.inputError]} 
                  value={location} 
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                    setLocation(filtered);
                    let err = '';
                    if (!filtered) err = 'Location is required';
                    else if (filtered.length < 3) err = 'Too short';
                    setVehicleErrors(prev => ({ ...prev, location: err }));
                  }} 
                />
                {vehicleErrors.location ? <Text style={styles.errorText}>{vehicleErrors.location}</Text> : null}
              </View>

              <View style={styles.switchRow}><Text style={styles.label}>Availability</Text><Switch value={availability} onValueChange={setAvailability} /></View>
              <View style={styles.switchRow}><Text style={styles.label}>Maintenance</Text><Switch value={maintenance} onValueChange={setMaintenance} trackColor={{ true: '#f39c12' }} /></View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleVehicleSubmit}><Text style={styles.saveBtnText}>Save Vehicle</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Driver Form Modal */}
      <Modal visible={driverModalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingDriverId ? 'Edit Driver' : 'Add New Driver'}</Text>
              <TouchableOpacity onPress={() => setDriverModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity style={styles.driverImagePicker} onPress={pickDriverImage}>
                {driverImage ? <Image source={{ uri: getImageUrl(driverImage) }} style={styles.pickedDriverImage} /> : (
                  <View style={styles.driverImagePlaceholder}><Ionicons name="camera" size={30} color="#ccc" /><Text style={styles.imagePlaceholderText}>Upload Driver Photo</Text></View>
                )}
              </TouchableOpacity>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.name && styles.inputError]} 
                    value={driverName} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                      setDriverName(filtered);
                      let err = '';
                      if (!filtered) err = 'Name is required';
                      else if (text !== filtered) err = 'Only letters allowed';
                      setDriverErrors(prev => ({ ...prev, name: err }));
                    }} 
                  />
                  {driverErrors.name ? <Text style={styles.errorText}>{driverErrors.name}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Phone *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.phone && styles.inputError]} 
                    value={driverPhone} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setDriverPhone(filtered);
                      let err = '';
                      if (!filtered) err = 'Phone is required';
                      else if (filtered.length !== 10) err = 'Must be 10 digits';
                      setDriverErrors(prev => ({ ...prev, phone: err }));
                    }} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                  {driverErrors.phone ? <Text style={styles.errorText}>{driverErrors.phone}</Text> : null}
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>License No *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.license && styles.inputError]} 
                    value={licenseNo} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setLicenseNo(filtered);
                      let err = '';
                      if (!filtered) err = 'License is required';
                      else if (filtered.length !== 10) err = 'Must be 10 digits';
                      setDriverErrors(prev => ({ ...prev, license: err }));
                    }} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                  {driverErrors.license ? <Text style={styles.errorText}>{driverErrors.license}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>ID No *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.id && styles.inputError]} 
                    value={idNo} 
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
                      setIdNo(filtered);
                      let err = '';
                      if (!filtered) err = 'ID is required';
                      else if (filtered.length !== 12) err = 'Must be 12 digits';
                      setDriverErrors(prev => ({ ...prev, id: err }));
                    }} 
                    keyboardType="numeric" 
                    maxLength={12} 
                  />
                  {driverErrors.id ? <Text style={styles.errorText}>{driverErrors.id}</Text> : null}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                  style={[styles.input, driverErrors.email && styles.inputError]} 
                  value={driverEmail} 
                  onChangeText={(text) => {
                    setDriverEmail(text);
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    setDriverErrors(prev => ({ ...prev, email: (text.length > 0 && !emailRegex.test(text)) ? 'Invalid email format' : '' }));
                  }} 
                  keyboardType="email-address" 
                />
                {driverErrors.email ? <Text style={styles.errorText}>{driverErrors.email}</Text> : null}
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Experience *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.experience && styles.inputError]} 
                    placeholder="e.g. 5" 
                    value={experience} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      setExperience(cleaned);
                      let err = '';
                      if (!cleaned) err = 'Required';
                      else if (parseInt(cleaned) < 1 || parseInt(cleaned) > 99) err = 'Range: 1-99';
                      setDriverErrors(prev => ({ ...prev, experience: err }));
                    }} 
                    keyboardType="numeric" 
                    maxLength={2} 
                  />
                  {driverErrors.experience ? <Text style={styles.errorText}>{driverErrors.experience}</Text> : null}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price/Day *</Text>
                  <TextInput 
                    style={[styles.input, driverErrors.price && styles.inputError]} 
                    value={driverPrice} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      if ((cleaned.match(/\./g) || []).length <= 1) {
                        setDriverPrice(cleaned);
                        let err = '';
                        if (!cleaned) err = 'Price is required';
                        else if (parseFloat(cleaned) <= 0) err = 'Must be > 0';
                        setDriverErrors(prev => ({ ...prev, price: err }));
                      }
                    }} 
                    keyboardType="decimal-pad" 
                  />
                  {driverErrors.price ? <Text style={styles.errorText}>{driverErrors.price}</Text> : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description/Bio *</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }, driverErrors.description && styles.inputError]} 
                  multiline 
                  value={description} 
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^a-zA-Z0-9\s.,]/g, '');
                    setDescription(filtered);
                    let err = '';
                    if (!filtered) err = 'Description is required';
                    else if (filtered.length < 10) err = 'Too short (min 10 chars)';
                    setDriverErrors(prev => ({ ...prev, description: err }));
                  }} 
                />
                {driverErrors.description ? <Text style={styles.errorText}>{driverErrors.description}</Text> : null}
              </View>

              <View style={styles.switchRow}><Text style={styles.label}>Available for Hire</Text><Switch value={driverAvailable} onValueChange={setDriverAvailable} /></View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleDriverSubmit}><Text style={styles.saveBtnText}>Save Driver</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    paddingHorizontal: 25, 
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 35,
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
    marginTop: 10
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  analyticsTrigger: { 
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', 
    alignItems: 'center'
  },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20, 
    padding: 6, 
    marginBottom: 25 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 15 
  },
  activeTab: { backgroundColor: '#fff', elevation: 5 },
  tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 14, marginLeft: 8 },
  activeTabText: { color: '#34495e' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  addButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3 
  },
  addButtonText: { color: '#34495e', fontWeight: '900', marginLeft: 8, fontSize: 13 },
  searchBox: {
    flex: 1,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },

  filterSection: { paddingHorizontal: 20, marginVertical: 15 },
  chipScroll: { marginBottom: 0 },
  filterChip: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 15, 
    backgroundColor: '#fff', 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    elevation: 2
  },
  activeChipBtn: { backgroundColor: '#34495e', borderColor: '#34495e' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '800' },
  activeChipBtnText: { color: '#fff' },

  listContainer: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 25, marginBottom: 25, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardImageContainer: { position: 'relative' },
  cardImage: { width: '100%', height: 180 },
  statusBadge: { 
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardType: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  cardModel: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginTop: 2 },
  priceTag: { alignItems: 'flex-end' },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#34495e' },
  priceUnit: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', marginBottom: 20 },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, color: '#64748b', marginLeft: 8, fontWeight: '600' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  actionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 15 },
  editBtn: { backgroundColor: '#f1f5f9' },
  deleteBtn: { backgroundColor: '#fef2f2' },
  actionBtnText: { fontWeight: '900', fontSize: 14, marginLeft: 8, color: '#34495e' },

  driverCard: { backgroundColor: '#fff', borderRadius: 25, marginBottom: 25, padding: 20, elevation: 5 },
  driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 55, height: 55, borderRadius: 20 },
  driverStatusDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#fff' },
  driverName: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  driverExpBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  driverExpText: { fontSize: 12, color: '#64748b', marginLeft: 5, fontWeight: '700' },
  driverPriceTag: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  driverPriceVal: { fontSize: 14, fontWeight: '900', color: '#34495e' },
  driverBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, marginBottom: 20 },
  driverDesc: { fontSize: 14, color: '#64748b', marginBottom: 15, fontStyle: 'italic', lineHeight: 20 },
  driverDetailsGrid: { flexDirection: 'row' },
  driverDetail: { flex: 1, flexDirection: 'row', alignItems: 'center' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  loaderText: { marginTop: 15, color: '#64748b', fontWeight: '800' },

  analyticsModalOverlay: { flex: 1, backgroundColor: '#fff', padding: 25 },
  analyticsModalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  modalCloseIcon: { padding: 5 },
  analyticsScroll: { flex: 1 },
  analyticsSection: { marginBottom: 30 },
  sectionHeading: { fontSize: 18, fontWeight: '900', color: '#34495e', marginBottom: 15 },
  
  chartCard: { backgroundColor: '#f8fafc', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  chartRow: { marginBottom: 15 },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartLabel: { fontSize: 13, color: '#64748b', fontWeight: '800' },
  chartValue: { fontSize: 13, color: '#34495e', fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  statusGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statusMiniCard: { flex: 0.31, backgroundColor: '#f8fafc', padding: 12, borderRadius: 15, elevation: 1 },
  statusMiniLabel: { fontSize: 10, color: '#64748b', fontWeight: '800', marginBottom: 4 },
  statusMiniValue: { fontSize: 18, fontWeight: '900' },
  statusCombinedBar: { height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  barPart: { height: '100%' },

  formContainer: { flex: 1, backgroundColor: '#fff', padding: 25 },
  // Form styles remain similar or can be updated...
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  formTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  formScroll: { flex: 1 },
  imagePicker: { alignSelf: 'center', marginBottom: 25, width: Dimensions.get('window').width - 50, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  imagePlaceholder: { width: '100%', height: 200, borderRadius: 25, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  imagePlaceholderText: { fontSize: 13, color: '#94a3b8', fontWeight: '800', marginTop: 10 },
  pickedImage: { width: '100%', height: 200, backgroundColor: '#f1f5f9' },
  driverImagePicker: { alignSelf: 'center', marginBottom: 25, width: 120, height: 120, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  driverImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  pickedDriverImage: { width: '100%', height: '100%', backgroundColor: '#f1f5f9' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 10, marginLeft: 4 },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  typeChip: { flex: 0.23, paddingVertical: 12, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  activeTypeChip: { backgroundColor: '#34495e', borderColor: '#34495e' },
  typeChipText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  activeTypeChipText: { color: '#fff' },
  input: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, fontSize: 15, color: '#1e293b', fontWeight: '700', borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 10 },
  saveBtn: { backgroundColor: '#34495e', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10, marginBottom: 40, elevation: 5 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  errorText: { color: '#ef4444', fontSize: 11, fontWeight: '800', marginTop: 4, marginLeft: 5 },
  inputError: { borderColor: '#ef4444', borderWidth: 1.5 }
});

export default TransportManageScreen;
