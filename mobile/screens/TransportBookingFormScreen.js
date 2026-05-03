import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { driverService, transportBookingService } from '../services/api';

const TransportBookingFormScreen = ({ route, navigation }) => {
  const { vehicle } = route.params;

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date());
  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);

  // Credit Card
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await driverService.getDrivers();
        setDrivers(res.data.data.filter(d => d.available));
      } catch (e) { console.log(e); }
    };
    fetchDrivers();
  }, []);

  const handleNameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    setFullName(filtered);
    setErrors(prev => ({ ...prev, fullName: text !== filtered ? 'Only letters are allowed' : '' }));
  };

  const handlePhoneChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(filtered);
    setErrors(prev => ({ ...prev, phone: (filtered.length > 0 && filtered.length !== 10) ? 'Phone must be 10 digits' : '' }));
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

  const handleCardNoChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 12);
    setCardNo(filtered);
    setErrors(prev => ({ ...prev, cardNo: (filtered.length > 0 && filtered.length !== 12) ? 'Card Number must be 12 digits' : '' }));
  };

  const handleExpiryChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + '/' + clean.slice(2);
    setExpiry(formatted);
    setErrors(prev => ({ ...prev, expiry: (clean.length > 0 && clean.length !== 4) ? 'Use MM/YY' : '' }));
  };

  const handleCvvChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setCvv(filtered);
    setErrors(prev => ({ ...prev, cvv: (filtered.length > 0 && filtered.length !== 3) ? 'CVV must be 3 digits' : '' }));
  };

  const calculateTotalPrice = () => {
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    let total = diffDays * vehicle.price;
    if (selectedDriver) {
      total += diffDays * selectedDriver.price;
    }
    return total;
  };

  const handleBooking = async () => {
    if (!fullName || !phone || !email || !idNumber || !cardNo || !expiry || !cvv) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (errors.fullName || errors.phone || errors.email || errors.idNumber || errors.cardNo || errors.expiry || errors.cvv) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const data = {
        vehicle: vehicle._id,
        driver: selectedDriver?._id,
        fullName,
        phone,
        email,
        idNumber,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice: calculateTotalPrice(),
        creditCard: { number: cardNo, expiry, cvv }
      };

      await transportBookingService.createBooking(data);
      Alert.alert('Success', 'Thank you! Your booking request has been sent.', [
        { text: 'OK', onPress: () => navigation.navigate('MainDrawer') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#2e64e5', '#1c3d8a']} style={styles.header}>
          <Text style={styles.headerTitle}>Transport Booking</Text>
          <Text style={styles.headerSub}>{vehicle.vehicleModel} - {vehicle.vehicleNumber}</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              value={fullName} 
              onChangeText={handleNameChange} 
              placeholder="Your Name" 
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={handlePhoneChange} 
                keyboardType="numeric" 
                maxLength={10} 
              />
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>ID Number</Text>
              <TextInput 
                style={styles.input} 
                value={idNumber} 
                onChangeText={handleIdChange} 
                keyboardType="numeric" 
                maxLength={12} 
              />
              {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={handleEmailChange} keyboardType="email-address" placeholder="example@mail.com" />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.datePicker, { marginRight: 10 }]} onPress={() => setShowIn(true)}>
              <Text style={styles.dateLabel}>Check-In</Text>
              <Text style={styles.dateValue}>{checkIn.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowOut(true)}>
              <Text style={styles.dateLabel}>Check-Out</Text>
              <Text style={styles.dateValue}>{checkOut.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          {showIn && (
            <DateTimePicker 
              value={checkIn} 
              mode="date" 
              display="default" 
              minimumDate={new Date()}
              onChange={(e, date) => { 
                setShowIn(false); 
                if(date) {
                  setCheckIn(date);
                  if (date > checkOut) setCheckOut(date);
                }
              }} 
            />
          )}
          {showOut && (
            <DateTimePicker 
              value={checkOut} 
              mode="date" 
              display="default" 
              minimumDate={checkIn}
              onChange={(e, date) => { 
                setShowOut(false); 
                if(date) setCheckOut(date); 
              }} 
            />
          )}

          <Text style={styles.sectionTitle}>Select Driver (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll}>
            {drivers.map(driver => (
              <TouchableOpacity 
                key={driver._id} 
                style={[styles.driverCard, selectedDriver?._id === driver._id && styles.activeDriver]}
                onPress={() => setSelectedDriver(selectedDriver?._id === driver._id ? null : driver)}
              >
                <View style={styles.driverAvatarContainer}>
                  {driver.image && driver.image !== 'default-driver.png' ? (
                    <Image source={{ uri: driver.image }} style={styles.driverAvatar} />
                  ) : (
                    <Ionicons name="person-circle" size={50} color={selectedDriver?._id === driver._id ? '#fff' : '#2e64e5'} />
                  )}
                </View>
                <Text style={[styles.driverName, selectedDriver?._id === driver._id && {color: '#fff'}]} numberOfLines={1}>{driver.name}</Text>
                <Text style={[styles.driverPrice, selectedDriver?._id === driver._id && {color: '#fff'}]}>LKR {driver.price}/day</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Payment Details (Secure)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput 
              style={styles.input} 
              value={cardNo} 
              onChangeText={handleCardNoChange} 
              keyboardType="numeric" 
              placeholder="1234 5678 9012" 
              maxLength={12} 
            />
            {errors.cardNo ? <Text style={styles.errorText}>{errors.cardNo}</Text> : null}
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Expiry</Text>
              <TextInput 
                style={styles.input} 
                value={expiry} 
                onChangeText={handleExpiryChange} 
                placeholder="MM/YY" 
                maxLength={5} 
                keyboardType="numeric" 
              />
              {errors.expiry ? <Text style={styles.errorText}>{errors.expiry}</Text> : null}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput 
                style={styles.input} 
                value={cvv} 
                onChangeText={handleCvvChange} 
                keyboardType="numeric" 
                placeholder="123" 
                maxLength={3} 
                secureTextEntry 
              />
              {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
            </View>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Estimated Price</Text>
            <Text style={styles.totalValue}>LKR {calculateTotalPrice().toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitBtnText}>Request Booking</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  formContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 25, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 },
  errorText: { color: 'red', fontSize: 11, marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row' },
  datePicker: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  dateLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  dateValue: { fontSize: 15, color: '#1e293b', marginTop: 4, fontWeight: '600' },
  driverScroll: { marginBottom: 10 },
  driverCard: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginRight: 15, alignItems: 'center', width: 130, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  activeDriver: { backgroundColor: '#2e64e5', borderColor: '#2e64e5' },
  driverAvatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 10 },
  driverAvatar: { width: '100%', height: '100%' },
  driverName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  driverPrice: { fontSize: 10, color: '#64748b', marginTop: 2 },
  totalBox: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 20, marginTop: 30, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#2e64e5', marginTop: 5 },
  submitBtn: { backgroundColor: '#2e64e5', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 50 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default TransportBookingFormScreen;
