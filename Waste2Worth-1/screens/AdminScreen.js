import React, { useContext, useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart2,
  Briefcase,
  CheckCircle,
  Clock,
  Coins,
  Droplets,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Layers,
  Leaf,
  LogOut,
  MapPin,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  QrCode,
  Recycle,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  User,
  Users,
  X,
  Zap,
} from '../components/Icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../theme';

export default function AdminScreen() {
  const {
    pickups,
    environmentalImpact,
    profiles,
    walletBalance,
    collectorEarnings,
    transactions,
    rewards,
    updateProfileRole,
    updateProfileWallet,
    fetchAllProfiles,
    logout,
    resetDemo,
    isSupabaseActive,
    // Admin Master Operations across Citizen, Collector, Recycler
    adminAssignCollector,
    adminForceCollect,
    adminDirectProcessDelivery,
    adminCancelPickup,
    adminCreateCustomPickup,
    adminDisburseCollectorEarnings,
  } = useContext(AppContext);

  // Active Main Tab: 'overview' | 'citizens' | 'collectors' | 'recyclers' | 'pitch'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [createReqModal, setCreateReqModal] = useState(false);
  const [dispatchModal, setDispatchModal] = useState(false);
  const [weighModal, setWeighModal] = useState(false);
  const [payoutModal, setPayoutModal] = useState(false);
  const [pitchTopic, setPitchTopic] = useState(null);

  // Selected target for modal operations
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState('COL-001');
  const [inputWeight, setInputWeight] = useState('10.0');
  const [payoutAmount, setPayoutAmount] = useState('50.00');

  // New citizen request form state
  const [newCitizenName, setNewCitizenName] = useState('');
  const [newCitizenPhone, setNewCitizenPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newWasteType, setNewWasteType] = useState('Plastic Bottles');
  const [newEstWeight, setNewEstWeight] = useState('8.0');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [citizenFilter, setCitizenFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed'

  // Registered Stakeholders
  const registeredUsers = useMemo(() => {
    if (profiles && profiles.length > 0) return profiles;
    return [
      { id: 'demo-1', full_name: 'Kwaku Mensah', role: 'citizen', phone: '+233 24 123 4567', created_at: '2026-01-10', wallet_balance: 0 },
      { id: 'demo-2', full_name: 'Ama Serwaa', role: 'collector', phone: '+233 55 987 6543', created_at: '2026-02-14', wallet_balance: 0 },
      { id: 'demo-3', full_name: 'EcoCycle Processing Ltd', role: 'recycler', phone: '+233 20 444 8888', created_at: '2026-03-01', wallet_balance: 0 },
      { id: 'demo-4', full_name: 'Kofi Boakye', role: 'citizen', phone: '+233 27 555 1234', created_at: '2026-03-12', wallet_balance: 0 },
      { id: 'demo-5', full_name: 'Abena Osei', role: 'admin', phone: '+233 24 000 1122', created_at: '2026-01-01', wallet_balance: 0 },
    ];
  }, [profiles]);

  // Stakeholder subsets
  const citizenUsers = registeredUsers.filter(u => (u.role || '').toLowerCase() === 'citizen');
  const collectorUsers = registeredUsers.filter(u => (u.role || '').toLowerCase() === 'collector');
  const recyclerUsers = registeredUsers.filter(u => (u.role || '').toLowerCase() === 'recycler');

  // Pickup Categories
  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const activeCollectorTasks = pickups.filter(p => ['accepted', 'arrived', 'picked_up'].includes(p.status));
  const factoryIntakeQueue = pickups.filter(p => p.status === 'picked_up');
  const completedShipments = pickups.filter(p => p.status === 'completed');

  // Aggregations
  const totalPickupsCount = pickups.length;
  const totalDivertedKg = environmentalImpact.total || 0;
  const plasticKg = environmentalImpact.plastic || 0;
  const otherKg = environmentalImpact.other || 0;
  const plasticPct = totalDivertedKg > 0 ? Math.min(100, Math.round((plasticKg / totalDivertedKg) * 100)) : 60;
  const otherPct = 100 - plasticPct;

  const totalPointsAwarded = completedShipments.reduce((sum, p) => sum + (p.pointsAwarded || 0), 0);
  const totalCollectorEarningsPool = collectorEarnings.balance || 0;
  const totalEcosystemValue = (totalDivertedKg * 2.5).toFixed(2);

  // Environmental Equivalents
  const energySaved = Math.round(plasticKg * 5.7);
  const waterSaved = Math.round(plasticKg * 3.0);
  const treesOffset = parseFloat((environmentalImpact.co2 / 21.8).toFixed(1));

  // Handlers for Master Operations
  const handleCreateCitizenPickup = async () => {
    if (!newAddress || !newEstWeight) {
      Alert.alert('Required Fields', 'Please enter at least an address and estimated weight.');
      return;
    }
    await adminCreateCustomPickup({
      citizenName: newCitizenName || 'Citizen User',
      citizenPhone: newCitizenPhone || '+233 20 123 4567',
      address: newAddress,
      wasteType: newWasteType,
      estimatedWeight: parseFloat(newEstWeight) || 5.0,
    });
    setCreateReqModal(false);
    setNewCitizenName('');
    setNewCitizenPhone('');
    setNewAddress('');
    Alert.alert('Pickup Dispatched', 'New citizen request has been broadcasted across the network.');
  };

  const handleOpenDispatch = (pickup) => {
    setSelectedPickup(pickup);
    setDispatchModal(true);
  };

  const handleConfirmDispatch = async () => {
    if (selectedPickup) {
      await adminAssignCollector(selectedPickup.id, selectedCollectorId);
      setDispatchModal(false);
      Alert.alert('Dispatched', `Pickup ${selectedPickup.id} manually assigned to Driver ${selectedCollectorId}.`);
      setSelectedPickup(null);
    }
  };

  const handleForcePickup = async (pickupId) => {
    Alert.alert(
      'Force Verify Handover',
      `Bypass QR code verification and mark request ${pickupId} as collected and loaded into vehicle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Verify',
          style: 'default',
          onPress: async () => {
            await adminForceCollect(pickupId);
            Alert.alert('Handover Verified', `Request ${pickupId} marked as collected and in transit to hub.`);
          },
        },
      ]
    );
  };

  const handleOpenWeighScale = (pickup) => {
    setSelectedPickup(pickup);
    setInputWeight((pickup.estimatedWeight || 10).toString());
    setWeighModal(true);
  };

  const handleConfirmWeigh = async () => {
    if (!selectedPickup || !inputWeight) return;
    const weight = parseFloat(inputWeight) || 5.0;
    await adminDirectProcessDelivery(selectedPickup.id, weight);
    setWeighModal(false);
    Alert.alert(
      'Batch Certified & Processed',
      `Recorded ${weight}kg for ${selectedPickup.id}. EcoPoints credited to citizen and cash disbursed to collector.`
    );
    setSelectedPickup(null);
  };

  const handleCancelPickup = async (pickupId) => {
    Alert.alert(
      'Cancel Pickup Request',
      `Are you sure you want to permanently remove request ${pickupId}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Delete Request',
          style: 'destructive',
          onPress: async () => {
            await adminCancelPickup(pickupId);
            Alert.alert('Request Cancelled', `Pickup ${pickupId} was deleted.`);
          },
        },
      ]
    );
  };

  const handleDisbursePayout = async () => {
    const amt = parseFloat(payoutAmount) || 0;
    if (amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    await adminDisburseCollectorEarnings('COL-001', amt);
    setPayoutModal(false);
    Alert.alert('Payout Disbursed', `Successfully wired GH₵${amt.toFixed(2)} to Driver mobile money wallet.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* ================= TOP HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.liveIndicator}>
              <View style={styles.pulseDot} />
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>ADMIN MASTER CONSOLE</Text>
          </View>
        </View>

        {/* ================= CROSS-FUNCTIONAL KPI BANNER ================= */}
        <View style={styles.kpiBanner}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{totalDivertedKg}<Text style={styles.kpiUnit}>kg</Text></Text>
            <Text style={styles.kpiLabel}>Diverted Weight</Text>
            <View style={styles.kpiSubItem}>
              <Leaf size={10} color={COLORS.primary} />
              <Text style={styles.kpiSubText}>{environmentalImpact.co2}kg CO₂e</Text>
            </View>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>GH₵{totalEcosystemValue}</Text>
            <Text style={styles.kpiLabel}>Ecosystem Value</Text>
            <View style={styles.kpiSubItem}>
              <Coins size={10} color={COLORS.warning} />
              <Text style={[styles.kpiSubText, { color: COLORS.warning }]}>{totalPointsAwarded} pts issued</Text>
            </View>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{totalPickupsCount}</Text>
            <Text style={styles.kpiLabel}>Total Operations</Text>
            <View style={styles.kpiSubItem}>
              <Activity size={10} color="#3b82f6" />
              <Text style={[styles.kpiSubText, { color: '#3b82f6' }]}>{completedShipments.length} Completed</Text>
            </View>
          </View>
        </View>

        {/* ================= NAV PERSONA TABS ================= */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'overview' && styles.activeTabItem]}
            onPress={() => setActiveTab('overview')}
          >
            <BarChart2 size={14} color={activeTab === 'overview' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === 'overview' && styles.activeTabItemText]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'citizens' && styles.activeTabItem]}
            onPress={() => setActiveTab('citizens')}
          >
            <User size={14} color={activeTab === 'citizens' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === 'citizens' && styles.activeTabItemText]}>
              Citizens ({citizenUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'collectors' && styles.activeTabItem]}
            onPress={() => setActiveTab('collectors')}
          >
            <Truck size={14} color={activeTab === 'collectors' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === 'collectors' && styles.activeTabItemText]}>
              Fleet ({collectorUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'recyclers' && styles.activeTabItem]}
            onPress={() => setActiveTab('recyclers')}
          >
            <Scale size={14} color={activeTab === 'recyclers' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === 'recyclers' && styles.activeTabItemText]}>
              Hubs ({recyclerUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pitch' && styles.activeTabItem]}
            onPress={() => setActiveTab('pitch')}
          >
            <Sparkles size={14} color={activeTab === 'pitch' ? '#8b5cf6' : COLORS.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === 'pitch' && { color: '#8b5cf6', fontWeight: '800' }]}>
              Pitch
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TAB 1: EXECUTIVE OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <>
            {/* Presentation Talking Point Card */}
            <View style={styles.pitchTipCard}>
              <View style={styles.pitchTipHeader}>
                <Sparkles size={15} color="#8b5cf6" />
                <Text style={styles.pitchTipTitle}>Presentation Talking Point</Text>
              </View>
              <Text style={styles.pitchTipText}>
                "The Admin Dashboard acts as the central brain, dynamically orchestrating household drop-offs, collector logistics, factory scale verifications, and incentive payouts in real-time."
              </Text>
            </View>

            {/* Quick Master Actions */}
            <Text style={styles.sectionHeading}>Master Executive Controls</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionGridBtn}
                onPress={() => setCreateReqModal(true)}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.actionGridBtnText}>Dispatch Citizen Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionGridBtn, { backgroundColor: '#3b82f6' }]}
                onPress={() => setActiveTab('collectors')}
              >
                <Navigation size={16} color="#ffffff" />
                <Text style={styles.actionGridBtnText}>Manage Fleet Routes</Text>
              </TouchableOpacity>
            </View>

            {/* Environmental Impact Equivalents Grid */}
            <Text style={styles.sectionHeading}>Calculated Environmental Equivalents</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactBox}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#ecfdf5' }]}>
                  <Text style={styles.impactEmoji}>🌳</Text>
                </View>
                <Text style={styles.impactNumber}>{treesOffset}</Text>
                <Text style={styles.impactTitle}>Trees Offset</Text>
                <Text style={styles.impactDetail}>CO₂ absorption match</Text>
              </View>

              <View style={styles.impactBox}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#fffbeb' }]}>
                  <Text style={styles.impactEmoji}>⚡</Text>
                </View>
                <Text style={styles.impactNumber}>{energySaved} <Text style={styles.impactUnitSmall}>kWh</Text></Text>
                <Text style={styles.impactTitle}>Grid Power Saved</Text>
                <Text style={styles.impactDetail}>Avoided virgin polymer synthesis</Text>
              </View>

              <View style={styles.impactBox}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <Text style={styles.impactEmoji}>🚰</Text>
                </View>
                <Text style={styles.impactNumber}>{waterSaved} <Text style={styles.impactUnitSmall}>L</Text></Text>
                <Text style={styles.impactTitle}>Freshwater Saved</Text>
                <Text style={styles.impactDetail}>Cooling & processing water</Text>
              </View>

              <View style={styles.impactBox}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#fdf2f8' }]}>
                  <Text style={styles.impactEmoji}>🏭</Text>
                </View>
                <Text style={styles.impactNumber}>{environmentalImpact.co2} <Text style={styles.impactUnitSmall}>kg</Text></Text>
                <Text style={styles.impactTitle}>Net CO₂ Mitigated</Text>
                <Text style={styles.impactDetail}>Avoided open-air burning</Text>
              </View>
            </View>

            {/* Material Distribution Bar Chart */}
            <Text style={styles.sectionHeading}>Feedstock Composition</Text>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Recovered Material Stream</Text>
                <Text style={styles.cardHeaderBadge}>{totalDivertedKg} kg Total</Text>
              </View>

              <View style={styles.stackedBarContainer}>
                <View style={[styles.stackedBarSegment, { width: `${plasticPct}%`, backgroundColor: COLORS.primary }]} />
                <View style={[styles.stackedBarSegment, { width: `${otherPct}%`, backgroundColor: '#3b82f6' }]} />
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <View>
                    <Text style={styles.legendMain}>Plastics & Pure Water Sachets</Text>
                    <Text style={styles.legendSub}>{plasticKg} kg ({plasticPct}%)</Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                  <View>
                    <Text style={styles.legendMain}>Metals, Glass & Cardboard</Text>
                    <Text style={styles.legendSub}>{otherKg} kg ({otherPct}%)</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ================= TAB 2: CITIZEN OPERATIONS ================= */}
        {activeTab === 'citizens' && (
          <>
            <View style={styles.bannerInfoBox}>
              <User size={18} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bannerInfoTitle}>Citizen Management & Drop-Off Feed</Text>
                <Text style={styles.bannerInfoSub}>
                  Monitor household recycling requests, disburse reward points, and create direct drop-off orders.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => setCreateReqModal(true)}
              >
                <Plus size={14} color="#ffffff" />
                <Text style={styles.headerActionBtnText}>New Order</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterChipRow}>
              {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, citizenFilter === f && styles.activeFilterChip]}
                  onPress={() => setCitizenFilter(f)}
                >
                  <Text style={[styles.filterChipText, citizenFilter === f && styles.activeFilterChipText]}>
                    {f === 'all' ? 'All Orders' : f === 'in_progress' ? 'In Transit' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Citizen Pickups List */}
            <Text style={styles.sectionHeading}>Citizen Pickup Operations ({pickups.length})</Text>
            {pickups.length === 0 ? (
              <View style={styles.emptyCard}>
                <Package size={28} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No citizen requests found.</Text>
              </View>
            ) : (
              pickups
                .filter((p) => {
                  if (citizenFilter === 'pending') return p.status === 'pending';
                  if (citizenFilter === 'in_progress') return ['accepted', 'arrived', 'picked_up'].includes(p.status);
                  if (citizenFilter === 'completed') return p.status === 'completed';
                  return true;
                })
                .map((p) => {
                  const isPending = p.status === 'pending';
                  const isDone = p.status === 'completed';
                  return (
                    <View key={p.id || p.dbId} style={styles.operationCard}>
                      <View style={styles.opHeader}>
                        <View>
                          <Text style={styles.opCode}>{p.id}</Text>
                          <Text style={styles.opCitizen}>👤 {p.citizenName || 'Household Citizen'}</Text>
                        </View>
                        <View style={[
                          styles.statusPill,
                          isDone ? styles.statusPillDone : isPending ? styles.statusPillPending : styles.statusPillTransit
                        ]}>
                          <Text style={[
                            styles.statusPillText,
                            isDone ? styles.statusTextDone : isPending ? styles.statusTextPending : styles.statusTextTransit
                          ]}>
                            {p.status ? p.status.toUpperCase() : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.opDetails}>
                        <Text style={styles.opDetailText}>📦 <Text style={{ fontWeight: '700' }}>{p.wasteType}</Text> • ~{p.estimatedWeight}kg</Text>
                        <Text style={styles.opDetailText}>📍 {p.address}</Text>
                        {p.pointsAwarded ? (
                          <Text style={[styles.opDetailText, { color: COLORS.primary, fontWeight: '700' }]}>
                            🎁 Rewarded: +{p.pointsAwarded} EcoPoints
                          </Text>
                        ) : null}
                      </View>

                      {/* Admin Quick Control Actions */}
                      <View style={styles.opActionsRow}>
                        {isPending && (
                          <TouchableOpacity
                            style={styles.opBtnPrimary}
                            onPress={() => handleOpenDispatch(p)}
                          >
                            <Truck size={12} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={styles.opBtnPrimaryText}>Dispatch to Collector</Text>
                          </TouchableOpacity>
                        )}

                        {['accepted', 'arrived'].includes(p.status) && (
                          <TouchableOpacity
                            style={[styles.opBtnPrimary, { backgroundColor: '#3b82f6' }]}
                            onPress={() => handleForcePickup(p.id)}
                          >
                            <QrCode size={12} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={styles.opBtnPrimaryText}>Force QR Handover</Text>
                          </TouchableOpacity>
                        )}

                        {p.status === 'picked_up' && (
                          <TouchableOpacity
                            style={[styles.opBtnPrimary, { backgroundColor: '#8b5cf6' }]}
                            onPress={() => handleOpenWeighScale(p)}
                          >
                            <Scale size={12} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={styles.opBtnPrimaryText}>Weigh & Complete</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.opBtnDanger}
                          onPress={() => handleCancelPickup(p.id)}
                        >
                          <X size={12} color="#ef4444" />
                          <Text style={styles.opBtnDangerText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
            )}

            {/* Citizen Accounts Wallet Manager */}
            <Text style={styles.sectionHeading}>Registered Citizen Accounts</Text>
            {citizenUsers.map((u, idx) => (
              <View key={u.id || idx} style={styles.stakeholderItem}>
                <View style={styles.avatarWrap}>
                  <User size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.stakeholderName}>{u.full_name || 'Citizen User'}</Text>
                  <Text style={styles.stakeholderSub}>📞 {u.phone || '—'} • Wallet: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{u.wallet_balance ?? 0} pts</Text></Text>
                </View>
                <TouchableOpacity
                  style={styles.bonusBtn}
                  onPress={async () => {
                    const cur = u.wallet_balance || 0;
                    await updateProfileWallet(u.id, cur + 100);
                    fetchAllProfiles();
                    Alert.alert('EcoPoints Added', `Credited +100 EcoPoints to ${u.full_name}.`);
                  }}
                >
                  <Coins size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.bonusBtnText}>+100 Pts</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ================= TAB 3: COLLECTOR FLEET OPERATIONS ================= */}
        {activeTab === 'collectors' && (
          <>
            <View style={[styles.bannerInfoBox, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}>
              <Truck size={18} color="#2563eb" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.bannerInfoTitle, { color: '#1e3a8a' }]}>Collector Fleet & Logistics Command</Text>
                <Text style={[styles.bannerInfoSub, { color: '#1e40af' }]}>
                  Oversee field routes, verify vehicle collections, and disburse per-trip driver payouts.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: '#2563eb' }]}
                onPress={() => setPayoutModal(true)}
              >
                <Coins size={14} color="#ffffff" />
                <Text style={styles.headerActionBtnText}>Disburse</Text>
              </TouchableOpacity>
            </View>

            {/* Fleet Metrics */}
            <View style={styles.fleetSummaryCard}>
              <View style={styles.fleetSummaryItem}>
                <Text style={styles.fleetSummaryVal}>GH₵{collectorEarnings.balance.toFixed(2)}</Text>
                <Text style={styles.fleetSummaryLabel}>Available Driver Pool</Text>
              </View>
              <View style={styles.fleetSummaryDivider} />
              <View style={styles.fleetSummaryItem}>
                <Text style={styles.fleetSummaryVal}>{collectorEarnings.trips}</Text>
                <Text style={styles.fleetSummaryLabel}>Trips Completed</Text>
              </View>
              <View style={styles.fleetSummaryDivider} />
              <View style={styles.fleetSummaryItem}>
                <Text style={styles.fleetSummaryVal}>{activeCollectorTasks.length}</Text>
                <Text style={styles.fleetSummaryLabel}>Active On Route</Text>
              </View>
            </View>

            {/* Active Driver Tasks In Progress */}
            <Text style={styles.sectionHeading}>Live Collector Field Routes ({activeCollectorTasks.length})</Text>
            {activeCollectorTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Navigation size={28} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No active routes right now. Pending pickups are waiting for dispatch!</Text>
              </View>
            ) : (
              activeCollectorTasks.map((t) => (
                <View key={t.id} style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View>
                      <Text style={styles.routeId}>🚚 {t.id} • {t.wasteType}</Text>
                      <Text style={styles.routeCollector}>Driver: {t.collectorId || 'COL-001 (Kofi)'}</Text>
                    </View>
                    <View style={styles.routeStatusBadge}>
                      <Text style={styles.routeStatusText}>{t.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.routeLocationRow}>
                    <MapPin size={13} color="#2563eb" />
                    <Text style={styles.routeLocationText} numberOfLines={1}>{t.address}</Text>
                  </View>

                  <View style={styles.routeActions}>
                    {['accepted', 'arrived'].includes(t.status) && (
                      <TouchableOpacity
                        style={styles.forcePickupBtn}
                        onPress={() => handleForcePickup(t.id)}
                      >
                        <QrCode size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.forcePickupBtnText}>Override Handover (Load Truck)</Text>
                      </TouchableOpacity>
                    )}

                    {t.status === 'picked_up' && (
                      <TouchableOpacity
                        style={[styles.forcePickupBtn, { backgroundColor: '#8b5cf6' }]}
                        onPress={() => handleOpenWeighScale(t)}
                      >
                        <Scale size={12} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.forcePickupBtnText}>Route to Recycler & Weigh</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}

            {/* Collector Driver Directory */}
            <Text style={styles.sectionHeading}>Registered Fleet Drivers</Text>
            {collectorUsers.map((c, idx) => (
              <View key={c.id || idx} style={styles.stakeholderItem}>
                <View style={[styles.avatarWrap, { backgroundColor: '#dbeafe' }]}>
                  <Truck size={16} color="#1d4ed8" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.stakeholderName}>{c.full_name || 'Fleet Driver'}</Text>
                  <Text style={styles.stakeholderSub}>📞 {c.phone || '—'} • Status: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Active Unit</Text></Text>
                </View>
                <TouchableOpacity
                  style={[styles.bonusBtn, { backgroundColor: '#2563eb' }]}
                  onPress={async () => {
                    await updateProfileWallet(c.id, (c.wallet_balance || 0) + 50);
                    fetchAllProfiles();
                    Alert.alert('Fuel Allowance Credited', `Added GH₵50 to ${c.full_name}.`);
                  }}
                >
                  <Coins size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.bonusBtnText}>+GH₵50 Fuel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ================= TAB 4: RECYCLER FACTORY HUBS ================= */}
        {activeTab === 'recyclers' && (
          <>
            <View style={[styles.bannerInfoBox, { borderColor: '#ddd6fe', backgroundColor: '#f5f3ff' }]}>
              <Scale size={18} color="#7c3aed" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.bannerInfoTitle, { color: '#5b21b6' }]}>Industrial Recycling Factory Hubs</Text>
                <Text style={[styles.bannerInfoSub, { color: '#6d28d9' }]}>
                  Process incoming feedstock truckloads, certify actual scale weights, and mint ESG data tokens.
                </Text>
              </View>
            </View>

            {/* Factory Queue */}
            <Text style={styles.sectionHeading}>Factory Scale Intake Queue ({factoryIntakeQueue.length})</Text>
            {factoryIntakeQueue.length === 0 ? (
              <View style={styles.emptyCard}>
                <Scale size={28} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No truckloads currently awaiting weighing. Collectors will deliver batches here.</Text>
              </View>
            ) : (
              factoryIntakeQueue.map((item) => (
                <View key={item.id} style={styles.factoryCard}>
                  <View style={styles.factoryCardTop}>
                    <View>
                      <Text style={styles.factoryBatchId}>Batch #{item.id}</Text>
                      <Text style={styles.factoryType}>{item.wasteType}</Text>
                    </View>
                    <Text style={styles.factoryEstWeight}>Est: ~{item.estimatedWeight} kg</Text>
                  </View>

                  <View style={styles.factoryMeta}>
                    <Text style={styles.factoryMetaText}>🚚 Driver: {item.collectorId || 'COL-001'}</Text>
                    <Text style={styles.factoryMetaText}>👤 Origin: {item.citizenName || 'Household'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.factoryWeighBtn}
                    onPress={() => handleOpenWeighScale(item)}
                  >
                    <Scale size={14} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.factoryWeighBtnText}>Certify Scale Weight & Issue Payout</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Certified Processed Deliveries Log */}
            <Text style={styles.sectionHeading}>Processed Deliveries & Certification Logs ({completedShipments.length})</Text>
            {completedShipments.length === 0 ? (
              <View style={styles.emptyCard}>
                <CheckCircle size={28} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No processed shipments yet in this session.</Text>
              </View>
            ) : (
              completedShipments.map((s) => (
                <View key={s.id} style={styles.certifiedLogCard}>
                  <View style={styles.certifiedHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} color={COLORS.primary} />
                      <Text style={styles.certifiedId}>{s.id} • {s.wasteType}</Text>
                    </View>
                    <Text style={styles.certifiedWeight}>{s.actualWeight || s.estimatedWeight} kg Certified</Text>
                  </View>
                  <Text style={styles.certifiedDetail}>
                    Origin: {s.citizenName} • Issued {s.pointsAwarded || (s.actualWeight * 10)} EcoPoints
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        {/* ================= TAB 5: PITCH & PRESENTATION GUIDE ================= */}
        {activeTab === 'pitch' && (
          <>
            <View style={styles.pitchHeroCard}>
              <Sparkles size={24} color="#ffffff" style={{ marginBottom: 8 }} />
              <Text style={styles.pitchHeroTitle}>Presentation Master Deck</Text>
              <Text style={styles.pitchHeroSub}>
                Interactive talking points and framework breakdowns to explain Waste2Worth with 100% clarity to evaluators.
              </Text>
            </View>

            {/* 4 Interactive Topic Cards */}
            <TouchableOpacity
              style={styles.pitchTopicCard}
              onPress={() => setPitchTopic('problem')}
            >
              <View style={[styles.topicIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.topicIcon}>🚨</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.topicTitle}>1. The Problem We Solve</Text>
                <Text style={styles.topicSnippet}>
                  Urban plastic choking drains, illegal dumping, and informal pickers earning below living wage without data verification.
                </Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pitchTopicCard}
              onPress={() => setPitchTopic('solution')}
            >
              <View style={[styles.topicIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.topicIcon}>💡</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.topicTitle}>2. The Waste2Worth Solution</Text>
                <Text style={styles.topicSnippet}>
                  Digitized decentralized collection with citizen incentives, on-demand collector routing, and verified recycler feedstock.
                </Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pitchTopicCard}
              onPress={() => setPitchTopic('business')}
            >
              <View style={[styles.topicIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.topicIcon}>💰</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.topicTitle}>3. Business & Monetization Model</Text>
                <Text style={styles.topicSnippet}>
                  Marketplace spread on bulk recycled resin, corporate EPR compliance fees, and carbon credit data certification.
                </Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pitchTopicCard}
              onPress={() => setPitchTopic('sdg')}
            >
              <View style={[styles.topicIconWrap, { backgroundColor: '#ede9fe' }]}>
                <Text style={styles.topicIcon}>🌍</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.topicTitle}>4. UN Sustainable Development Goals</Text>
                <Text style={styles.topicSnippet}>
                  Direct alignment with SDG 11 (Sustainable Cities), SDG 12 (Responsible Consumption), SDG 13 (Climate), SDG 8 (Decent Work).
                </Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {/* ================= FOOTER CONTROLS ================= */}
        <View style={styles.footerWrap}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              try {
                if (logout) await logout();
                Alert.alert('Signed Out', 'You have been logged out of Administrator mode.');
              } catch (e) {
                Alert.alert('Logout Error', e?.message || 'Unexpected error');
              }
            }}
          >
            <LogOut size={14} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ================= MODAL 1: CREATE CUSTOM CITIZEN REQUEST ================= */}
      <Modal visible={createReqModal} transparent animationType="slide" onRequestClose={() => setCreateReqModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch Citizen Pickup Order</Text>
              <TouchableOpacity onPress={() => setCreateReqModal(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Citizen Full Name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Kwaku Mensah"
                value={newCitizenName}
                onChangeText={setNewCitizenName}
              />

              <Text style={styles.inputLabel}>Citizen Phone / MoMo</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. +233 24 123 4567"
                keyboardType="phone-pad"
                value={newCitizenPhone}
                onChangeText={setNewCitizenPhone}
              />

              <Text style={styles.inputLabel}>Pickup Address / Location</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Osu Oxford St, Accra"
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <Text style={styles.inputLabel}>Recyclable Waste Material</Text>
              <View style={styles.wasteTypeRow}>
                {['Plastic Bottles', 'Sachet Wrappers', 'Aluminium Cans', 'Cardboard'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.wasteTypeChip, newWasteType === t && styles.activeWasteTypeChip]}
                    onPress={() => setNewWasteType(t)}
                  >
                    <Text style={[styles.wasteTypeChipText, newWasteType === t && styles.activeWasteTypeChipText]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Estimated Weight (kg)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 10.0"
                keyboardType="numeric"
                value={newEstWeight}
                onChangeText={setNewEstWeight}
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateCitizenPickup}>
                <Text style={styles.modalSubmitBtnText}>Broadcast Pickup to Network</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: MANUAL DISPATCH TO COLLECTOR ================= */}
      <Modal visible={dispatchModal} transparent animationType="slide" onRequestClose={() => setDispatchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch to Fleet Driver</Text>
              <TouchableOpacity onPress={() => setDispatchModal(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Selected Pickup Order</Text>
              <View style={styles.selectedBox}>
                <Text style={{ fontWeight: '800', color: COLORS.textPrimary }}>{selectedPickup?.id} • {selectedPickup?.wasteType}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>📍 {selectedPickup?.address}</Text>
              </View>

              <Text style={styles.inputLabel}>Assign Driver Unit</Text>
              {['COL-001 (Kofi Mensah - Motor Tricycle)', 'COL-002 (Ama Serwaa - Eco Van)', 'COL-003 (Kwame Antwi - Cargo Bike)'].map((d, idx) => {
                const id = `COL-00${idx + 1}`;
                const isSelected = selectedCollectorId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.driverSelectBox, isSelected && styles.activeDriverSelectBox]}
                    onPress={() => setSelectedCollectorId(id)}
                  >
                    <Truck size={16} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.driverSelectText, isSelected && styles.activeDriverSelectText]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleConfirmDispatch}>
                <Text style={styles.modalSubmitBtnText}>Confirm Route Dispatch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: CERTIFIED WEIGH-IN ================= */}
      <Modal visible={weighModal} transparent animationType="slide" onRequestClose={() => setWeighModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recycler Certified Weigh Scale</Text>
              <TouchableOpacity onPress={() => setWeighModal(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Batch: {selectedPickup?.id} ({selectedPickup?.wasteType})</Text>
              <View style={styles.weighControlWrap}>
                <TouchableOpacity
                  style={styles.weighAdjustBtn}
                  onPress={() => {
                    const w = Math.max(0.5, (parseFloat(inputWeight) || 0) - 0.5);
                    setInputWeight(w.toFixed(1));
                  }}
                >
                  <Minus size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.weighInputLarge}>{inputWeight}</Text>
                  <Text style={styles.weighInputUnit}>Kilograms (Certified)</Text>
                </View>

                <TouchableOpacity
                  style={styles.weighAdjustBtn}
                  onPress={() => {
                    const w = (parseFloat(inputWeight) || 0) + 0.5;
                    setInputWeight(w.toFixed(1));
                  }}
                >
                  <Plus size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.rewardPreviewBox}>
                <Text style={styles.rewardPreviewTitle}>Automatic Token Distribution</Text>
                <Text style={styles.rewardPreviewDetail}>• Citizen Reward: +{Math.round((parseFloat(inputWeight) || 0) * 10)} EcoPoints</Text>
                <Text style={styles.rewardPreviewDetail}>• Driver Payout: GH₵10.00 (Fixed per-trip fee)</Text>
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleConfirmWeigh}>
                <Text style={styles.modalSubmitBtnText}>Certify Scale & Disburse Payout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 4: COLLECTOR PAYOUT ================= */}
      <Modal visible={payoutModal} transparent animationType="slide" onRequestClose={() => setPayoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disburse Fleet Driver Earnings</Text>
              <TouchableOpacity onPress={() => setPayoutModal(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Available Pool: GH₵{collectorEarnings.balance.toFixed(2)}</Text>
              <Text style={styles.inputLabel}>Payout Amount (GH₵)</Text>
              <TextInput
                style={styles.inputField}
                keyboardType="numeric"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleDisbursePayout}>
                <Text style={styles.modalSubmitBtnText}>Confirm Mobile Money Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 5: PITCH TOPIC MODAL ================= */}
      <Modal
        visible={!!pitchTopic}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPitchTopic(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#8b5cf6" />
                <Text style={styles.modalTitle}>
                  {pitchTopic === 'problem' && 'The Problem Space'}
                  {pitchTopic === 'solution' && 'The Solution Architecture'}
                  {pitchTopic === 'business' && 'Unit Economics & Revenue'}
                  {pitchTopic === 'sdg' && 'United Nations SDG Alignment'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPitchTopic(null)} style={styles.closeBtn}>
                <X size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {pitchTopic === 'problem' && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalPointTitle}>🛑 1. Fragmented Urban Waste</Text>
                  <Text style={styles.modalPointText}>
                    In fast-growing cities, over 65% of single-use plastics and water sachets end up in open gutters, causing severe flooding and marine contamination.
                  </Text>

                  <Text style={styles.modalPointTitle}>🛑 2. Informal Collector Exploitation</Text>
                  <Text style={styles.modalPointText}>
                    Waste pickers operate without digital records, transparent pricing, or guaranteed off-takers, often earning less than minimum subsistence wages.
                  </Text>

                  <Text style={styles.modalPointTitle}>🛑 3. Recycler Feedstock Scarcity</Text>
                  <Text style={styles.modalPointText}>
                    Industrial recyclers run below 40% capacity because they lack traceable, aggregated, and sorted supply chains from households.
                  </Text>
                </View>
              )}

              {pitchTopic === 'solution' && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalPointTitle}>✨ 1. Gamified Citizen Incentives</Text>
                  <Text style={styles.modalPointText}>
                    Households earn direct EcoPoints instantly convertible to MTN/Telecel Airtime or Mobile Money simply by segregating recyclable materials.
                  </Text>

                  <Text style={styles.modalPointTitle}>✨ 2. Uber-style Gig Collector Network</Text>
                  <Text style={styles.modalPointText}>
                    Micro-collectors receive optimized collection routes, verified QR handshakes, and immediate guaranteed per-kg payouts.
                  </Text>

                  <Text style={styles.modalPointTitle}>✨ 3. Verifiable Traceability</Text>
                  <Text style={styles.modalPointText}>
                    Every kg of plastic is time-stamped and certified from doorstep to processing hub, enabling verified corporate ESG reporting.
                  </Text>
                </View>
              )}

              {pitchTopic === 'business' && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalPointTitle}>💎 1. Marketplace Volume Spread</Text>
                  <Text style={styles.modalPointText}>
                    Waste2Worth aggregates sorted materials and sells in bulk to certified industrial plants at wholesale rate (e.g. ₵3.50/kg), distributing ₵2.00 to collectors and ₵0.50 to citizens, leaving a ₵1.00 net margin.
                  </Text>

                  <Text style={styles.modalPointTitle}>💎 2. Corporate EPR Subscriptions</Text>
                  <Text style={styles.modalPointText}>
                    FMCG beverage companies pay monthly compliance fees to fulfill mandatory Extended Producer Responsibility (EPR) recycling targets.
                  </Text>

                  <Text style={styles.modalPointTitle}>💎 3. Carbon Credit & ESG Data API</Text>
                  <Text style={styles.modalPointText}>
                    Monetization of verified plastic diversion and carbon offset certificates for international climate funds.
                  </Text>
                </View>
              )}

              {pitchTopic === 'sdg' && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalPointTitle}>🎯 SDG 11: Sustainable Cities & Communities</Text>
                  <Text style={styles.modalPointText}>
                    Reduces clogged drainage systems and open combustion of plastics in municipal neighborhoods.
                  </Text>

                  <Text style={styles.modalPointTitle}>🎯 SDG 12: Responsible Consumption & Production</Text>
                  <Text style={styles.modalPointText}>
                    Builds circular loops where post-consumer polymers are re-fed into local manufacturing.
                  </Text>

                  <Text style={styles.modalPointTitle}>🎯 SDG 13: Climate Action</Text>
                  <Text style={styles.modalPointText}>
                    Saves ~1.5kg CO₂ for every 1kg of plastic diverted from landfill and open burning.
                  </Text>

                  <Text style={styles.modalPointTitle}>🎯 SDG 8: Decent Work & Economic Growth</Text>
                  <Text style={styles.modalPointText}>
                    Transforms informal, hazardous scavenging into digitized, dignified, and bankable green employment.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalGotItBtn} onPress={() => setPitchTopic(null)}>
              <Text style={styles.modalGotItText}>Close Pitch Guide</Text>
            </TouchableOpacity>
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
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGov: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeGovText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  titleRow: {
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Cross-Functional KPI Banner
  kpiBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kpiLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  kpiSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  kpiSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Navigation Persona Tabs
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  activeTabItem: {
    backgroundColor: COLORS.primaryLight,
  },
  tabItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabItemText: {
    color: COLORS.primary,
  },

  // Pitch Tip Box
  pitchTipCard: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  pitchTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pitchTipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
    textTransform: 'uppercase',
  },
  pitchTipText: {
    fontSize: 12,
    color: '#4c1d95',
    lineHeight: 16,
  },

  // Action Grid
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionGridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionGridBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },

  // Impact Grid
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  impactBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  impactIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  impactEmoji: {
    fontSize: 15,
  },
  impactNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  impactUnitSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  impactTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  impactDetail: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Standard Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardHeaderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stackedBarContainer: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  stackedBarSegment: {
    height: '100%',
  },
  legendRow: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendMain: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  legendSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  // Banner Info Box
  bannerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  bannerInfoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bannerInfoSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Filter Chips
  filterChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterChipText: {
    color: '#ffffff',
  },

  // Operations Card
  operationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  opCode: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  opCitizen: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillDone: {
    backgroundColor: '#dcfce7',
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
  },
  statusPillTransit: {
    backgroundColor: '#dbeafe',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextDone: {
    color: '#15803d',
  },
  statusTextPending: {
    color: '#b45309',
  },
  statusTextTransit: {
    color: '#1d4ed8',
  },
  opDetails: {
    gap: 3,
    marginBottom: 10,
  },
  opDetailText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  opActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  opBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    borderRadius: 8,
  },
  opBtnPrimaryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  opBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 2,
  },
  opBtnDangerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },

  // Stakeholder Item
  stakeholderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stakeholderName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stakeholderSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  bonusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bonusBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Fleet Summary
  fleetSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fleetSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  fleetSummaryVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  fleetSummaryLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fleetSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },

  // Routes
  routeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  routeId: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  routeCollector: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  routeStatusBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  routeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  routeLocationText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  routeActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  forcePickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
  },
  forcePickupBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Factory Hub
  factoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  factoryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factoryBatchId: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  factoryType: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '700',
  },
  factoryEstWeight: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  factoryMeta: {
    gap: 2,
    marginBottom: 10,
  },
  factoryMetaText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  factoryWeighBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    borderRadius: 8,
  },
  factoryWeighBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  certifiedLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  certifiedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  certifiedId: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  certifiedWeight: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  certifiedDetail: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  // Pitch Deck
  pitchHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pitchHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  pitchHeroSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  pitchTopicCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 10,
  },
  topicIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIcon: {
    fontSize: 18,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  topicSnippet: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer Actions
  footerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  modalBody: {
    marginVertical: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  wasteTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  wasteTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  activeWasteTypeChip: {
    backgroundColor: COLORS.primary,
  },
  wasteTypeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeWasteTypeChipText: {
    color: '#ffffff',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  selectedBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  driverSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
    gap: 8,
  },
  activeDriverSelectBox: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  driverSelectText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  activeDriverSelectText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  weighControlWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weighAdjustBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weighInputLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  weighInputUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rewardPreviewBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 6,
  },
  rewardPreviewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 4,
  },
  rewardPreviewDetail: {
    fontSize: 10,
    color: '#047857',
  },
  modalContent: {
    gap: 12,
  },
  modalPointTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalPointText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  modalGotItBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalGotItText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  closeBtn: {
    padding: 4,
  },
});
