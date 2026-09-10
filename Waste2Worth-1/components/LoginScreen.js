import { Award, Recycle, Settings, Truck, User } from 'lucide-react-native';
import { useContext, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../theme';

export default function LoginScreen() {
  const { login, switchRole, supabaseSignIn, supabaseSignUp, isSupabaseActive } = useContext(AppContext);

  const [mode, setMode] = useState('signIn'); // 'signIn' | 'signUp'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen'); // 'citizen' | 'collector' | 'recycler' | 'admin'
  const [accessType, setAccessType] = useState('ccr'); // for demo mode
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    if (mode === 'signUp' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseActive) {
        if (mode === 'signUp') {
          const { error } = await supabaseSignUp({
            email,
            password,
            fullName,
            phone,
            role,
          });

          if (error) {
            setErrorMessage(error.message || 'Sign up failed.');
          } else {
            setSuccessMessage('Account created successfully! Check your email or sign in.');
            setMode('signIn');
          }
        } else {
          const { error } = await supabaseSignIn(email, password);
          if (error) {
            setErrorMessage(error.message || 'Invalid email or password.');
          }
        }
      } else {
        // Fallback / Demo Login
        switchRole(role);
        login(accessType);
      }
    } catch (e) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.brandWrap}>
          <View style={styles.brandBadge}>
            <Award size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Waste2Worth</Text>
          <Text style={styles.subtitle}>
            {isSupabaseActive
              ? mode === 'signIn' ? 'Sign in to access your dashboard' : 'Create an account to start earning'
              : 'Demo Mode — Sign in to preview access'}
          </Text>
        </View>

        {/* Tab Selector for Sign In / Sign Up */}
        {isSupabaseActive && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'signIn' && styles.tabButtonActive]}
              onPress={() => {
                setMode('signIn');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'signUp' && styles.tabButtonActive]}
              onPress={() => {
                setMode('signUp');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error or Success Banners */}
        {Boolean(errorMessage) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {Boolean(successMessage) && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Fields for Sign Up */}
        {mode === 'signUp' && isSupabaseActive && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kofi Mensah"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +233 24 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="johndoe@gmail.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Role Selector for Sign Up */}
        {mode === 'signUp' && isSupabaseActive && (
          <>
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleGrid}>
              {[
                { key: 'citizen', label: 'Citizen', icon: User },
                { key: 'collector', label: 'Collector', icon: Truck },
                { key: 'recycler', label: 'Recycler', icon: Recycle },
                { key: 'admin', label: 'Admin', icon: Settings },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, role === r.key && styles.roleCardActive]}
                  onPress={() => setRole(r.key)}
                >
                  {r.icon ? (() => {
                    const Icon = r.icon;
                    return <Icon size={18} color={role === r.key ? COLORS.primary : COLORS.textSecondary} style={{ marginBottom: 6 }} />;
                  })() : null}
                  <Text style={[styles.roleCardText, role === r.key && styles.roleCardTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Demo Mode Role Switcher */}
        {!isSupabaseActive && (
          <>
            <Text style={styles.label}>Select Demo Role</Text>
            <View style={styles.roleGrid}>
              {[
                { key: 'citizen', label: 'Citizen', icon: User },
                { key: 'collector', label: 'Collector', icon: Truck },
                { key: 'recycler', label: 'Recycler', icon: Recycle },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, role === r.key && styles.roleCardActive]}
                  onPress={() => setRole(r.key)}
                >
                  {r.icon ? (() => {
                    const Icon = r.icon;
                    return <Icon size={18} color={role === r.key ? COLORS.primary : COLORS.textSecondary} style={{ marginBottom: 6 }} />;
                  })() : null}
                  <Text style={[styles.roleCardText, role === r.key && styles.roleCardTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Demo Mode Access Level</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[styles.roleCard, accessType === 'ccr' && styles.roleCardActive]}
                onPress={() => setAccessType('ccr')}
              >
                <Text style={[styles.roleCardText, accessType === 'ccr' && styles.roleCardTextActive]}>
                  User Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, accessType === 'admin' && styles.roleCardActive]}
                onPress={() => setAccessType('admin')}
              >
                <Text style={[styles.roleCardText, accessType === 'admin' && styles.roleCardTextActive]}>
                  Admin Panel
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSupabaseActive ? (mode === 'signIn' ? 'Sign In' : 'Create Account') : 'Continue to App'}
            </Text>
          )}
        </TouchableOpacity>

        {isSupabaseActive && mode === 'signIn' && (
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => setMode('signUp')}>
              <Text style={styles.footerLink}>Need an account? Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justify: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginTop: 50,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  roleCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  roleCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleCardTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
