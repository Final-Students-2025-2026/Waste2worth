import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProvider, AppContext } from './context/AppContext';
import DeviceFrame from './components/DeviceFrame';
import LoginScreen from './components/LoginScreen';
import RoleSelector from './components/RoleSelector';
import BottomNavBar from './components/BottomNavBar';
import CitizenScreen from './screens/CitizenScreen';
import CollectorScreen from './screens/CollectorScreen';
import RecyclerScreen from './screens/RecyclerScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';
import { COLORS } from './theme';

function MainApp() {
  const { currentRole, accessLevel } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('citizen');

  // Whenever accessLevel changes to 'ccr' (logging in as citizen, collector, or recycler), always land on Citizen Screen
  useEffect(() => {
    if (accessLevel === 'ccr') {
      setActiveTab('citizen');
    }
  }, [accessLevel]);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
  };

  const renderScreen = () => {
    if (accessLevel === 'admin') {
      return <AdminScreen />;
    }

    switch (activeTab) {
      case 'citizen':
        return <CitizenScreen />;
      case 'collector':
        return <CollectorScreen />;
      case 'recycler':
        return <RecyclerScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <CitizenScreen />;
    }
  };

  if (accessLevel === 'login') {
    return (
      <DeviceFrame>
        <LoginScreen />
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame>
      <View style={styles.appContainer}>
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>
        {accessLevel === 'ccr' && (
          <BottomNavBar activeTab={activeTab} onTabSelect={handleTabSelect} />
        )}
      </View>
    </DeviceFrame>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
});
