import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MapExplorerScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horizon Explorer</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Ionicons name="map-outline" size={80} color="#cbd5e1" />
        <Text style={styles.title}>Map Unavailable on Web</Text>
        <Text style={styles.subtitle}>
          The interactive map feature is currently only available on the Horizon Tourism mobile app (iOS and Android).
        </Text>
        <Text style={styles.subtitle}>
          Please use our mobile app to explore nearby hotels and transport options visually!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  backBtn: { padding: 5 },
  filterBtn: { padding: 5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#334155', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 10, lineHeight: 24 }
});

export default MapExplorerScreen;
