import { useContext, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ChevronRight,
  DollarSign, List,
  MapPin, Navigation,
  QrCode,
  Sparkles, X
} from '../components/Icons';
import { AppContext } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme';
import LiveQRScannerModal from '../components/LiveQRScannerModal';

// Attempt to load react-native-maps if supported on current platform
let MapView, Marker, Polyline, Callout;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  Callout = Maps.Callout;
} catch (e) {
  // MapView fallback if not available on current bundle target
  MapView = null;
}

const { width, height } = Dimensions.get('window');

// Collector live position (Kumasi KNUST central hub area)
const COLLECTOR_LOCATION = {
  latitude: 6.6710,
  longitude: -1.5670,
  title: 'Your Vehicle',
  description: 'Collector Unit #001',
};

export default function CollectorScreen() {
  const {
    pickups, collectorEarnings, acceptPickup,
    markArrived, verifyQRAndCollect
  } = useContext(AppContext);

  // States
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [mapFilter, setMapFilter] = useState('all'); // 'all' | 'available' | 'active'
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [selectedTaskForQR, setSelectedTaskForQR] = useState(null);
  const mapRef = useRef(null);

  // Filter pickups to live registered requests for this active session
  const liveSessionPickups = pickups.filter(p => p.isRegisteredSession);
  const availablePickups = liveSessionPickups.filter(p => p.status === 'pending');
  const activeTasks = liveSessionPickups.filter(
    p => ['accepted', 'arrived', 'picked_up'].includes(p.status)
  );

  // Pickups for Map view (starts clean, only shows active live requests)
  const mapPickups = liveSessionPickups.filter(p => {
    if (mapFilter === 'available') return p.status === 'pending';
    if (mapFilter === 'active') return ['accepted', 'arrived', 'picked_up'].includes(p.status);
    return ['pending', 'accepted', 'arrived', 'picked_up'].includes(p.status);
  });

  // Calculate polyline coordinates for selected or active task
  const activeTargetPickup = selectedPickup || activeTasks[0] || availablePickups[0];
  const routeCoordinates = activeTargetPickup && activeTargetPickup.latitude && activeTargetPickup.longitude
    ? [
      { latitude: COLLECTOR_LOCATION.latitude, longitude: COLLECTOR_LOCATION.longitude },
      {
        latitude: (COLLECTOR_LOCATION.latitude + activeTargetPickup.latitude) / 2 + 0.001,
        longitude: (COLLECTOR_LOCATION.longitude + activeTargetPickup.longitude) / 2 - 0.001
      },
      { latitude: activeTargetPickup.latitude, longitude: activeTargetPickup.longitude }
    ]
    : [];

  const handleClaim = (id) => {
    acceptPickup(id);
    Alert.alert("Request Claimed", `You have claimed pickup ${id}. Route navigation started.`);
  };

  const handleArrived = (id) => {
    markArrived(id);
  };

  const handleScanSimulation = (task) => {
    setSelectedTaskForQR(task);
    setQrScannerVisible(true);
  };

  const confirmQRScan = () => {
    if (selectedTaskForQR) {
      verifyQRAndCollect(selectedTaskForQR.id);
      setQrScannerVisible(false);
      Alert.alert(
        "Verification Successful",
        "QR Code verified! Recyclables loaded in vehicle. Head to the nearest Recycling Center to weigh and drop off."
      );
      setSelectedTaskForQR(null);
    }
  };

  const getMarkerColor = (status) => {
    switch (status) {
      case 'pending': return '#EAB308'; // Warning Yellow
      case 'accepted': return COLORS.secondary; // Cyan
      case 'arrived': return COLORS.primary; // Green
      case 'picked_up': return COLORS.accent; // Purple
      default: return COLORS.textSecondary;
    }
  };

  const renderMapView = () => {
    const defaultRegion = {
      latitude: 6.6731,
      longitude: -1.5654,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };

    // If react-native-maps MapView is available
    if (MapView) {
      return (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={defaultRegion}
            showsUserLocation={false}
            showsCompass={true}
          >
            {/* Live Collector Marker */}
            {Marker && (
              <Marker
                coordinate={{ latitude: COLLECTOR_LOCATION.latitude, longitude: COLLECTOR_LOCATION.longitude }}
                title="Your Location"
                description="Collector Vehicle #COL-001"
              >
                <View style={styles.collectorMarkerPin}>
                  <Text style={{ fontSize: 16 }}>🛞</Text>
                </View>
              </Marker>
            )}

            {/* Pickup Point Markers */}
            {Marker && mapPickups.map((item) => {
              const lat = item.latitude || (6.6731 + Math.random() * 0.01);
              const lng = item.longitude || (-1.5654 + Math.random() * 0.01);
              const isSelected = selectedPickup?.id === item.id;
              const markerColor = getMarkerColor(item.status);

              return (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={`${item.wasteType} (${item.estimatedWeight}kg)`}
                  description={item.address}
                  onPress={() => setSelectedPickup(item)}
                >
                  <View style={[
                    styles.customMarker,
                    { backgroundColor: markerColor },
                    isSelected && styles.selectedMarker
                  ]}>
                    <Text style={styles.markerEmoji}>
                      {item.status === 'pending' ? '📦' : item.status === 'picked_up' ? '🚚' : '📍'}
                    </Text>
                  </View>
                </Marker>
              );
            })}

            {/* Route Polyline */}
            {Polyline && routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={COLORS.secondary}
                strokeWidth={4}
                lineDashPattern={[2, 2]}
              />
            )}
          </MapView>
        </View>
      );
    }

    // Web & Fallback Interactive Stylized Map View
    return (
      <View style={styles.webMapContainer}>
        {/* Map Header Overlay Grid */}
        <View style={styles.mapGridLines} />

        {/* Collector Vehicle Node */}
        <View style={[styles.webMapNode, { top: '48%', left: '42%', zIndex: 10 }]}>
          <View style={styles.collectorMarkerPin}>
            <Text style={{ fontSize: 14 }}>🛞</Text>
          </View>
          <Text style={styles.nodeLabel}>You (COL-001)</Text>
        </View>

        {/* Pickup Location Nodes */}
        {mapPickups.map((item, index) => {
          // Normalize coordinate positions for web map view canvas
          const topPercent = 25 + ((item.latitude ? (item.latitude - 6.6600) * 2000 : (index * 20)) % 55);
          const leftPercent = 20 + ((item.longitude ? (item.longitude + 1.5800) * 2000 : (index * 25)) % 60);
          const isSelected = selectedPickup?.id === item.id;
          const color = getMarkerColor(item.status);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.webMapNode,
                { top: `${topPercent}%`, left: `${leftPercent}%` }
              ]}
              onPress={() => setSelectedPickup(item)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.customMarker,
                { backgroundColor: color },
                isSelected && styles.selectedMarker
              ]}>
                <Text style={styles.markerEmoji}>
                  {item.status === 'pending' ? '📦' : item.status === 'picked_up' ? '🚚' : '📍'}
                </Text>
              </View>
              <Text style={styles.nodeLabel}>{item.id} • {item.estimatedWeight}kg</Text>
            </TouchableOpacity>
          );
        })}

        {/* Simulated Connecting Route Line */}
        <View style={styles.webRouteLine} />

        <View style={styles.mapFooterBanner}>
          <Text style={styles.bannerText}>🗺️ Interactive Pickup Map • Tap pins to view details & claim</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar / View Switcher */}
      <View style={styles.topBar}>
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.activeToggleBtn]}
            onPress={() => setViewMode('map')}
          >
            <MapPin size={15} color={viewMode === 'map' ? COLORS.textDark : COLORS.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'map' && styles.activeToggleText]}>Map View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.activeToggleBtn]}
            onPress={() => setViewMode('list')}
          >
            <List size={15} color={viewMode === 'list' ? COLORS.textDark : COLORS.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.activeToggleText]}>List View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Filter Pills for Map */}
          <View style={styles.filterPillContainer}>
            <TouchableOpacity
              style={[styles.filterPill, mapFilter === 'all' && styles.activeFilterPill]}
              onPress={() => setMapFilter('all')}
            >
              <Text style={[styles.filterPillText, mapFilter === 'all' && styles.activeFilterText]}>
                All ({mapPickups.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, mapFilter === 'available' && styles.activeFilterPill]}
              onPress={() => setMapFilter('available')}
            >
              <Text style={[styles.filterPillText, mapFilter === 'available' && styles.activeFilterText]}>
                Available ({availablePickups.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, mapFilter === 'active' && styles.activeFilterPill]}
              onPress={() => setMapFilter('active')}
            >
              <Text style={[styles.filterPillText, mapFilter === 'active' && styles.activeFilterText]}>
                My Tasks ({activeTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Map Component */}
          {renderMapView()}

          {/* Selected Pickup Marker Details Card Overlay */}
          {selectedPickup ? (
            <View style={styles.selectedPickupCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cardTitle}>{selectedPickup.wasteType}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getMarkerColor(selectedPickup.status) + '22' }
                    ]}>
                      <Text style={[styles.statusText, { color: getMarkerColor(selectedPickup.status) }]}>
                        {selectedPickup.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>ID: {selectedPickup.id} • {selectedPickup.estimatedWeight} kg</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPickup(null)} style={styles.closeBtn}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardDetail}>👤 <Text style={{ fontWeight: 'bold' }}>Citizen:</Text> {selectedPickup.citizenName}</Text>
                <Text style={styles.cardDetail}>📍 <Text style={{ fontWeight: 'bold' }}>Address:</Text> {selectedPickup.address}</Text>
                <Text style={styles.cardDetail}>📞 <Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedPickup.citizenPhone}</Text>
              </View>

              <View style={styles.cardActionRow}>
                {selectedPickup.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.mapActionBtn, { backgroundColor: COLORS.secondary }]}
                    onPress={() => {
                      handleClaim(selectedPickup.id);
                      setSelectedPickup({ ...selectedPickup, status: 'accepted' });
                    }}
                  >
                    <Navigation size={16} color={COLORS.textDark} />
                    <Text style={styles.mapActionBtnText}>Claim Pickup & Navigate</Text>
                  </TouchableOpacity>
                )}

                {selectedPickup.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.mapActionBtn, { backgroundColor: COLORS.secondary }]}
                    onPress={() => {
                      handleArrived(selectedPickup.id);
                      setSelectedPickup({ ...selectedPickup, status: 'arrived' });
                    }}
                  >
                    <MapPin size={16} color={COLORS.textDark} />
                    <Text style={styles.mapActionBtnText}>Mark as Arrived</Text>
                  </TouchableOpacity>
                )}

                {selectedPickup.status === 'arrived' && (
                  <TouchableOpacity
                    style={[styles.mapActionBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleScanSimulation(selectedPickup)}
                  >
                    <QrCode size={16} color={COLORS.textDark} />
                    <Text style={styles.mapActionBtnText}>Verify (Scan QR Code)</Text>
                  </TouchableOpacity>
                )}

                {selectedPickup.status === 'picked_up' && (
                  <View style={styles.pickupGuidance}>
                    <Text style={styles.guidanceText}>🚚 Recyclables Loaded. Head to Recycling Center.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.mapPromptHint}>
              <Text style={styles.promptHintText}>💡 Tap any pin marker on the map to inspect pickup details & start navigation.</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Earnings Dashboard Card */}
          <View style={styles.earningsCard}>
            <View>
              <Text style={styles.earningsLabel}>Earnings Dashboard</Text>
              <Text style={styles.earningsValue}>₵ {collectorEarnings.balance.toFixed(2)}</Text>
              <Text style={styles.earningsTrips}>{collectorEarnings.trips} completed pickups</Text>
            </View>
          </View>

          {/* Pickups & Operations Section */}
          <Text style={styles.sectionHeader}>
            Pickup Requests ({liveSessionPickups.filter(p => ['pending', 'accepted', 'arrived', 'picked_up'].includes(p.status)).length})
          </Text>

          {liveSessionPickups.filter(p => ['pending', 'accepted', 'arrived', 'picked_up'].includes(p.status)).length === 0 ? (
            <Text style={styles.subtext}>No pending pickups currently available nearby.</Text>
          ) : (
            liveSessionPickups
              .filter(p => ['pending', 'accepted', 'arrived', 'picked_up'].includes(p.status))
              .map(item => (
                <View key={item.id} style={styles.availableCard}>
                  <View style={styles.availHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.availTitle}>{item.wasteType}</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getMarkerColor(item.status) + '22' }
                        ]}>
                          <Text style={[styles.statusText, { color: getMarkerColor(item.status) }]}>
                            {item.status === 'pending' ? 'PENDING' : item.status === 'accepted' ? 'CLAIMED' : item.status === 'arrived' ? 'ARRIVED' : 'IN TRUCK'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.availAddress}>📍 {item.address}</Text>
                      <Text style={[styles.availAddress, { marginTop: 2, color: COLORS.textSecondary }]}>
                        👤 {item.citizenName} • 📞 {item.citizenPhone}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.availWeight}>{item.estimatedWeight} kg</Text>
                      <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 2 }}>
                        Payout: GH₵ 10.00
                      </Text>
                    </View>
                  </View>

                  {/* Actions according to step status */}
                  <View style={[styles.availFooter, { marginTop: 12 }]}>
                    {item.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                        <TouchableOpacity
                          style={[styles.claimBtn, { flex: 1 }]}
                          onPress={() => handleClaim(item.id)}
                        >
                          <Text style={styles.claimBtnText}>Claim Route</Text>
                          <ChevronRight size={14} color={COLORS.textDark} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.claimBtn, { flex: 1, backgroundColor: COLORS.primary }]}
                          onPress={() => {
                            handleClaim(item.id);
                            handleScanSimulation({ ...item, status: 'arrived' });
                          }}
                        >
                          <QrCode size={14} color="#ffffff" />
                          <Text style={[styles.claimBtnText, { color: '#ffffff' }]}>📷 Scan QR</Text>
                        </TouchableOpacity>
                      </View>
                    ) : item.status === 'accepted' ? (
                      <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                        <TouchableOpacity
                          style={[styles.claimBtn, { flex: 1, backgroundColor: COLORS.secondary }]}
                          onPress={() => handleArrived(item.id)}
                        >
                          <MapPin size={14} color={COLORS.textDark} />
                          <Text style={styles.claimBtnText}>Mark Arrived</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.claimBtn, { flex: 1.2, backgroundColor: COLORS.primary }]}
                          onPress={() => handleScanSimulation(item)}
                        >
                          <QrCode size={14} color="#ffffff" />
                          <Text style={[styles.claimBtnText, { color: '#ffffff' }]}>📷 Scan Citizen QR</Text>
                        </TouchableOpacity>
                      </View>
                    ) : item.status === 'arrived' ? (
                      <TouchableOpacity
                        style={[styles.claimBtn, { width: '100%', backgroundColor: COLORS.primary, paddingVertical: 10 }]}
                        onPress={() => handleScanSimulation(item)}
                      >
                        <QrCode size={16} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={[styles.claimBtnText, { color: '#ffffff', fontSize: 13 }]}>
                          📷 Scan Citizen QR (Claim GH₵ 10.00)
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: COLORS.accent, fontWeight: '700' }}>
                          🚚 Loaded in Truck • Head to Recycler Depot
                        </Text>
                        <TouchableOpacity
                          style={[styles.claimBtn, { paddingHorizontal: 8, paddingVertical: 4 }]}
                          onPress={() => handleScanSimulation(item)}
                        >
                          <Text style={{ fontSize: 10, color: COLORS.textDark }}>Re-Scan</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
          )}
        </ScrollView>
      )}

      {/* LIVE CAMERA QR SCANNER MODAL */}
      <LiveQRScannerModal
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        selectedTask={selectedTaskForQR}
        onScanned={(task) => {
          verifyQRAndCollect(task.id);
          Alert.alert(
            "✓ Verification Successful",
            `QR Code for ${task.id} verified with camera! Recyclables loaded into truck.\n\n• Driver Payout: +GH₵ 10.00 credited.\n• Head to Recycling Depot to drop off.`
          );
          setSelectedTaskForQR(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeToggleBtn: {
    backgroundColor: COLORS.secondary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeToggleText: {
    color: COLORS.textDark,
    fontWeight: '850',
  },
  scrollContainer: {
    padding: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  filterPillContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  activeFilterText: {
    color: COLORS.textDark,
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapContainer: {
    flex: 1,
    backgroundColor: '#090e17',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  collectorMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOWS.glowing,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...SHADOWS.light,
  },
  selectedMarker: {
    transform: [{ scale: 1.25 }],
    borderColor: COLORS.secondary,
    borderWidth: 3,
  },
  markerEmoji: {
    fontSize: 13,
  },
  webMapNode: {
    position: 'absolute',
    alignItems: 'center',
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  webRouteLine: {
    position: 'absolute',
    top: '42%',
    left: '30%',
    width: '35%',
    height: 3,
    backgroundColor: COLORS.secondary,
    transform: [{ rotate: '-15deg' }],
    opacity: 0.7,
    borderRadius: 2,
  },
  mapFooterBanner: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  bannerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedPickupCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    zIndex: 30,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  cardBody: {
    gap: 4,
    marginBottom: 12,
  },
  cardDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardActionRow: {
    flexDirection: 'row',
  },
  mapActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  mapActionBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '850',
  },
  mapPromptHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 20,
  },
  promptHintText: {
    fontSize: 11,
    color: 'white',
    textAlign: 'center',
  },
  earningsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    ...SHADOWS.light,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: 4,
  },
  earningsTrips: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  earningsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  activeTaskCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    marginBottom: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  taskId: {
    fontSize: 14,
    fontWeight: '850',
    color: COLORS.textPrimary,
  },
  taskType: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  taskDetails: {
    marginBottom: 14,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  miniMap: {
    height: 100,
    backgroundColor: '#0c121a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    position: 'relative',
    justifyContent: 'center',
    padding: 12,
  },
  mockRouteLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.secondary,
    left: '20%',
    right: '25%',
    top: '50%',
    borderRadius: 2,
    opacity: 0.6,
  },
  mapPinCollector: {
    position: 'absolute',
    left: '15%',
    top: '38%',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 11,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mapPinCitizen: {
    position: 'absolute',
    right: '15%',
    top: '38%',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 11,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etaText: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    ...SHADOWS.light,
  },
  actionBtnText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '850',
  },
  pickupGuidance: {
    flex: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  guidanceText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 14,
  },
  availableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  availHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  availTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  availAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  availWeight: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  availDist: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  claimBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  claimBtnText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    width: width - 32,
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  scannerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  scannerMain: {
    padding: 20,
    alignItems: 'center',
  },
  scannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 20,
  },
  viewfinder: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  viewfinderCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
  },
  viewfinderCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
  },
  viewfinderCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
  },
  viewfinderCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
  },
  scanLaser: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  detectedText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 130,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simulateScanBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...SHADOWS.glowing,
  },
  simulateScanBtnText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
