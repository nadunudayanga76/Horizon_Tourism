import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, SafeAreaView, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { reservationService } from '../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setFullName(filtered);
    setErrors(prev => ({ ...prev, fullName: text !== filtered ? 'Only letters allowed' : '' }));
  };

  const handleIdChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setIdNumber(filtered);
    setErrors(prev => ({ ...prev, idNumber: filtered.length > 0 && filtered.length !== 12 ? 'ID must be 12 digits' : '' }));
  };

  const handlePhoneChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(filtered);
    setErrors(prev => ({ ...prev, phone: filtered.length > 0 && filtered.length !== 10 ? 'Phone must be 10 digits' : '' }));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    setErrors(prev => ({ ...prev, email: text.length > 0 && !emailRegex.test(text) ? 'Invalid email format' : '' }));
  };

  const handleCardNumberChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setCardNumber(filtered);
    setErrors(prev => ({ ...prev, cardNumber: filtered.length > 0 && filtered.length !== 12 ? 'Must be 12 digits' : '' }));
  };

  const handleExpiryChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 4) clean = clean.slice(0, 4);
    let formatted = clean.length > 2 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean;
    setExpiry(formatted);
    setErrors(prev => ({ ...prev, expiry: clean.length > 0 && clean.length !== 4 ? 'Use MM/YY format' : '' }));
  };

  const validate = () => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!fullName) return { valid: false, msg: 'Name is required' };
    if (idNumber.length !== 12) return { valid: false, msg: '12-digit ID is required' };
    if (phone.length !== 10) return { valid: false, msg: '10-digit phone is required' };
    if (!emailRegex.test(email)) return { valid: false, msg: 'Valid email is required' };
    if (cardNumber.length !== 12) return { valid: false, msg: '12-digit card number is required' };
    if (expiry.length !== 5) return { valid: false, msg: 'Card expiry is required' };
    if (cvv.length !== 3) return { valid: false, msg: '3-digit CVV is required' };
    return { valid: true };
  };

  const handleBooking = async () => {
    const validation = validate();
    if (!validation.valid) {
      Alert.alert('Details Missing', validation.msg);
      return;
    }
    setLoading(true);
    try {
      const bookingData = {
        residenceId: residence._id,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        fullName, idNumber, phone, email,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        totalPrice,
        paymentMethod: 'Card'
      };
      const response = await reservationService.createReservation(bookingData);
      if (response.data.success) {
        Alert.alert('Success!', 'Booking request sent for approval.', [{ text: 'OK', onPress: () => navigation.navigate('MainDrawer') }]);
      }
    } catch (error) {
      Alert.alert('Booking Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, icon, value, onChangeText, error, placeholder, ...props }) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputBox, error && styles.inputError]}>
        <Ionicons name={icon} size={20} color="#94a3b8" style={{ marginRight: 12 }} />
        <TextInput 
          style={styles.textInput} 
          value={value} 
          onChangeText={onChangeText} 
          placeholder={placeholder} 
          placeholderTextColor="#cbd5e1"
          {...props} 
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Reservation Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Property Summary */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyIcon}>
            <MaterialCommunityIcons name="office-building" size={24} color="#34495e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.propName}>{residence.name}</Text>
            <View style={styles.propLoc}>
              <Ionicons name="location" size={14} color="#64748b" />
              <Text style={styles.propLocText}>{residence.location}</Text>
            </View>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>LKR {residence.price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Guest Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          <InputField label="Full Name" icon="person-outline" value={fullName} onChangeText={handleNameChange} placeholder="Enter your full name" error={errors.fullName} />
          <InputField label="National ID" icon="card-outline" value={idNumber} onChangeText={handleIdChange} placeholder="12-digit NIC number" keyboardType="numeric" error={errors.idNumber} />
          <InputField label="Phone Number" icon="call-outline" value={phone} onChangeText={handlePhoneChange} placeholder="07XXXXXXXX" keyboardType="numeric" error={errors.phone} />
          <InputField label="Email Address" icon="mail-outline" value={email} onChangeText={handleEmailChange} placeholder="example@mail.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField label="Adults" icon="people-outline" value={adults} onChangeText={(t) => setAdults(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Children" icon="happy-outline" value={children} onChangeText={(t) => setChildren(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Date Selection Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Check-in & Check-out</Text>
          <View style={styles.dateGrid}>
            <TouchableOpacity style={styles.dateItem} onPress={() => setShowCheckIn(true)}>
              <View style={styles.dateIcon}><Ionicons name="calendar-outline" size={20} color="#34495e" /></View>
              <View>
                <Text style={styles.dateLab}>Check-in Date</Text>
                <Text style={styles.dateVal}>{checkIn.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.dateDivider} />
            <TouchableOpacity style={styles.dateItem} onPress={() => setShowCheckOut(true)}>
              <View style={styles.dateIcon}><Ionicons name="calendar-outline" size={20} color="#34495e" /></View>
              <View>
                <Text style={styles.dateLab}>Check-out Date</Text>
                <Text style={styles.dateVal}>{checkOut.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {showCheckIn && <DateTimePicker value={checkIn} mode="date" display="default" minimumDate={new Date()} onChange={onCheckInChange} />}
          {showCheckOut && <DateTimePicker value={checkOut} mode="date" display="default" minimumDate={new Date(checkIn.getTime() + 86400000)} onChange={onCheckOutChange} />}
        </View>

        {/* Payment Section */}
        <View style={[styles.sectionCard, styles.paymentCard]}>
          <View style={styles.payHeader}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Ionicons name="shield-checkmark" size={20} color="#27ae60" />
          </View>
          <InputField label="Card Number" icon="card-outline" value={cardNumber} onChangeText={handleCardNumberChange} placeholder="0000 0000 0000" keyboardType="numeric" error={errors.cardNumber} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField label="Expiry" icon="time-outline" value={expiry} onChangeText={handleExpiryChange} placeholder="MM/YY" keyboardType="numeric" error={errors.expiry} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="CVV" icon="lock-closed-outline" value={cvv} onChangeText={(t) => setCvv(t.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="000" keyboardType="numeric" secureTextEntry />
            </View>
          </View>
        </View>

        {/* Final Price Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLab}>Stay Duration</Text>
            <Text style={styles.summaryVal}>{Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1} Nights</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLab}>Rate per night</Text>
            <Text style={styles.summaryVal}>LKR {residence.price.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLab}>Total Amount</Text>
            <Text style={styles.totalPriceText}>LKR {totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
          <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitBtnText}>Confirm Reservation</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Platform.OS === 'android' ? 10 : 0 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  scroll: { padding: 20, paddingTop: 10 },
  propertyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 20, marginTop: -25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  propertyIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  propName: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  propLoc: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  propLocText: { fontSize: 13, color: '#64748b', marginLeft: 4, fontWeight: '600' },
  priceBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  priceBadgeText: { fontSize: 12, fontWeight: '900', color: '#34495e' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#f1f5f9' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  textInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  errorText: { color: '#ef4444', fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  row: { flexDirection: 'row' },
  dateGrid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, padding: 15 },
  dateItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 1 },
  dateLab: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  dateVal: { fontSize: 14, fontWeight: '900', color: '#34495e', marginTop: 2 },
  dateDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0', marginHorizontal: 15 },
  paymentCard: { borderLeftWidth: 4, borderLeftColor: '#34495e' },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryCard: { backgroundColor: '#34495e', borderRadius: 24, padding: 25, marginBottom: 25 },
  summaryTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLab: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700' },
  summaryVal: { color: '#fff', fontSize: 14, fontWeight: '900' },
  totalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  totalLab: { color: '#fff', fontSize: 16, fontWeight: '900' },
  totalPriceText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  submitBtn: { height: 65, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#34495e', shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 40 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});

export default BookingFormScreen;
