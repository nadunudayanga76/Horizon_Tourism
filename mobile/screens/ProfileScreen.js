import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };

  const ProfileItem = ({ icon, label, value, color }) => (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value || 'Not set'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
    </View>
  );

  const ManagerCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.managerCard} onPress={onPress}>
      <LinearGradient
        colors={[color, color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.managerCardGradient}
      >
        <Ionicons name={icon} size={28} color="#fff" />
        <Text style={styles.managerCardText}>{title}</Text>
        <View style={styles.arrowBg}>
          <Ionicons name="chevron-forward" size={16} color={color} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderManagerSection = () => {
    if (!user || user.role === 'customer') return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management Dashboard</Text>
        <View style={styles.managerGrid}>
          {(user.role === 'admin' || user.role === 'payment_manager') && (
            <ManagerCard 
              title="Finance" icon="wallet" color="#27ae60"
              onPress={() => navigation.navigate('ManageFinance')} 
            />
          )}
          {(user.role === 'admin' || user.role === 'reservation_manager' || user.role === 'residence_manager') && (
            <ManagerCard 
              title="Properties" icon="business" color="#e67e22"
              onPress={() => navigation.navigate('ManageResidences')} 
            />
          )}
          {(user.role === 'admin' || user.role === 'transport_manager') && (
            <ManagerCard 
              title="Transport" icon="car-sport" color="#3498db"
              onPress={() => navigation.navigate('ManageTransport')} 
            />
          )}
          {(user.role === 'admin' || user.role === 'tour_manager' || user.role === 'guide_manager') && (
            <ManagerCard 
              title="Tour Guides" icon="people" color="#9b59b6"
              onPress={() => navigation.navigate('ManageGuides')} 
            />
          )}
          {(user.role === 'admin' || user.role === 'feedback_manager') && (
            <ManagerCard 
              title="Feedback" icon="star" color="#e74c3c"
              onPress={() => navigation.navigate('ManageFeedback')} 
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#34495e', '#2c3e50']}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.userRole}>{user?.role?.toUpperCase().replace('_', ' ')}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {renderManagerSection()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoCard}>
              <ProfileItem 
                icon="mail" 
                label="Email Address" 
                value={user?.email} 
                color="#3498db"
              />
              <ProfileItem 
                icon="call" 
                label="Phone Number" 
                value={user?.phone} 
                color="#2ecc71"
              />
              <ProfileItem 
                icon="location" 
                label="Location" 
                value="Sri Lanka" 
                color="#e74c3c"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <View style={styles.infoCard}>
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="notifications-outline" size={22} color="#333" />
                <Text style={styles.settingText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#333" />
                <Text style={styles.settingText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="help-circle-outline" size={22} color="#333" />
                <Text style={styles.settingText}>Support Center</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#ff4d4d', '#c0392b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.versionText}>Horizon Tourism v1.0.4</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 45,
    fontWeight: 'bold',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#3498db',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#34495e',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userRole: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    marginLeft: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '700',
  },
  managerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  managerCard: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  managerCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  managerCardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  arrowBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    marginLeft: 15,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 12,
    marginBottom: 20,
  }
});

export default ProfileScreen;
