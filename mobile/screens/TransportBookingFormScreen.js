import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, SafeAreaView 
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

  const renderInput = (label, value, onChange, icon, error, props = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <Ionicons name={icon} size={20} color="#94a3b8" style={styles.inputIcon} />
        <TextInput 
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#94a3b8"
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.vehicleInfo}>
                <Ionicons name="car-sport" size={24} color="#fff" />
                <Text style={styles.headerSubText}>{vehicle.vehicleModel} • {vehicle.vehicleNumber}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          {renderInput('Full Name', fullName, handleNameChange, 'person-outline', errors.fullName, { placeholder: 'Enter your full name' })}
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 15 }}>
              {renderInput('Phone Number', phone, handlePhoneChange, 'call-outline', errors.phone, { keyboardType: 'numeric', maxLength: 10, placeholder: '07x xxxxxxx' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput('ID Number', idNumber, handleIdChange, 'card-outline', errors.idNumber, { keyboardType: 'numeric', maxLength: 12, placeholder: 'National ID' })}
            </View>
          </View>

          {renderInput('Email Address', email, handleEmailChange, 'mail-outline', errors.email, { keyboardType: 'email-address', placeholder: 'your@email.com' })}

          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#e67e22' }]}>
              <Ionicons name="calendar" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Rental Period</Text>
          </View>

          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateItem} onPress={() => setShowIn(true)}>
              <Text style={styles.dateLabel}>PICKUP DATE</Text>
              <View style={styles.dateValueWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#34495e" />
                <Text style={styles.dateValueText}>{checkIn.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={20} color="#cbd5e1" />
            </View>
            <TouchableOpacity style={styles.dateItem} onPress={() => setShowOut(true)}>
              <Text style={styles.dateLabel}>RETURN DATE</Text>
              <View style={styles.dateValueWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#34495e" />
                <Text style={styles.dateValueText}>{checkOut.toLocaleDateString()}</Text>
              </View>
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

          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#3498db' }]}>
              <Ionicons name="star" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Select Driver (Optional)</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll} contentContainerStyle={{ paddingBottom: 10 }}>
            {drivers.map(driver => (
              <TouchableOpacity 
                key={driver._id} 
                style={[styles.driverCard, selectedDriver?._id === driver._id && styles.activeDriver]}
                onPress={() => setSelectedDriver(selectedDriver?._id === driver._id ? null : driver)}
              >
                <View style={styles.driverAvatarWrapper}>
                  {driver.image && driver.image !== 'default-driver.png' ? (
                    <Image source={{ uri: driver.image }} style={styles.driverAvatar} />
                  ) : (
                    <Ionicons name="person-circle" size={55} color={selectedDriver?._id === driver._id ? '#fff' : '#34495e'} />
                  )}
                  {selectedDriver?._id === driver._id && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={[styles.driverName, selectedDriver?._id === driver._id && {color: '#fff'}]} numberOfLines={1}>{driver.name}</Text>
                <Text style={[styles.driverPrice, selectedDriver?._id === driver._id && {color: 'rgba(255,255,255,0.8)'}]}>LKR {driver.price}/day</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#27ae60' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {renderInput('Card Number', cardNo, handleCardNoChange, 'card-outline', errors.cardNo, { keyboardType: 'numeric', placeholder: 'xxxx xxxx xxxx xxxx', maxLength: 12 })}
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 15 }}>
              {renderInput('Expiry', expiry, handleExpiryChange, 'calendar-outline', errors.expiry, { placeholder: 'MM/YY', maxLength: 5, keyboardType: 'numeric' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput('CVV', cvv, handleCvvChange, 'lock-closed-outline', errors.cvv, { keyboardType: 'numeric', placeholder: 'xxx', maxLength: 3, secureTextEntry: true })}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle Rent</Text>
              <Text style={styles.summaryValue}>LKR {vehicle.price.toLocaleString()}</Text>
            </View>
            {selectedDriver && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Driver Fee</Text>
                <Text style={styles.summaryValue}>LKR {selectedDriver.price.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>LKR {calculateTotalPrice().toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
            <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.btnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Confirm Booking</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" style={{marginLeft: 10}} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { 
    padding: 25, 
    paddingTop: Platform.OS === 'ios' ? 10 : 40, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  headerContent: {
    marginBottom: 5
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },
  headerSubText: { 
    fontSize: 18, 
    color: '#fff', 
    marginLeft: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  formCard: { 
    padding: 20,
    marginTop: -20,
    backgroundColor: '#f1f5f9'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#1e293b',
    letterSpacing: 0.5
  },
  inputGroup: { marginBottom: 20 },
  label: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748b', 
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  inputIcon: { marginRight: 12 },
  input: { 
    flex: 1,
    fontSize: 16, 
    color: '#1e293b',
    fontWeight: '600'
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: { 
    color: '#ef4444', 
    fontSize: 11, 
    marginTop: 6, 
    fontWeight: '700',
    marginLeft: 5
  },
  row: { flexDirection: 'row' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  dateItem: {
    flex: 1,
    alignItems: 'center'
  },
  dateLabel: { 
    fontSize: 10, 
    color: '#94a3b8', 
    fontWeight: '800', 
    letterSpacing: 1,
    marginBottom: 8
  },
  dateValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  dateValueText: { 
    fontSize: 14, 
    color: '#34495e', 
    marginLeft: 8, 
    fontWeight: '800' 
  },
  dateArrow: {
    paddingHorizontal: 15
  },
  driverScroll: { 
    marginTop: 5,
    marginHorizontal: -5
  },
  driverCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 25, 
    marginHorizontal: 8, 
    alignItems: 'center', 
    width: 135, 
    borderWidth: 2, 
    borderColor: '#fff', 
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  activeDriver: { 
    backgroundColor: '#34495e', 
    borderColor: '#34495e' 
  },
  driverAvatarWrapper: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    marginBottom: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff'
  },
  driverAvatar: { width: '100%', height: '100%' },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    borderWidth: 2,
    borderColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  driverName: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#1e293b', 
    textAlign: 'center' 
  },
  driverPrice: { 
    fontSize: 11, 
    color: '#64748b', 
    marginTop: 4,
    fontWeight: '700'
  },
  summaryCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 25, 
    marginTop: 35,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  summaryLabel: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '600' 
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 15
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b'
  },
  totalValue: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#34495e' 
  },
  submitBtn: { 
    marginTop: 35, 
    marginBottom: 50,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#34495e',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  btnGradient: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20
  },
  submitBtnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 18,
    letterSpacing: 1
  }
});

export default TransportBookingFormScreen;
