import { useContext, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Award,
  Bell,
  Coins, Leaf,
  LogOut,
  Mail, Phone,
  ShieldCheck
} from '../components/Icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const {
    user, profile, currentRole, accountRole, switchRole, logout,
    walletBalance, collectorEarnings, environmentalImpact, resetDemo, isSupabaseActive
  } = useContext(AppContext);

  // Settings Toggles State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Dynamic user fields
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Kwaku Mensah';
  const displayEmail = user?.email || 'kwaku.mensah@waste2worth.gh';
  const displayPhone = profile?.phone || '+233 24 123 4567';

  // Primary Checked Account Role
  const assignedRole = profile?.role || user?.user_metadata?.role || accountRole || currentRole || 'citizen';

  const formatRoleTitle = (rKey) => {
    switch (rKey?.toLowerCase()) {
      case 'citizen': return 'Eco Citizen';
      case 'collector': return 'Waste Collector';
      case 'recycler': return 'Recycling Hub';
      case 'admin': return 'Administrator';
      default: return 'Eco Citizen';
    }
  };

  const assignedRoleTitle = formatRoleTitle(assignedRole);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of Waste2Worth?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout }
      ]
    );
  };

  const handleResetDemo = () => {
    Alert.alert(
      "Reset Demo Data",
      "This will reset all pickups, points, and local demo state to default.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            resetDemo();
            Alert.alert("Demo Reset", "Local state has been reset to defaults.");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Profile Banner Header */}
        <View style={styles.profileBanner}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>

          {/* Stated Verified Role */}
          <View style={styles.roleTagContainer}>
            <ShieldCheck size={14} color={COLORS.primary} />
            <Text style={styles.userRoleTag}>Verified Role: <Text style={{ color: COLORS.primary, fontWeight: '850' }}>{assignedRoleTitle}</Text></Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Mail size={12} color={COLORS.textSecondary} />
              <Text style={styles.infoBadgeText}>{displayEmail}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Phone size={12} color={COLORS.textSecondary} />
              <Text style={styles.infoBadgeText}>{displayPhone}</Text>
            </View>
          </View>
        </View>

        {/* Checked Account Identity Card */}
        <Text style={styles.sectionHeader}>Account Role & Credentials</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountCardRow}>
            <Text style={styles.accountCardLabel}>Full Name</Text>
            <Text style={styles.accountCardValue}>{displayName}</Text>
          </View>

          <View style={styles.accountCardRow}>
            <Text style={styles.accountCardLabel}>Primary Account Role</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillIcon}>✓</Text>
              <Text style={styles.rolePillText}>{assignedRoleTitle}</Text>
            </View>
          </View>

          <View style={styles.accountCardRow}>
            <Text style={styles.accountCardLabel}>Registered Email</Text>
            <Text style={styles.accountCardValue}>{displayEmail}</Text>
          </View>

          <View style={styles.accountCardRow}>
            <Text style={styles.accountCardLabel}>Phone Contact</Text>
            <Text style={styles.accountCardValue}>{displayPhone}</Text>
          </View>
        </View>

        {/* Eco Stats & Account Impact Overview */}
        <Text style={styles.sectionHeader}>Eco Impact & Rewards</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Coins size={20} color={COLORS.secondary} />
            <Text style={styles.statValue}>{walletBalance}</Text>
            <Text style={styles.statLabel}>Reward Points</Text>
          </View>

          <View style={styles.statCard}>
            <Leaf size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{environmentalImpact.co2} kg</Text>
            <Text style={styles.statLabel}>CO₂ Prevented</Text>
          </View>

          <View style={styles.statCard}>
            <Award size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{environmentalImpact.total} kg</Text>
            <Text style={styles.statLabel}>Total Recyclables</Text>
          </View>
        </View>

        {/* App Settings List */}
        <Text style={styles.sectionHeader}>App Settings & Preferences</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Bell size={18} color={COLORS.secondary} />
              <View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSub}>Alerts when collector claims pickup</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#334155', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Mail size={18} color={COLORS.secondary} />
              <View>
                <Text style={styles.settingTitle}>SMS Pick-up Reminders</Text>
                <Text style={styles.settingSub}>Receive arrival SMS updates</Text>
              </View>
            </View>
            <Switch
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              trackColor={{ false: '#334155', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <ShieldCheck size={18} color={COLORS.primary} />
              <View>
                <Text style={styles.settingTitle}>Account Verification</Text>
                <Text style={styles.settingSub}>Role verified: {assignedRoleTitle}</Text>
              </View>
            </View>
            <Text style={styles.verifiedBadge}>Verified</Text>
          </View>
        </View>

        {/* Actions & Sign Out */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Waste2Worth v1.2.0</Text>
      </ScrollView>
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
    paddingBottom: 32,
  },
  profileBanner: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  userRoleTag: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  infoBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 6,
  },
  accountCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  accountCardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rolePillIcon: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  rolePillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  portalHeaderBlock: {
    marginBottom: 4,
  },
  portalSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  portalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  portalOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  activePortalOption: {
    backgroundColor: '#0f172a',
  },
  assignedPortalOption: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  portalTextContainer: {
    alignItems: 'center',
  },
  portalText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activePortalText: {
    color: '#ffffff',
    fontWeight: '850',
  },
  assignedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  assignedBadgeActive: {
    color: '#ffffff',
  },
  settingsGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionSection: {
    gap: 10,
    marginBottom: 20,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  resetBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '850',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
