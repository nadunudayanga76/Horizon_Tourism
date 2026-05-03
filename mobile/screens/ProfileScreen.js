import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

  const ProfileItem = ({ icon, label, value }) => (
    <View style={styles.item}>
      <Ionicons name={icon} size={22} color="#2e64e5" />
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  const ManagerCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.managerCard, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={28} color="#fff" />
      <Text style={styles.managerCardText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#fff" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );

  const renderManagerSection = () => {
    if (!user || user.role === 'customer') return null;

    return (
      <View style={styles.managerSection}>
        <Text style={styles.managerSectionTitle}>Management Tools</Text>
        
        {(user.role === 'admin' || user.role === 'payment_manager') && (
          <ManagerCard 
            title="Finance Dashboard" icon="wallet" color="#27ae60"
            onPress={() => navigation.navigate('ManageFinance')} 
          />
        )}
        {(user.role === 'admin' || user.role === 'reservation_manager' || user.role === 'residence_manager') && (
          <ManagerCard 
            title="Manage Properties" icon="business" color="#e67e22"
            onPress={() => navigation.navigate('ManageResidences')} 
          />
        )}
        {(user.role === 'admin' || user.role === 'transport_manager') && (
          <ManagerCard 
            title="Manage Transport" icon="car-sport" color="#f1c40f"
            onPress={() => navigation.navigate('ManageTransport')} 
          />
        )}
        {(user.role === 'admin' || user.role === 'tour_manager' || user.role === 'guide_manager') && (
          <ManagerCard 
            title="Manage Guides" icon="people" color="#9b59b6"
            onPress={() => navigation.navigate('ManageGuides')} 
          />
        )}
        {(user.role === 'admin' || user.role === 'feedback_manager') && (
          <ManagerCard 
            title="User Feedback" icon="star" color="#e74c3c"
            onPress={() => navigation.navigate('ManageFeedback')} 
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.userRole}>{user?.role?.toUpperCase().replace('_', ' ')}</Text>
        </View>
      </View>

      {renderManagerSection()}

      <View style={styles.infoContainer}>
        <Text style={styles.managerSectionTitle}>Personal Info</Text>
        <ProfileItem icon="mail" label="Email Address" value={user?.email} />
        <ProfileItem icon="call" label="Phone Number" value={user?.phone} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2e64e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    color: '#2e64e5',
    fontWeight: 'bold',
    marginTop: 5,
  },
  infoContainer: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    marginLeft: 15,
  },
  itemLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4d4d',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  managerSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  managerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  managerCardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  roleBadge: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
});

export default ProfileScreen;
