import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, 
  TextInput, Alert, ActivityIndicator, ScrollView, Switch, 
  Image, KeyboardAvoidingView, Platform, RefreshControl 
} from 'react-native';
import { transportService, driverService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const TransportManageScreen = () => {
  const [activeTab, setActiveTab] = useState('Vehicles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  // --- VEHICLE STATE ---
  const [vehicles, setVehicles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
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
      aspect: [1, 1], // Square for avatar
      quality: 0.7,
    });
    if (!result.canceled) setDriverImage(result.assets[0].uri);
  };

  const handleVehicleSubmit = async () => {
    if (!vehicleType || !vehicleModel || !vehicleNumber || !mobileNumber || !location || !price) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (!image && !editingId) {
      Alert.alert('Validation Error', 'Vehicle photo is compulsory');
      return;
    }
    if (!/[a-zA-Z]/.test(vehicleModel)) {
      Alert.alert('Validation Error', 'Model must contain letters, not just numbers');
      return;
    }
    const plateRegex = /^[a-zA-Z]{2}\s[a-zA-Z]{2,3}-\d{4}$/i;
    if (!plateRegex.test(vehicleNumber)) {
      Alert.alert('Validation Error', 'Plate format must be like "wp KG-1234" or "wp BAF-1245"');
      return;
    }
    if (mobileNumber.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits');
      return;
    }
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
    if (!driverName || !licenseNo || !idNo || !driverPhone || !description || !experience || !driverPrice) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (!driverImage) {
      Alert.alert('Validation Error', 'Driver photo is compulsory');
      return;
    }
    if (driverPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits');
      return;
    }
    if (licenseNo.length !== 10) {
      Alert.alert('Validation Error', 'License number must be exactly 10 digits');
      return;
    }
    if (idNo.length !== 12) {
      Alert.alert('Validation Error', 'ID number must be exactly 12 digits');
      return;
    }
    if (parseInt(experience) < 1 || parseInt(experience) > 99) {
      Alert.alert('Validation Error', 'Experience must be between 1 and 99 years');
      return;
    }
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

  // --- RENDER HELPERS ---
  const filteredVehicles = vehicles.filter(v => {
    const matches = v.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    v.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'Available') return matches && v.availability && !v.maintenance;
    if (activeFilter === 'Maintenance') return matches && v.maintenance;
    return matches;
  });

  const getStats = () => {
    return {
      totalV: vehicles.length, availableV: vehicles.filter(v => v.availability && !v.maintenance).length,
      inMaintenanceV: vehicles.filter(v => v.maintenance).length,
      totalD: drivers.length, availableD: drivers.filter(d => d.available).length
    };
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Transport Fleet</Text>
          <TouchableOpacity style={styles.analyticsTrigger} onPress={() => setAnalyticsVisible(true)}>
            <Ionicons name="stats-chart" size={18} color="#2e64e5" />
            <Text style={styles.analyticsTriggerText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Vehicles' && styles.activeTab]} onPress={() => setActiveTab('Vehicles')}>
            <Text style={[styles.tabText, activeTab === 'Vehicles' && styles.activeTabText]}>Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Drivers' && styles.activeTab]} onPress={() => setActiveTab('Drivers')}>
            <Text style={[styles.tabText, activeTab === 'Drivers' && styles.activeTabText]}>Drivers</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Vehicles' ? (
          <TouchableOpacity style={styles.addButton} onPress={() => { resetVehicleForm(); setModalVisible(true); }}>
            <Ionicons name="bus-outline" size={20} color="#2e64e5" />
            <Text style={styles.addButtonText}>Add New Vehicle</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => { resetDriverForm(); setDriverModalVisible(true); }}>
            <Ionicons name="person-add-outline" size={20} color="#2e64e5" />
            <Text style={styles.addButtonText}>Add New Driver</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} animationType="slide" transparent={true}>
        <View style={styles.analyticsModalOverlay}>
          <View style={styles.analyticsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fleet Insights</Text>
              <TouchableOpacity onPress={() => setAnalyticsVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Vehicles</Text>
              <View style={styles.miniStatsGrid}>
                <View style={[styles.miniStatCard, { backgroundColor: '#eef2f8' }]}><Text style={styles.miniStatLabel}>Total Fleet</Text><Text style={[styles.miniStatValue, { color: '#2e64e5' }]}>{stats.totalV}</Text></View>
                <View style={[styles.miniStatCard, { backgroundColor: '#e8f5e9' }]}><Text style={styles.miniStatLabel}>Available</Text><Text style={[styles.miniStatValue, { color: '#2ecc71' }]}>{stats.availableV}</Text></View>
              </View>
              <Text style={styles.sectionHeading}>Drivers</Text>
              <View style={styles.miniStatsGrid}>
                <View style={[styles.miniStatCard, { backgroundColor: '#fff8e1' }]}><Text style={styles.miniStatLabel}>Total Drivers</Text><Text style={[styles.miniStatValue, { color: '#f39c12' }]}>{stats.totalD}</Text></View>
                <View style={[styles.miniStatCard, { backgroundColor: '#e8f5e9' }]}><Text style={styles.miniStatLabel}>Active</Text><Text style={[styles.miniStatValue, { color: '#2ecc71' }]}>{stats.availableD}</Text></View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#2e64e5" style={{ marginTop: 50 }} />
      ) : activeTab === 'Vehicles' ? (
        <>
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Available', 'Maintenance'].map(f => (
                <TouchableOpacity key={f} style={[styles.filterChip, activeFilter === f && styles.activeChipBtn]} onPress={() => setActiveFilter(f)}>
                  <Text style={[styles.chipText, activeFilter === f && styles.activeChipBtnText]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredVehicles}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 20, paddingTop: 0 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image source={{ uri: item.image?.startsWith('http') ? item.image : 'https://via.placeholder.com/300x150' }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardType}>{item.vehicleType}</Text>
                      <Text style={styles.cardModel}>{item.vehicleModel}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.maintenance ? '#fff3e0' : (item.availability ? '#e8f5e9' : '#ffebee') }]}>
                      <Text style={[styles.statusText, { color: item.maintenance ? '#ef6c00' : (item.availability ? '#2e7d32' : '#c62828') }]}>
                        {item.maintenance ? 'Maintenance' : (item.availability ? 'Available' : 'Booked')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}><Ionicons name="barcode-outline" size={14} color="#64748b" /><Text style={styles.detailText}>{item.vehicleNumber}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="call-outline" size={14} color="#64748b" /><Text style={styles.detailText}>{item.mobileNumber}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="cash-outline" size={14} color="#2e64e5" /><Text style={styles.priceText}>LKR {item.price}/day</Text></View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openVehicleEdit(item)} style={[styles.actionBtn, { backgroundColor: '#eef2ff' }]}><Ionicons name="pencil" size={18} color="#2e64e5" /><Text style={[styles.actionBtnText, { color: '#2e64e5' }]}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteVehicle(item._id)} style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}><Ionicons name="trash" size={18} color="#ef4444" /><Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={styles.avatar}>
                  {item.image && item.image !== 'default-driver.png' ? (
                    <Image source={{ uri: item.image }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color="#2e64e5" />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.driverName}>{item.name}</Text>
                  <Text style={styles.driverExp}>{item.experience} Exp</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.available ? '#e8f5e9' : '#ffebee' }]}>
                  <Text style={[styles.statusText, { color: item.available ? '#2e7d32' : '#c62828' }]}>{item.available ? 'Active' : 'Busy'}</Text>
                </View>
              </View>
              <View style={styles.driverBody}>
                <Text style={styles.driverDesc}>{item.description}</Text>
                <View style={styles.driverDetailsGrid}>
                  <View style={styles.driverDetail}><Ionicons name="id-card-outline" size={14} color="#64748b" /><Text style={styles.detailText}>{item.licenseNo}</Text></View>
                  <View style={styles.driverDetail}><Ionicons name="call-outline" size={14} color="#64748b" /><Text style={styles.detailText}>{item.phone}</Text></View>
                  <View style={styles.driverDetail}><Ionicons name="cash-outline" size={14} color="#2e64e5" /><Text style={styles.priceText}>LKR {item.price}/day</Text></View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openDriverEdit(item)} style={[styles.actionBtn, { backgroundColor: '#eef2ff' }]}><Ionicons name="pencil" size={18} color="#2e64e5" /><Text style={[styles.actionBtnText, { color: '#2e64e5' }]}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDriver(item._id)} style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}><Ionicons name="trash" size={18} color="#ef4444" /><Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          )}
        />
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
                {image ? <Image source={{ uri: image }} style={styles.pickedImage} /> : (
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
                    style={styles.input} 
                    value={vehicleModel} 
                    onChangeText={(text) => setVehicleModel(text.replace(/[^a-zA-Z0-9\s-]/g, ''))} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Plate *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={vehicleNumber} 
                    placeholder="wp KG-1234"
                    onChangeText={(text) => setVehicleNumber(text.replace(/[^a-zA-Z0-9\s-]/g, ''))} 
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Phone *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={mobileNumber} 
                    onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price/Day *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={price} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      if ((cleaned.match(/\./g) || []).length <= 1) setPrice(cleaned);
                    }} 
                    keyboardType="decimal-pad" 
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput 
                  style={styles.input} 
                  value={location} 
                  onChangeText={(text) => setLocation(text.replace(/[^a-zA-Z\s]/g, ''))} 
                />
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
                {driverImage ? <Image source={{ uri: driverImage }} style={styles.pickedDriverImage} /> : (
                  <View style={styles.driverImagePlaceholder}><Ionicons name="camera" size={30} color="#ccc" /><Text style={styles.imagePlaceholderText}>Upload Driver Photo</Text></View>
                )}
              </TouchableOpacity>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={driverName} 
                    onChangeText={(text) => setDriverName(text.replace(/[^a-zA-Z\s]/g, ''))} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Phone *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={driverPhone} 
                    onChangeText={(text) => setDriverPhone(text.replace(/[^0-9]/g, ''))} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>License No *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={licenseNo} 
                    onChangeText={(text) => setLicenseNo(text.replace(/[^0-9]/g, ''))} 
                    keyboardType="numeric" 
                    maxLength={10} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>ID No *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={idNo} 
                    onChangeText={(text) => setIdNo(text.replace(/[^0-9]/g, ''))} 
                    keyboardType="numeric" 
                    maxLength={12} 
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={driverEmail} onChangeText={setDriverEmail} keyboardType="email-address" />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Experience *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 5" 
                    value={experience} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      setExperience(cleaned);
                    }} 
                    keyboardType="numeric" 
                    maxLength={2} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price/Day *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={driverPrice} 
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      if ((cleaned.match(/\./g) || []).length <= 1) {
                        setDriverPrice(cleaned);
                      }
                    }} 
                    keyboardType="decimal-pad" 
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description/Bio *</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  value={description} 
                  onChangeText={(text) => setDescription(text.replace(/[^a-zA-Z0-9\s.,]/g, ''))} 
                />
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
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: { padding: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, marginBottom: 15, paddingBottom: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  analyticsTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, elevation: 2 },
  analyticsTriggerText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, padding: 5, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#2e64e5' },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 5, alignSelf: 'flex-start' },
  addButtonText: { color: '#2e64e5', fontWeight: 'bold', marginLeft: 10, fontSize: 14 },

  filterSection: { paddingHorizontal: 20, marginBottom: 10 },
  chipScroll: { marginBottom: 5 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeChipBtn: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  chipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  activeChipBtnText: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  cardImage: { width: '100%', height: 160 },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardType: { fontSize: 12, fontWeight: 'bold', color: '#2e64e5', textTransform: 'uppercase' },
  cardModel: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  detailItem: { width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 12, color: '#64748b', marginLeft: 6 },
  priceText: { fontSize: 13, fontWeight: 'bold', color: '#2e64e5', marginLeft: 6 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { fontWeight: 'bold', fontSize: 13, marginLeft: 8 },

  driverCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, padding: 20, elevation: 3 },
  driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  driverExp: { fontSize: 13, color: '#64748b', marginTop: 2 },
  driverBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, marginBottom: 15 },
  driverDesc: { fontSize: 13, color: '#475569', marginBottom: 15, fontStyle: 'italic' },
  driverDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  driverDetail: { width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },

  analyticsModalOverlay: { flex: 1, backgroundColor: '#f4f7fe' },
  analyticsModalContainer: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
  miniStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  miniStatCard: { flex: 0.48, padding: 20, borderRadius: 18, alignItems: 'center', elevation: 2 },
  miniStatLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 5 },
  miniStatValue: { fontSize: 24, fontWeight: 'bold' },

  formContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  formScroll: { flex: 1 },
  imagePicker: { alignSelf: 'center', marginBottom: 25 },
  imagePlaceholder: { width: 160, height: 100, borderRadius: 15, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  imagePlaceholderText: { fontSize: 11, color: '#999', marginTop: 5 },
  pickedImage: { width: 200, height: 120, borderRadius: 15 },
  driverImagePicker: { alignSelf: 'center', marginBottom: 20 },
  driverImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  pickedDriverImage: { width: 100, height: 100, borderRadius: 50 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  typeChip: { flex: 0.23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeTypeChip: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  typeChipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  activeTypeChipText: { color: '#fff' },
  input: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  saveBtn: { backgroundColor: '#2e64e5', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 15, marginBottom: 30, elevation: 4 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default TransportManageScreen;
