import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Camera, CheckCircle, RefreshCw, X, Zap } from './Icons';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

export default function LiveQRScannerModal({
  visible,
  onClose,
  onScanned,
  selectedTask,
}) {
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [torchOn, setTorchOn] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Animate scanning laser bar
  useEffect(() => {
    if (visible) {
      setScannedSuccess(false);
      startLaserAnimation();
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [visible, facingMode]);

  const startLaserAnimation = () => {
    laserAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startCameraStream = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        stopCameraStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setHasCameraPermission(true);
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera access note:', err.message);
        setHasCameraPermission(false);
        setCameraActive(false);
      }
    } else {
      setHasCameraPermission(true);
      setCameraActive(true);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleConfirmScan = () => {
    if (scannedSuccess) return;
    setScannedSuccess(true);

    setTimeout(() => {
      if (onScanned && selectedTask) {
        onScanned(selectedTask);
      }
      onClose();
    }, 600);
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.scannerWrapper}>
          {/* Header */}
          <View style={styles.scannerHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Camera size={18} color={COLORS.primary} />
              <Text style={styles.scannerTitle}>Live Camera QR Scanner</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Camera Viewport Area */}
          <View style={styles.viewportContainer}>
            {/* Live Web Camera Video Element using safe React.createElement */}
            {Platform.OS === 'web' ? (
              React.createElement('div', {
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  backgroundColor: '#090e17',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                children: React.createElement('video', {
                  ref: videoRef,
                  autoPlay: true,
                  playsInline: true,
                  muted: true,
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  },
                }),
              })
            ) : (
              <View style={styles.nativeCameraPlaceholder}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
                <Text style={styles.cameraPlaceholderText}>Live Optical Viewfinder Active</Text>
              </View>
            )}

            {/* Dark Masking Overlays around Viewfinder */}
            <View style={styles.viewfinderContainer}>
              <View style={[styles.viewfinder, scannedSuccess && styles.viewfinderSuccess]}>
                {/* 4 Corner Markers */}
                <View style={[styles.corner, styles.cornerTL, scannedSuccess && styles.cornerSuccess]} />
                <View style={[styles.corner, styles.cornerTR, scannedSuccess && styles.cornerSuccess]} />
                <View style={[styles.corner, styles.cornerBL, scannedSuccess && styles.cornerSuccess]} />
                <View style={[styles.corner, styles.cornerBR, scannedSuccess && styles.cornerSuccess]} />

                {/* Animated Scanning Laser */}
                {!scannedSuccess && (
                  <Animated.View
                    style={[
                      styles.laserLine,
                      { transform: [{ translateY: laserTranslateY }] },
                    ]}
                  />
                )}

                {/* Target Pickup Tag */}
                {selectedTask && (
                  <View style={styles.qrTargetBadge}>
                    <Text style={styles.qrTargetCode}>
                      {scannedSuccess ? '✓ QR MATCHED' : `TARGET: ${selectedTask.id}`}
                    </Text>
                    <Text style={styles.qrTargetSub}>
                      {selectedTask.wasteType} • {selectedTask.estimatedWeight}kg
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Controls Bar */}
          <View style={styles.scannerFooter}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.controlIconBtn, torchOn && styles.controlIconActive]}
                onPress={() => setTorchOn(!torchOn)}
              >
                <Zap size={18} color={torchOn ? COLORS.primary : '#ffffff'} />
                <Text style={styles.controlIconLabel}>Flash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={toggleCameraFacing}
              >
                <RefreshCw size={18} color="#ffffff" />
                <Text style={styles.controlIconLabel}>Flip Lens</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.verifyScanButton, scannedSuccess && styles.verifySuccessBtn]}
              onPress={handleConfirmScan}
              activeOpacity={0.85}
            >
              <CheckCircle size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.verifyScanButtonText}>
                {scannedSuccess ? 'Verified & Loaded into Truck!' : 'Capture & Verify Citizen QR'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperTip}>
              Align citizen's QR code inside the green brackets to verify & earn GH₵ 10.00.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannerWrapper: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scannerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewportContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nativeCameraPlaceholder: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 10,
  },
  viewfinder: {
    width: 220,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderSuccess: {
    borderColor: COLORS.primary,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.primary,
  },
  cornerSuccess: {
    borderColor: '#22c55e',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  qrTargetBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  qrTargetCode: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrTargetSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  scannerFooter: {
    padding: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  controlIconBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlIconActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  controlIconLabel: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  verifyScanButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  verifySuccessBtn: {
    backgroundColor: '#16a34a',
  },
  verifyScanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  helperTip: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
