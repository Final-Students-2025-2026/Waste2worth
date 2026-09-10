import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme';
import { User, Truck, RefreshCw, Leaf } from './Icons';

export default function BottomNavBar({ activeTab, onTabSelect }) {
  const { currentRole, switchRole } = useContext(AppContext);

  const tabs = [
    { key: 'citizen', label: 'Citizen', icon: Leaf },
    { key: 'collector', label: 'Collector', icon: Truck },
    { key: 'recycler', label: 'Recycler', icon: RefreshCw },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  const handlePress = (tabKey) => {
    if (tabKey === 'profile') {
      onTabSelect('profile');
    } else {
      switchRole(tabKey);
      onTabSelect(tabKey);
    }
  };

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => handlePress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <IconComponent
                size={20}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderRadius: 17,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activeNavLabel: {
    color: COLORS.primary,
    fontWeight: '850',
  },
});
