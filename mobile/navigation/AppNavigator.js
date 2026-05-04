import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ResidenceListScreen from '../screens/ResidenceListScreen';
import ResidenceDetailScreen from '../screens/ResidenceDetailScreen';
import AddResidenceScreen from '../screens/AddResidenceScreen';
import ReservationListScreen from '../screens/ReservationListScreen';
import TransportListScreen from '../screens/TransportListScreen';
import TourGuideListScreen from '../screens/TourGuideListScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DriverListScreen from '../screens/DriverListScreen';
import TransportBookingFormScreen from '../screens/TransportBookingFormScreen';
import MapExplorerScreen from '../screens/MapExplorerScreen';

// Management Screens
import TransportManageScreen from '../screens/TransportManageScreen';
import GuideManageScreen from '../screens/GuideManageScreen';
import FinanceManageScreen from '../screens/FinanceManageScreen';
import FeedbackManageScreen from '../screens/FeedbackManageScreen';
import ResidenceManageScreen from '../screens/ResidenceManageScreen';
import BookingFormScreen from '../screens/BookingFormScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Loading" component={LoadingScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      {/* Drawer Header */}
      <LinearGradient
        colors={['#34495e', '#2c3e50']}
        style={styles.drawerHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.profileContainer}>
            <View style={styles.avatarGlow}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'horizon.tourism@app.com'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || 'Explorer'}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Drawer Items */}
      <View style={styles.drawerItemsContainer}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer / Logout */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <View style={styles.logoutIconBg}>
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 2.0.4 • Horizon Premium</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const ResidenceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ResidencesList" component={ResidenceListScreen} />
    <Stack.Screen name="ResidenceDetail" component={ResidenceDetailScreen} />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { user } = useContext(AuthContext);
  const isManager = user?.role && user.role !== 'customer';
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'BookingsTab') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'AccountTab') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'MessagesTab') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#34495e',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 15,
          paddingTop: 5,
          height: 70,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen 
        name="BookingsTab" 
        component={!isManager ? ReservationListScreen : HomeScreen} 
        listeners={isManager ? {
          tabPress: e => {
            e.preventDefault();
            alert('Managers, please use the Finance Dashboard to manage bookings.');
          },
        } : {}}
        options={{ tabBarLabel: 'Bookings' }} 
      />
      <Tab.Screen name="AccountTab" component={ProfileScreen} options={{ tabBarLabel: 'Account' }} />
      <Tab.Screen 
        name="MessagesTab" 
        component={HomeScreen} 
        listeners={{
          tabPress: e => {
            e.preventDefault();
            alert('Messages Coming Soon!');
          },
        }}
        options={{ tabBarLabel: 'Messages' }} 
      />
    </Tab.Navigator>
  );
};

const MainDrawer = () => {
  const { user } = useContext(AuthContext);
  const isManager = user?.role && user.role !== 'customer';
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Hotels') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Reservations') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Transport') iconName = focused ? 'car' : 'car-outline';
          else if (route.name === 'Guides') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Drivers') iconName = focused ? 'id-card' : 'id-card-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        drawerActiveTintColor: '#34495e',
        drawerInactiveTintColor: '#64748b',
        drawerLabelStyle: {
          marginLeft: -15,
          fontSize: 15,
          fontWeight: '600',
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 10,
          paddingVertical: 5,
        },
        drawerActiveBackgroundColor: '#eff6ff',
        headerShown: false,
      })}
    >
      <Drawer.Screen name="Home" component={MainTabs} />
      <Drawer.Screen name="Hotels" component={ResidenceStack} />
      <Drawer.Screen 
        name="Reservations" 
        component={ReservationListScreen} 
        options={{
          drawerItemStyle: isManager ? { display: 'none' } : undefined
        }}
      />
      <Drawer.Screen name="Transport" component={TransportListScreen} />
      <Drawer.Screen name="Drivers" component={DriverListScreen} />
      <Drawer.Screen name="Guides" component={TourGuideListScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

const RootStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainDrawer" component={MainDrawer} options={{ headerShown: false }} />
    <Stack.Screen name="ManageTransport" component={TransportManageScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageGuides" component={GuideManageScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageFinance" component={FinanceManageScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageFeedback" component={FeedbackManageScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ManageResidences" component={ResidenceManageScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddResidence" component={AddResidenceScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ResidenceDetail" component={ResidenceDetailScreen} options={{ title: 'Hotel Details' }} />
    <Stack.Screen name="DriverList" component={DriverListScreen} options={{ title: 'Drivers' }} />
    <Stack.Screen name="TransportBookingForm" component={TransportBookingFormScreen} options={{ title: 'Transport Booking' }} />
    <Stack.Screen name="MapExplorer" component={MapExplorerScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e64e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  drawerHeader: {
    paddingBottom: 25,
    paddingTop: 60,
    borderBottomRightRadius: 50,
  },
  profileContainer: {
    paddingHorizontal: 20,
    flexDirection: 'column',
  },
  avatarGlow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  drawerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#34495e',
  },
  userInfoText: {
    marginTop: 5,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  drawerItemsContainer: {
    paddingTop: 20,
  },
  drawerFooter: {
    marginTop: 'auto',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
  },
  logoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionText: {
    marginTop: 15,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
