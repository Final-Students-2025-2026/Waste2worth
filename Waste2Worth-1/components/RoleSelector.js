import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../theme';
import { User, Truck, RefreshCw, Shield, RotateCcw } from './Icons';

export default function RoleSelector() {
  const { currentRole, accountRole, switchRole, resetDemo, logout, accessLevel, user, profile, isSupabaseActive } = useContext(AppContext);

  const roles = accessLevel === 'ccr'
    ? [
        { id: 'citizen', label: 'Citizen', color: COLORS.primary, icon: User },
        { id: 'collector', label: 'Collector', color: COLORS.secondary, icon: Truck },
        { id: 'recycler', label: 'Recycler', color: COLORS.accent, icon: RefreshCw },
      ]
    : [
        { id: 'citizen', label: 'Citizen', color: COLORS.primary, icon: User },
        { id: 'collector', label: 'Collector', color: COLORS.secondary, icon: Truck },
        { id: 'recycler', label: 'Recycler', color: COLORS.accent, icon: RefreshCw },
        { id: 'admin', label: 'Admin', color: COLORS.warning, icon: Shield },
      ];

  const displayName = profile?.full_name || user?.email || '';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.logoText}>Waste<Text style={{color: COLORS.primary}}>2</Text>Worth</Text>
          {Boolean(displayName) && (
            <Text style={styles.userBadge}>
              👤 {displayName} • Registered: <Text style={{color: COLORS.primary, fontWeight: '700'}}>{profile?.role || accountRole || 'citizen'}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          {isSupabaseActive && (user || profile) ? (
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
              <RotateCcw size={14} color={COLORS.textSecondary} />
              <Text style={styles.resetText}>Reset Demo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {roles.map(role => {
          const isActive = currentRole === role.id;
          const IconComp = role.icon;
          
          return (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleTab,
                isActive && { 
                  backgroundColor: 'rgba(' + (role.id === 'citizen' ? '22, 163, 74' : role.id === 'collector' ? '15, 118, 110' : role.id === 'recycler' ? '124, 58, 237' : '217, 119, 6') + ', 0.12)',
                  borderColor: role.color,
                  borderWidth: 1.5,
                }
              ]}
              onPress={() => switchRole(role.id)}
            >
              <IconComp 
                size={14} 
                color={isActive ? role.color : COLORS.textSecondary} 
                style={styles.tabIcon}
              />
              <Text 
                style={[
                  styles.tabLabel,
                  { color: isActive ? role.color : COLORS.textSecondary }
                ]}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  userBadge: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resetText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
  },
  roleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 85,
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
