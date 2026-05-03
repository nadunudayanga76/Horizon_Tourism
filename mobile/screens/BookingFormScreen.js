import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { reservationService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const BookingFormScreen = ({ route, navigation }) => {
  const { residence } = route.params;
  
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000));
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [totalPrice, setTotalPrice] = useState(residence.price);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    calculatePrice();
  }, [checkIn, checkOut]);

  const calculatePrice = () => {
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setTotalPrice(diffDays * residence.price);
  };

  const onCheckInChange = (event, selectedDate) => {
    setShowCheckIn(false);
    if (selectedDate) {
      setCheckIn(selectedDate);
      if (selectedDate >= checkOut) {
        setCheckOut(new Date(selectedDate.getTime() + 86400000));
      }
    }
  };

  const onCheckOutChange = (event, selectedDate) => {
    setShowCheckOut(false);
    if (selectedDate) {
      setCheckOut(selectedDate);
    }
  };

  const handleNameChange = (text) => {
    // Only allow letters and spaces
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setFullName(filtered);
    if (text !== filtered) {
      setErrors(prev => ({ ...prev, fullName: 'Only letters are allowed' }));
    } else {
      setErrors(prev => ({ ...prev, fullName: '' }));
    }
  };

  const handleIdChange = (text) => {
    // Only allow digits, max 12
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setIdNumber(filtered);
    if (filtered.length > 0 && filtered.length !== 12) {
      setErrors(prev => ({ ...prev, idNumber: 'ID Number must be exactly 12 digits' }));
    } else {
      setErrors(prev => ({ ...prev, idNumber: '' }));
    }
  };

  const handlePhoneChange = (text) => {
    // Only allow digits, max 10
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(filtered);
    if (filtered.length > 0 && filtered.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'Phone Number must be 10 digits' }));
    } else {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (text.length > 0 && !emailRegex.test(text)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleCardNumberChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setCardNumber(filtered);
    if (filtered.length > 0 && filtered.length !== 12) {
      setErrors(prev => ({ ...prev, cardNumber: 'Card Number must be 12 digits' }));
    } else {
      setErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 4) clean = clean.slice(0, 4);
    
    let formatted = clean;
    if (clean.length > 2) {
      formatted = clean.slice(0, 2) + '/' + clean.slice(2);
    }
    
    setExpiry(formatted);
    if (clean.length > 0 && clean.length !== 4) {
      setErrors(prev => ({ ...prev, expiry: 'Expiry must be MM/YY (4 digits)' }));
    } else {
      setErrors(prev => ({ ...prev, expiry: '' }));
    }
  };

  const handleCvvChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setCvv(filtered);
    if (filtered.length > 0 && filtered.length !== 3) {
      setErrors(prev => ({ ...prev, cvv: 'CVV must be 3 digits' }));
    } else {
      setErrors(prev => ({ ...prev, cvv: '' }));
    }
  };

  const validate = () => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!fullName) return { valid: false, msg: 'Full Name is required' };
    if (idNumber.length !== 12) return { valid: false, msg: 'ID Number must be exactly 12 digits' };
    if (phone.length !== 10) return { valid: false, msg: 'Phone Number must be exactly 10 digits' };
    if (!emailRegex.test(email)) return { valid: false, msg: 'Valid email is required' };
    if (cardNumber.length !== 12) return { valid: false, msg: 'Card Number must be 12 digits' };
    if (expiry.length !== 5) return { valid: false, msg: 'Expiry must be in MM/YY format' };
    if (cvv.length !== 3) return { valid: false, msg: 'CVV must be 3 digits' };
    if (checkIn >= checkOut) return { valid: false, msg: 'Check-out date must be after check-in date' };
    
    return { valid: true };
  };

  const handleBooking = async () => {
    const validation = validate();
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.msg);
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        residenceId: residence._id,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        fullName,
        idNumber,
        phone,
        email,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        totalPrice,
        paymentMethod: 'Card'
      };

      const response = await reservationService.createReservation(bookingData);
      
      if (response.data.success) {
        Alert.alert(
          'Success!',
          'Your booking request has been sent for approval.',
          [{ text: 'OK', onPress: () => navigation.navigate('MainDrawer') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.residenceName}>{residence.name}</Text>
        <Text style={styles.residenceLocation}>
          <Ionicons name="location" size={14} color="#666" /> {residence.location}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Guest Details</Text>
        

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Kamal Perera" 
            value={fullName} 
            onChangeText={handleNameChange} 
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ID Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="199500000000" 
            value={idNumber} 
            onChangeText={handleIdChange} 
            maxLength={12}
            keyboardType="numeric"
          />
          {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0771234567" 
            value={phone} 
            onChangeText={handlePhoneChange} 
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input} 
            placeholder="kamal@gmail.com" 
            value={email} 
            onChangeText={handleEmailChange} 
            keyboardType="email-address" 
            autoCapitalize="none" 
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={[styles.inputGroup, { width: '48%', marginBottom: 0 }]}>
            <Text style={styles.label}>Adults</Text>
            <TextInput 
              style={styles.input} 
              value={adults} 
              onChangeText={(t) => setAdults(t.replace(/[^0-9]/g, ''))} 
              keyboardType="numeric" 
            />
          </View>
          <View style={[styles.inputGroup, { width: '48%', marginBottom: 0 }]}>
            <Text style={styles.label}>Children</Text>
            <TextInput 
              style={styles.input} 
              value={children} 
              onChangeText={(t) => setChildren(t.replace(/[^0-9]/g, ''))} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Dates</Text>
        
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckIn(true)}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>{checkIn.toDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckOut(true)}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>{checkOut.toDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showCheckIn && (
          <DateTimePicker
            value={checkIn}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onCheckInChange}
          />
        )}

        {showCheckOut && (
          <DateTimePicker
            value={checkOut}
            mode="date"
            display="default"
            minimumDate={new Date(checkIn.getTime() + 86400000)}
            onChange={onCheckOutChange}
          />
        )}

        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={{ backgroundColor: '#f0f4ff', padding: 20, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#2e64e5', marginBottom: 20 }}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#2e64e5' }]}>Card Number</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: '#fff' }]} 
              placeholder="0000 0000 0000" 
              value={cardNumber} 
              onChangeText={handleCardNumberChange} 
              keyboardType="numeric"
              maxLength={12}
            />
            {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={[styles.label, { color: '#2e64e5' }]}>Expiry (MM/YY)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: '#fff' }]} 
                placeholder="MM/YY" 
                value={expiry} 
                onChangeText={handleExpiryChange} 
                keyboardType="numeric"
                maxLength={5}
              />
              {errors.expiry ? <Text style={styles.errorText}>{errors.expiry}</Text> : null}
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={[styles.label, { color: '#2e64e5' }]}>CVV</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: '#fff' }]} 
                placeholder="000" 
                value={cvv} 
                onChangeText={handleCvvChange} 
                keyboardType="numeric"
                secureTextEntry
                maxLength={3}
              />
              {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Rate per night/day</Text>
            <Text style={styles.priceVal}>{formatPrice(residence.price)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  residenceName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  residenceLocation: { fontSize: 16, color: '#666', marginTop: 5 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e64e5', marginBottom: 15, marginTop: 10 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#444', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 10, padding: 12, fontSize: 16, color: '#333' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4, fontWeight: '500' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  datePickerBtn: { flex: 0.48, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e1e4e8' },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  priceCard: { backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, marginVertical: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: '#555' },
  priceVal: { fontSize: 14, fontWeight: '600', color: '#333' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#d1d9ff', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalVal: { fontSize: 20, fontWeight: 'bold', color: '#2e64e5' },
  submitBtn: { backgroundColor: '#2e64e5', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#2e64e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default BookingFormScreen;
