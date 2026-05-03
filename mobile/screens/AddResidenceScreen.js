import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { residenceService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const AddResidenceScreen = ({ route, navigation }) => {
  const editingItem = route.params?.item;

  const [name, setName] = useState(editingItem?.name || '');
  const [location, setLocation] = useState(editingItem?.location || '');
  const [price, setPrice] = useState(editingItem?.price?.toString() || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || 'Hotel');
  const [availability, setAvailability] = useState(editingItem?.availability ?? true);
  const [images, setImages] = useState(editingItem?.images?.length ? editingItem.images : (editingItem?.image ? [editingItem.image] : []));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If editing, perform initial validation check to show any errors in existing data
    if (editingItem) {
      const initialErrors = {};
      
      const nameFiltered = name.replace(/[^a-zA-Z\s]/g, '');
      if (name !== nameFiltered) initialErrors.name = 'Only letters are allowed';
      
      const locFiltered = location.replace(/[^a-zA-Z\s,]/g, '');
      if (location !== locFiltered) initialErrors.location = 'Only letters and commas allowed';
      
      const priceFiltered = price.replace(/[^0-9.]/g, '');
      if (price !== priceFiltered) initialErrors.price = 'Only numbers allowed';
      
      const descFiltered = description.replace(/[^a-zA-Z\s.,]/g, '');
      if (description !== descFiltered) initialErrors.description = 'Only letters allowed';
      
      setErrors(initialErrors);
    }
  }, []);

  const handleNameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setName(filtered);
    setErrors(prev => ({ ...prev, name: text !== filtered ? 'Only letters are allowed' : '' }));
  };

  const handleLocationChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s,]/g, ''); // Allowing commas for locations
    setLocation(filtered);
    setErrors(prev => ({ ...prev, location: text !== filtered ? 'Only letters and commas are allowed' : '' }));
  };

  const handlePriceChange = (text) => {
    // Allow numbers and a single decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    // Ensure only one dot
    const parts = filtered.split('.');
    const final = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setPrice(final);
    setErrors(prev => ({ ...prev, price: text !== final ? 'Only numbers and decimals are allowed' : '' }));
  };

  const handleDescriptionChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s.,]/g, ''); // Allowing basic punctuation
    setDescription(filtered);
    setErrors(prev => ({ ...prev, description: text !== filtered ? 'Only letters are allowed in description' : '' }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedUris].slice(0, 5)); // limit to 5 images
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (!name || !location || !price || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (errors.name || errors.location || errors.price || errors.description) {
      Alert.alert('Error', 'Please fix the validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('availability', String(availability));

      // Append each image
      images.forEach((img, index) => {
        if (!img.startsWith('http')) {
          const filename = img.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;

          formData.append('images', {
            uri: img,
            name: filename,
            type
          });
        } else {
          // Send existing URLs as strings if backend supports it, 
          // or just ignore them if backend doesn't handle mixed uploads perfectly
          formData.append('existingImages', img);
        }
      });

      let response;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingItem) {
        response = await residenceService.updateResidence(editingItem._id, formData, config);
      } else {
        response = await residenceService.createResidence(formData, config);
      }

      if (response.data.success) {
        Alert.alert('Success', `Hotel ${editingItem ? 'updated' : 'added'} successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const CategoryBtn = ({ type }) => (
    <TouchableOpacity
      style={[styles.catBtn, category === type && styles.catBtnActive]}
      onPress={() => setCategory(type)}
    >
      <Text style={[styles.catBtnText, category === type && styles.catBtnTextActive]}>{type}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{editingItem ? 'Edit Property' : 'Add New Property'}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {images.map((imgUri, index) => (
          <View key={index} style={styles.previewImageContainer}>
            <Image source={{ uri: imgUri }} style={styles.previewImageSmall} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
              <Ionicons name="close-circle" size={24} color="#ff4d4d" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < 5 && (
          <TouchableOpacity style={styles.addMoreImagesBtn} onPress={pickImage}>
            <Ionicons name="add" size={30} color="#666" />
            <Text style={{ color: '#666', fontSize: 12, marginTop: 5 }}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        <CategoryBtn type="Hotel" />
        <CategoryBtn type="Villa" />
        <CategoryBtn type="Homestay" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Property Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Grand Horizon Hotel" value={name} onChangeText={handleNameChange} />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} placeholder="e.g. Galle, Sri Lanka" value={location} onChangeText={handleLocationChange} />
        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Price (LKR) per night/day</Text>
        <TextInput style={styles.input} placeholder="e.g. 15000" value={price} onChangeText={handlePriceChange} keyboardType="numeric" />
        {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the property..." value={description} onChangeText={handleDescriptionChange} multiline />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Available Now</Text>
        <Switch value={availability} onValueChange={setAvailability} trackColor={{ false: "#767577", true: "#2e64e5" }} />
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.disabledButton]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Property</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  previewImageContainer: { width: 100, height: 100, borderRadius: 10, overflow: 'hidden', marginRight: 10, backgroundColor: '#eee' },
  previewImageSmall: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12 },
  addMoreImagesBtn: { width: 100, height: 100, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  label: { fontSize: 16, color: '#444', marginBottom: 8, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  catBtn: { flex: 0.3, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#f9f9f9' },
  catBtnActive: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  catBtnText: { color: '#666', fontWeight: 'bold' },
  catBtnTextActive: { color: '#fff' },
  formGroup: { marginBottom: 15 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 16 },
  errorText: { color: 'red', fontSize: 12, marginTop: 4, fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  button: { backgroundColor: '#2e64e5', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 5 },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddResidenceScreen;
