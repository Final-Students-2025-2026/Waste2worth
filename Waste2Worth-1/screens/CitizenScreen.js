import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert, Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import {
  ArrowUpRight,
  Award,
  Bell,
  CheckCircle2,
  Coins,
  Plus,
  QrCode,
  X
} from '../components/Icons';
import { AppContext } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

export default function CitizenScreen() {
  const {
    user, profile,
    pickups, walletBalance, transactions, rewards,
    requestPickup, redeemReward, environmentalImpact, verifyQRAndCollect
  } = useContext(AppContext);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Kwaku Mensah';
  const firstName = displayName.split(' ')[0];

  // States
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | map
  const [selectedPickupQR, setSelectedPickupQR] = useState(null); // For showing QR code modal

  // Form fields
  const [wasteType, setWasteType] = useState('');
  const [weight, setWeight] = useState('');
  const [address, setAddress] = useState('');

  // Notification toast (appears periodically)
  const [notification, setNotification] = useState('');
  const notificationTimeoutRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  useEffect(() => {
    const show = () => {
      setNotification('Tip: Sachet bags are worth 1.5x points today!');
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => setNotification(''), 6000);
    };

    // Start showing the tip every 10 seconds
    notificationIntervalRef.current = setInterval(show, 10000);

    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const wasteTypes = [
    'Plastic Bottles',
    'Sachet Water Wrappers',
    'Aluminium Cans',
    'Glass',
    'Paper',
    'Cardboard'
  ];

  // (Explore Hubs removed)

  const handleRequest = () => {
    if (!address || !weight || parseFloat(weight) <= 0) {
      alert("Please fill in a valid location and weight estimation.");
      return;
    }
    const submittedType = (wasteType && wasteType.trim()) || 'Plastic Bottles';
    const newReq = requestPickup(address, submittedType, parseFloat(weight));
    setRequestModalVisible(false);
    setAddress('');
    setWeight('');
    setWasteType('Plastic Bottles');
    setNotification(`Pickup request ${newReq.id} submitted for ${submittedType}!`);
    setTimeout(() => setNotification(''), 6000);
  };

  const handleRedeem = (reward) => {
    if (walletBalance < reward.cost) {
      alert("Insufficient points balance.");
      return;
    }
    const success = redeemReward(reward);
    if (success) {
      alert(`Success! Redeemed ${reward.title}. Details sent to your phone.`);
      setRewardsModalVisible(false);
    }
  };

  // Filter active requests specifically registered by the citizen in this session
  const activePickups = pickups.filter(p => p.isRegisteredSession && p.status !== 'completed');
  const completedPickups = pickups.filter(p => p.isRegisteredSession && p.status === 'completed');

  // Filter activity logs specifically created from registered actions
  const citizenTransactions = transactions.filter(t => t.isRegisteredSession);

  return (
    <View style={styles.container}>
      {/* Notifications Bar (fixed space to avoid layout shift) */}
      <View style={styles.toastWrapper}>
        <View style={[styles.toast, !notification && styles.toastHidden]}>
          <Bell size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.toastText} numberOfLines={1}>{notification || ' '}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card & Wallet Header */}
        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.welcomeText}>Hello {firstName} 👋</Text>
            <Text style={styles.levelBadge}>Gold Recycler</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Coins size={16} color={COLORS.accent} style={{ marginRight: 4 }} />
            <Text style={styles.pointsText}>{walletBalance} pts</Text>
          </View>
        </View>

        {/* Dashboard Header */}
        <View style={styles.tabContainer}>
          <View style={[styles.tab, styles.activeTab]}>
            <Award size={16} color={COLORS.primary} />
            <Text style={[styles.tabText, styles.activeTabText]}>Dashboard</Text>
          </View>
        </View>

        <>
          {/* Wallet Overview Panel */}
          <View style={styles.walletCard}>
            <View style={styles.walletDetails}>
              <Text style={styles.walletTitle}>Reward Wallet</Text>
              <Text style={styles.walletSub}>Convert points to Mobile Money or Airtime</Text>
              <Text style={styles.walletBalance}>{walletBalance} <Text style={{ fontSize: 16, color: COLORS.accent }}>Points</Text></Text>
            </View>
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => setRewardsModalVisible(true)}
            >
              <ArrowUpRight size={16} color={COLORS.textDark} />
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          {/* Quick action request button */}
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={() => setRequestModalVisible(true)}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.mainActionText}>Request Waste Pickup</Text>
          </TouchableOpacity>

          {/* Active Requests */}
          <Text style={styles.sectionHeader}>Active Pickups ({activePickups.length})</Text>
          {activePickups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active pickups requested.</Text>
              <TouchableOpacity onPress={() => setRequestModalVisible(true)}>
                <Text style={styles.emptyLink}>Schedule one now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activePickups.map(item => (
              <View key={item.id} style={styles.pickupCard}>
                <View style={styles.pickupHeader}>
                  <Text style={styles.pickupId}>{item.id}</Text>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: item.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : item.status === 'picked_up' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(6, 182, 212, 0.1)' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: item.status === 'pending' ? COLORS.warning : item.status === 'picked_up' ? COLORS.accent : COLORS.secondary }
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.pickupDetails}><Text style={{ fontWeight: '600' }}>Type:</Text> {item.wasteType}</Text>
                <Text style={styles.pickupDetails}><Text style={{ fontWeight: '600' }}>Est. Weight:</Text> {item.estimatedWeight} kg</Text>
                <Text style={styles.pickupDetails}><Text style={{ fontWeight: '600' }}>Address:</Text> {item.address}</Text>

                {/* Status Steps tracking indicator */}
                <View style={styles.stepTracker}>
                  <Text style={styles.stepLabel}>Requested 🟡</Text>
                  <Text style={styles.stepLabel}>{item.status !== 'pending' ? 'Assigned 🔵' : 'Assigning...'}</Text>
                  {item.status === 'arrived' || item.status === 'picked_up' ? (
                    <Text style={[styles.stepLabel, { color: COLORS.primary }]}>
                      {item.status === 'picked_up' ? 'Picked Up! 🟣' : 'Collector Arrived! 🟢'}
                    </Text>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.qrButton, { flex: 1 }]}
                    onPress={() => setSelectedPickupQR(item)}
                  >
                    <QrCode size={15} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                    <Text style={styles.qrButtonText}>Show QR Code</Text>
                  </TouchableOpacity>

                  {item.status !== 'picked_up' && (
                    <TouchableOpacity
                      style={[styles.qrButton, { flex: 1, backgroundColor: COLORS.primary }]}
                      onPress={() => {
                        verifyQRAndCollect(item.id);
                        Alert.alert("Verification Scan Complete", `Pickup ${item.id} verified and marked as collected!`);
                      }}
                    >
                      <CheckCircle2 size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={[styles.qrButtonText, { color: '#ffffff' }]}>Verify Scan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Impact Panel */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Ecological Impact</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactItem}>
                <Text style={styles.impactVal}>{environmentalImpact.plastic} kg</Text>
                <Text style={styles.impactLabel}>Plastics Saved</Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={styles.impactVal}>{environmentalImpact.co2} kg</Text>
                <Text style={styles.impactLabel}>CO2 Offset</Text>
              </View>
            </View>
          </View>

          {/* History & Activity Logs */}
          <Text style={styles.sectionHeader}>History & Activity Logs</Text>
          {citizenTransactions.length === 0 && completedPickups.length === 0 ? (
            <Text style={styles.subtext}>No activity logs recorded yet.</Text>
          ) : (
            citizenTransactions.map((tx, idx) => (
              <View key={tx.id || idx} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{tx.description}</Text>
                  <Text style={styles.historySub}>
                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.date).toLocaleDateString()}
                  </Text>
                </View>
                {tx.type === 'earned' ? (
                  <Text style={[styles.historyPoints, { color: COLORS.primary }]}>+{tx.points} pts</Text>
                ) : tx.type === 'redeemed' ? (
                  <Text style={[styles.historyPoints, { color: '#ef4444' }]}>-{tx.points} pts</Text>
                ) : (
                  <Text style={[styles.historyPoints, { color: COLORS.secondary }]}>Logged 📋</Text>
                )}
              </View>
            ))
          )}
        </>
      </ScrollView>

      {/* REQUEST MODAL */}
      <Modal visible={requestModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBg}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoiding}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Request Pickup</Text>
                  <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                    <X size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Waste Category / Description</Text>
                <TextInput
                  style={[styles.textInput, { marginBottom: 8 }]}
                  value={wasteType}
                  onChangeText={setWasteType}
                  placeholder="type waste type"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <Text style={[styles.inputLabel, { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }]}>
                  Quick suggestions:
                </Text>
                <View style={styles.selectorWrapper}>
                  {wasteTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.selectorChip, wasteType === type && styles.activeChip]}
                      onPress={() => setWasteType(type)}
                    >
                      <Text style={[styles.chipText, wasteType === type && styles.activeChipText]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Estimated Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 5.5"
                  placeholderTextColor={COLORS.textSecondary}
                />

                {/* Live Reward Value Preview based on kg */}
                {Boolean(weight && parseFloat(weight) > 0) && (
                  <View style={styles.conversionPreviewBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Coins size={14} color={COLORS.primary} />
                      <Text style={styles.conversionPreviewText}>
                        Est. Reward: <Text style={{ fontWeight: '800', color: COLORS.primary }}>+{Math.round(parseFloat(weight) * 10)} EcoPoints</Text>
                        {' '}(≈ GH₵ {(parseFloat(weight) * 0.50).toFixed(2)})
                      </Text>
                    </View>
                    <Text style={styles.conversionRateNote}>Rate: 1 kg = 10 pts (GH₵ 0.50) • Driver gets GH₵ 10.00</Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Pickup Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter pickup address/landmark"
                  placeholderTextColor={COLORS.textSecondary}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleRequest}>
                  <Text style={styles.submitBtnText}>Submit Pickup Request</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* REWARDS MODAL */}
      <Modal visible={rewardsModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Rewards</Text>
              <TouchableOpacity onPress={() => setRewardsModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.walletBalanceSmall}>Current points: {walletBalance}</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {rewards.map(reward => (
                <View key={reward.id} style={styles.rewardItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardSub}>{reward.provider} • {reward.type}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.rewardPointsBtn, walletBalance < reward.cost && styles.disabledBtn]}
                    onPress={() => handleRedeem(reward)}
                  >
                    <Text style={styles.rewardPointsText}>{reward.cost} pts</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR CODE MODAL */}
      <Modal visible={selectedPickupQR !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContentQR}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verification QR Code</Text>
              <TouchableOpacity onPress={() => setSelectedPickupQR(null)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPickupQR && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrText}>Show this to the collector when they arrive</Text>

                {/* Visual Representation of QR Code */}
                <View style={styles.qrBezel}>
                  <View style={styles.qrGrid}>
                    <View style={styles.qrCornerSquare} />
                    <View style={[styles.qrCornerSquare, { position: 'absolute', right: 0 }]} />
                    <View style={[styles.qrCornerSquare, { position: 'absolute', bottom: 0 }]} />
                    {/* Simulated center pattern */}
                    <View style={styles.qrCenterDot} />
                    <Text style={styles.qrContentText}>{selectedPickupQR.id}</Text>
                  </View>
                </View>

                <Text style={styles.qrSubText}>ID: {selectedPickupQR.id}</Text>
                <Text style={[styles.qrSubText, { color: COLORS.secondary }]}>
                  Status: {selectedPickupQR.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastWrapper: {
    height: 44,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toastHidden: {
    opacity: 0,
  },
  toastText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
    alignItems: 'left',
  },
  activeTabText: {
    color: COLORS.primary,
    alignItems: 'left',

  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...SHADOWS.light,
  },
  walletDetails: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  walletSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  redeemButtonText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  mainActionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
    gap: 6,
    ...SHADOWS.glowing,
  },
  mainActionText: {
    color: "white",
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },
  pickupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  pickupId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pickupDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  stepTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  qrButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  qrButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  impactCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  impactItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  impactVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  impactLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  historySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  // Map styles
  mapGraphicMock: {
    height: 240,
    backgroundColor: '#0c121a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapNode: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  mapSelfNode: {
    position: 'absolute',
    top: 110,
    left: 170,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mapLabelText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  centerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  centerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centerStatus: {
    alignItems: 'flex-end',
  },
  // Modal styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '92%',
  },
  keyboardAvoiding: {
    width: '100%',
  },
  modalContentQR: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: 20,
    alignSelf: 'center',
    width: width - 40,
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  selectorWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeChipText: {
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
    ...SHADOWS.glowing,
  },
  submitBtnText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '850',
  },
  walletBalanceSmall: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  rewardSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rewardPointsBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  rewardPointsText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  // QR Container
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  qrText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrBezel: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
  },
  qrGrid: {
    width: 160,
    height: 160,
    backgroundColor: '#ffffff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCornerSquare: {
    width: 44,
    height: 44,
    borderWidth: 10,
    borderColor: '#0f172a',
    backgroundColor: 'transparent',
  },
  qrCenterDot: {
    width: 24,
    height: 24,
    backgroundColor: '#0f172a',
    borderRadius: 4,
  },
  qrContentText: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
  },
  qrSubText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  conversionPreviewBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  conversionPreviewText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  conversionRateNote: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
});
