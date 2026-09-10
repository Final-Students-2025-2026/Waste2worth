import { useContext, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, Minus, Plus, Scale, ShieldCheck } from '../components/Icons';
import { AppContext } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme';

export default function RecyclerScreen() {
  const { pickups, processDelivery } = useContext(AppContext);

  // States
  const [weighModalVisible, setWeighModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [actualWeight, setActualWeight] = useState('10.0');

  // Filter deliveries for active session
  const liveSessionPickups = pickups.filter(p => p.isRegisteredSession);
  const incomingDeliveries = liveSessionPickups.filter(p => p.status === 'picked_up');
  const processedShipments = liveSessionPickups.filter(p => p.status === 'completed');

  const openWeighScale = (task) => {
    setActiveTask(task);
    setActualWeight(task.estimatedWeight.toString());
    setWeighModalVisible(true);
  };

  const adjustWeight = (amount) => {
    const val = parseFloat(actualWeight) || 0;
    const nextVal = Math.max(0.1, val + amount);
    setActualWeight(nextVal.toFixed(1));
  };

  const handleCompleteDelivery = () => {
    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      alert("Please input a valid weight.");
      return;
    }

    processDelivery(activeTask.id, parseFloat(actualWeight));
    setWeighModalVisible(false);
    Alert.alert(
      "Shipment Processed",
      `Delivery ${activeTask.id} completed. Weight of ${actualWeight}kg recorded. Reward points allocated to Citizen and cash to Collector.`
    );
    setActiveTask(null);
  };

  // Aggregated totals
  const totalProcessed = processedShipments.reduce((acc, curr) => acc + (curr.actualWeight || 0), 0);
  const totalPointsDisbursed = processedShipments.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Recycler Header Info */}
        <View style={styles.recyclerHeader}>
          <Text style={styles.headerTitle}>Recycling Company Terminal</Text>
          <Text style={styles.headerSub}>KNUST Eco-Depot #1 • Active</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Scale size={20} color={COLORS.accent} style={{ marginBottom: 6 }} />
            <Text style={styles.statVal}>{totalProcessed.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>Total Materials Processed</Text>
          </View>
          <View style={styles.statCard}>
            <ShieldCheck size={20} color={COLORS.accent} style={{ marginBottom: 6 }} />
            <Text style={styles.statVal}>{totalPointsDisbursed}</Text>
            <Text style={styles.statLabel}>Reward Points Approved</Text>
          </View>
        </View>

        {/* Incoming Shipments */}
        <Text style={styles.sectionHeader}>Incoming Shipments (From Collectors)</Text>
        {incomingDeliveries.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No incoming shipments ready for weighing.</Text>
            <Text style={styles.infoSubtext}>Collectors must pick up and load waste first.</Text>
          </View>
        ) : (
          incomingDeliveries.map(item => (
            <View key={item.id} style={styles.incomingCard}>
              <View style={styles.incomingInfo}>
                <View>
                  <Text style={styles.incomingId}>{item.id}</Text>
                  <Text style={styles.incomingType}>{item.wasteType}</Text>
                </View>
                <Text style={styles.estWeightText}>Est: {item.estimatedWeight} kg</Text>
              </View>

              <View style={styles.incomingMeta}>
                <Text style={styles.metaLabel}>Collector: COL-001 (Kofi)</Text>
                <Text style={styles.metaLabel}>Source: {item.citizenName}</Text>
              </View>

              <TouchableOpacity
                style={styles.weighBtn}
                onPress={() => openWeighScale(item)}
              >
                <Scale size={14} color={COLORS.textDark} style={{ marginRight: 4 }} />
                <Text style={styles.weighBtnText}>Receive & Weigh</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Processed Logs */}
        <Text style={styles.sectionHeader}>Processed Deliveries Log</Text>
        {processedShipments.length === 0 ? (
          <Text style={styles.subtext}>No completed records in this session.</Text>
        ) : (
          processedShipments.map(item => (
            <View key={item.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{item.id} • {item.wasteType}</Text>
                <Text style={styles.logSub}>{`Recorded weight: ${item.actualWeight ? `${item.actualWeight}kg` : ''} (Est: ${item.estimatedWeight}kg)`}</Text>
                <Text style={styles.logMeta}>{`Citizen: ${item.citizenName}${item.pointsAwarded ? ` • +${item.pointsAwarded} pts` : ''}`}</Text>
              </View>
              <View style={styles.checkBadge}>
                <Check size={14} color={COLORS.primary} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* WEIGH SCALE DIGITAL MOCK */}
      <Modal visible={weighModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Industrial Weight Scale</Text>
              <TouchableOpacity onPress={() => setWeighModalVisible(false)}>
                <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {activeTask && (
              <View style={styles.scaleContainer}>
                <Text style={styles.scaleLabel}>Verifying shipment {activeTask.id}</Text>
                <Text style={styles.scaleSub}>{activeTask.wasteType} • Est: {activeTask.estimatedWeight} kg</Text>

                {/* Simulated Digital Weight readout display */}
                <View style={styles.scaleReadout}>
                  <Text style={styles.readoutText}>{actualWeight}</Text>
                  <Text style={styles.readoutUnit}>KG</Text>
                </View>

                {/* Adjustments buttons */}
                <View style={styles.adjustmentRow}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustWeight(-1.0)}>
                    <Minus size={18} color="#fff" />
                    <Text style={styles.adjustBtnLabel}>-1.0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustWeight(-0.1)}>
                    <Minus size={18} color="#fff" />
                    <Text style={styles.adjustBtnLabel}>-0.1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustWeight(0.1)}>
                    <Plus size={18} color="#fff" />
                    <Text style={styles.adjustBtnLabel}>+0.1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustWeight(1.0)}>
                    <Plus size={18} color="#fff" />
                    <Text style={styles.adjustBtnLabel}>+1.0</Text>
                  </TouchableOpacity>
                </View>

                {/* Manual input */}
                <Text style={styles.manualLabel}>Or input weight manually:</Text>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="decimal-pad"
                  value={actualWeight}
                  onChangeText={setActualWeight}
                />

                <TouchableOpacity style={styles.approveBtn} onPress={handleCompleteDelivery}>
                  <Check size={18} color={COLORS.textDark} style={{ marginRight: 6 }} />
                  <Text style={styles.approveBtnText}>Confirm Weight & Disburse Points</Text>
                </TouchableOpacity>
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
  recyclerHeader: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '850',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  infoText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoSubtext: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  incomingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  incomingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 10,
  },
  incomingId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  incomingType: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  estWeightText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  incomingMeta: {
    marginBottom: 14,
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  weighBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    ...SHADOWS.light,
  },
  weighBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logMeta: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Scale Modal
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
  scaleContainer: {
    alignItems: 'center',
  },
  scaleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scaleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  scaleReadout: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 20,
    width: 200,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  readoutText: {
    color: COLORS.accent,
    fontSize: 40,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  readoutUnit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    marginTop: 14,
  },
  adjustmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  adjustBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  adjustBtnLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  manualLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  weightInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...SHADOWS.glowing,
  },
  approveBtnText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '850',
  },
});
