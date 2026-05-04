import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, Image, Platform, SafeAreaView, StatusBar } from 'react-native';
import { residenceService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const InputField = ({ label, icon, value, onChangeText, error, placeholder, multiline, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputBox, multiline && styles.textAreaBox, error && styles.inputError]}>
      <Ionicons name={icon} size={20} color="#94a3b8" style={multiline ? { marginTop: 15, marginRight: 12 } : { marginRight: 12 }} />
      <TextInput 
        style={[styles.textInput, multiline && styles.textArea]} 
        value={value} 
        onChangeText={onChangeText} 
        placeholder={placeholder} 
        placeholderTextColor="#cbd5e1"
        multiline={multiline}
        {...props} 
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const AddResidenceScreen = ({ route, navigation }) => {
  const editingItem = route.params?.item;

  const [name, setName] = useState(editingItem?.name || '');
  const [location, setLocation] = useState(editingItem?.location || '');
  const [price, setPrice] = useState(editingItem?.price?.toString() || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || 'Hotel');
  const [availability, setAvailability] = useState(editingItem?.availability ?? true);
  const [images, setImages] = useState(editingItem?.images?.length ? editingItem.images : (editingItem?.image ? [editingItem.image] : []));
  const [errors, setErrors] = useState({}); // --- LIVE VALIDATION STATE ---
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      validateAll();
    }
  }, []);

  // ═══════════════════════════════════════════════
  // VALIDATION SECTION — Property Create / Edit Form
  // validateAll() runs on mount when EDITING to pre-check existing values
  const validateAll = () => {
    const initialErrors = {};
    if (name && !/^[a-zA-Z\s]+$/.test(name)) initialErrors.name = 'Letters only';       // Rule: Name letters only
    if (location && !/^[a-zA-Z\s,]+$/.test(location)) initialErrors.location = 'Letters & commas only'; // Rule: Location letters & commas
    if (price && !/^[0-9.]+$/.test(price)) initialErrors.price = 'Numbers only';         // Rule: Price numbers only
    setErrors(initialErrors);
  };

  // Live validators: fire on every keystroke to give instant feedback
  const handleNameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');   // Strip non-letter characters
    setName(filtered);
    setErrors(prev => ({ ...prev, name: text !== filtered ? 'Only letters allowed' : '' }));
  };

  const handleLocationChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s,]/g, '');  // Strip special chars except comma
    setLocation(filtered);
    setErrors(prev => ({ ...prev, location: text !== filtered ? 'Only letters & commas allowed' : '' }));
  };

  const handlePriceChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, '');        // Strip non-numeric characters
    setPrice(filtered);
    setErrors(prev => ({ ...prev, price: text !== filtered ? 'Only numbers allowed' : '' }));
  };
  // ═══════════════════════════════════════════════

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedUris].slice(0, 5));
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    // ═══════════════════════════════════════════════
    // VALIDATION START — Property Submit Gate
    // Rule 1: Core fields cannot be empty
    if (!name || !location || !price || !description) {
      Alert.alert('Missing Info', 'Please fill in all mandatory fields.');
      return;
    }
    // Rule 2: Block save if live validators detected format errors
    if (Object.values(errors).some(e => e !== '')) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }
    // Rule 3: At least one property photo is required
    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one image');
      return;
    }
    // VALIDATION END
    // ═══════════════════════════════════════════════

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('availability', String(availability));

      images.forEach((img) => {
        if (!img.startsWith('http')) {
          const filename = img.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('images', { uri: img, name: filename, type });
        } else {
          formData.append('existingImages', img);
        }
      });

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = editingItem 
        ? await residenceService.updateResidence(editingItem._id, formData, config)
        : await residenceService.createResidence(formData, config);

      if (response.data.success) {
        Alert.alert('Success', `Property ${editingItem ? 'updated' : 'added'}!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingItem ? 'Edit Property' : 'Add Property'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Media Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Property Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((imgUri, index) => (
              <View key={index} style={styles.previewContainer}>
                <Image source={{ uri: imgUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={30} color="#34495e" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.helperText}>Up to 5 high-quality photos allowed.</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Category & Status</Text>
          <View style={styles.categoryGrid}>
            {['Hotel', 'Villa', 'Homestay'].map(type => (
              <TouchableOpacity 
                key={type}
                style={[styles.catBtn, category === type && styles.catBtnActive]}
                onPress={() => setCategory(type)}
              >
                <Text style={[styles.catBtnText, category === type && styles.catBtnTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Visibility Status</Text>
              <Text style={styles.statusSub}>{availability ? 'Visible to customers' : 'Hidden from listings'}</Text>
            </View>
            <Switch value={availability} onValueChange={setAvailability} trackColor={{ false: "#e2e8f0", true: "#34495e" }} thumbColor={availability ? "#fff" : "#f4f3f4"} />
          </View>
        </View>

        {/* General Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>General Information</Text>
          <InputField label="Property Name" icon="business-outline" value={name} onChangeText={handleNameChange} placeholder="e.g. Grand Horizon Palace" error={errors.name} />
          <InputField label="Location" icon="location-outline" value={location} onChangeText={handleLocationChange} placeholder="e.g. Hikkaduwa, Sri Lanka" error={errors.location} />
          <InputField label="Base Price (LKR)" icon="cash-outline" value={price} onChangeText={handlePriceChange} placeholder="e.g. 15000" keyboardType="numeric" error={errors.price} />
          <InputField label="Detailed Description" icon="document-text-outline" value={description} onChangeText={setDescription} placeholder="Tell customers about your property..." multiline />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitBtnText}>{editingItem ? 'Update Property' : 'Save Property'}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 10 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 10 : 0 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  scroll: { padding: 20, paddingTop: 10 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  imageScroll: { flexDirection: 'row', marginBottom: 10 },
  previewContainer: { width: 100, height: 100, borderRadius: 15, marginRight: 12, position: 'relative' },
  previewImage: { width: '100%', height: '100%', borderRadius: 15 },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12 },
  addPhotoBtn: { width: 100, height: 100, borderRadius: 15, borderBasis: 1, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  addPhotoText: { fontSize: 11, fontWeight: '800', color: '#64748b', marginTop: 5 },
  helperText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 10 },
  categoryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  catBtn: { flex: 0.31, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  catBtnActive: { backgroundColor: '#34495e', borderColor: '#34495e' },
  catBtnText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  catBtnTextActive: { color: '#fff' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 18 },
  statusLabel: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  statusSub: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#f1f5f9' },
  textAreaBox: { height: 120, alignItems: 'flex-start' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  textInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  textArea: { height: '100%', textAlignVertical: 'top', paddingTop: 15 },
  errorText: { color: '#ef4444', fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  submitBtn: { height: 65, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#34495e', shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 40 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});

export default AddResidenceScreen;
