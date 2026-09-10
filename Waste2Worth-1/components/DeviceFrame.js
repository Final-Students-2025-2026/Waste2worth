import React from 'react';
import { View, StyleSheet, Platform, SafeAreaView, Text, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../theme';

export default function DeviceFrame({ children }) {
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    return (
      <SafeAreaView style={styles.mobileContainer}>
        <StatusBar style="light" />
        <View style={styles.mobileInner}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  // Web frame render
  return (
    <View style={styles.webWrapper}>
      {/* Background decoration representing Waste2Worth */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />
      
      <View style={styles.welcomePanel}>
        <Text style={styles.brandTitle}>Waste2Worth</Text>
        <Text style={styles.brandSubtitle}>Mobile App Simulator</Text>
        <Text style={styles.brandDesc}>
          This interactive mobile simulation allows you to test the recycling marketplace workflow. Use the floating Persona Switcher at the top to toggle between Roles in real-time.
        </Text>
        <View style={styles.roleLegend}>
          <Text style={styles.legendHeader}>Workflow Steps:</Text>
          <Text style={styles.legendItem}>🟢 <Text style={{fontWeight: 'bold'}}>Citizen:</Text> Request waste pickup</Text>
          <Text style={styles.legendItem}>🔵 <Text style={{fontWeight: 'bold'}}>Collector:</Text> Claim request & simulate navigation</Text>
          <Text style={styles.legendItem}>🟣 <Text style={{fontWeight: 'bold'}}>Recycler:</Text> Weigh items & issue reward points</Text>
          <Text style={styles.legendItem}>👑 <Text style={{fontWeight: 'bold'}}>Admin:</Text> Monitor analytics & environmental impact</Text>
        </View>
      </View>

      {/* Phone container bezel */}
      <View style={styles.phoneBezel}>
        {/* Notch */}
        <View style={styles.phoneNotch}>
          <View style={styles.notchCamera} />
          <View style={styles.notchSpeaker} />
        </View>
        
        {/* Mock Status Bar */}
        <View style={styles.statusBarMock}>
          <Text style={styles.statusBarTime}>1:56</Text>
          <View style={styles.statusBarIcons}>
            <Text style={styles.statusBarIconText}>📶 🛜 🔋 81%</Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.phoneScreen}>
          {children}
        </View>
        
        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileInner: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
    backgroundColor: COLORS.background,
  },
  webWrapper: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 20,
  },
  bgGlow1: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '10%',
    right: '15%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  welcomePanel: {
    width: 320,
    marginRight: 60,
    display: Platform.select({ web: 'flex', default: 'none' }),
    color: '#fff',
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 20,
  },
  brandDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  roleLegend: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  legendHeader: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    fontSize: 14,
  },
  legendItem: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  phoneBezel: {
    width: 375,
    height: 812,
    borderRadius: 44,
    backgroundColor: '#ffffff',
    borderWidth: 12,
    borderColor: '#d1d5db',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
    zIndex: 5,
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: [{ translateX: -75 }],
    width: 150,
    height: 28,
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  notchCamera: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9ca3af',
    marginRight: 10,
  },
  notchSpeaker: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  statusBarMock: {
    height: 38,
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 90,
  },
  statusBarTime: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBarIconText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    letterSpacing: 2,
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 6,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
    opacity: 0.8,
    zIndex: 100,
  },
});
