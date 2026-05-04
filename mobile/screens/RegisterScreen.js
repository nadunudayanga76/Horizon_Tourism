import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({ label, icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, showToggle, onToggle, loading }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={20} color="#94a3b8" style={styles.inputIcon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={label === 'Email' ? 'none' : 'words'}
        editable={!loading}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle}>
          <Ionicons name={secureTextEntry ? "eye-outline" : "eye-off-outline"} size={20} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'Full Name, Email, and Password are required.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await register(name, email, password, phone);
      if (!result.success) {
        Alert.alert('Registration Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#34495e', '#2c3e50']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Join Horizon</Text>
            <Text style={styles.subtitle}>Begin your professional journey</Text>
          </View>

          <View style={styles.formCard}>
            <InputField 
              label="Full Name" 
              icon="person-outline" 
              placeholder="John Doe" 
              value={name} 
              onChangeText={setName} 
              loading={loading}
            />
            
            <InputField 
              label="Email Address" 
              icon="mail-outline" 
              placeholder="john@example.com" 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              loading={loading}
            />
            
            <InputField 
              label="Password" 
              icon="lock-closed-outline" 
              placeholder="••••••••" 
              value={password} 
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              loading={loading}
            />

            <InputField 
              label="Phone Number (Optional)" 
              icon="call-outline" 
              placeholder="+94 77 123 4567" 
              value={phone} 
              onChangeText={setPhone}
              keyboardType="phone-pad"
              loading={loading}
            />
            
            <TouchableOpacity 
              style={[styles.registerBtn, loading && styles.btnDisabled]} 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#34495e', '#1a252f']} style={styles.btnGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>Create Account</Text>
                    <Ionicons name="person-add" size={18} color="#fff" style={{ marginLeft: 10 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 5,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  registerBtn: {
    height: 55,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 15,
    elevation: 5,
    shadowColor: '#34495e',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  loginLink: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
