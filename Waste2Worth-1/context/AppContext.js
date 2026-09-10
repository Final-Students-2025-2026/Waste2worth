import { createContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';

// Create AppContext
export const AppContext = createContext();

// Initial pickups list (starts empty for live data)
const INITIAL_PICKUPS = [];

const INITIAL_REWARDS = [
  { id: 'R-01', title: '5 GHS Airtime (MTN / Telecel / AT)', cost: 100, provider: 'Airtime Top-Up', type: 'Airtime' },
  { id: 'R-02', title: '10 GHS Mobile Money Transfer', cost: 200, provider: 'MoMo Cashout', type: 'Mobile Money' },
  { id: 'R-03', title: '25 GHS Shopping Voucher', cost: 500, provider: 'Melcom Ghana', type: 'Voucher' },
  { id: 'R-04', title: 'Eco Recycled Tote Bag', cost: 50, provider: 'Green Ghana Initiative', type: 'Physical' },
];

const INITIAL_TRANSACTIONS = [];

export const AppProvider = ({ children }) => {
  const [pickups, setPickups] = useState(INITIAL_PICKUPS);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [collectorEarnings, setCollectorEarnings] = useState({
    balance: 0.00,
    trips: 0,
  });
  const [currentRole, setCurrentRole] = useState('citizen');
  const [accessLevel, setAccessLevel] = useState('login');

  // Supabase Auth State
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]); // all platform profiles (admin view)

  // Initialize Supabase Auth Listener & Sync Data
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      loadLocalState();
      return;
    }

    // Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSession(session.user);
      }
    });

    // Listen for Auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setProfile(null);
        setAccessLevel('login');
      }
    });

    // Fetch initial database records
    fetchSupabaseData();
    // Fetch profiles for admin features
    fetchAllProfiles();

    // Subscribe to Realtime Pickups Changes
    const pickupsChannel = supabase
      .channel('public:pickups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, () => {
        fetchPickups();
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      supabase.removeChannel(pickupsChannel);
    };
  }, []);

  const loadLocalState = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        // One-time purge of legacy 250 cached balance
        const legacyWallet = localStorage.getItem('w2w_wallet');
        if (legacyWallet === '250' || !localStorage.getItem('w2w_zero_reset_done')) {
          localStorage.removeItem('w2w_wallet');
          localStorage.setItem('w2w_zero_reset_done', 'true');
        }

        const savedPickups = localStorage.getItem('w2w_pickups');
        const savedWallet = localStorage.getItem('w2w_wallet');
        const savedTransactions = localStorage.getItem('w2w_transactions');
        const savedEarnings = localStorage.getItem('w2w_earnings');
        const savedRole = localStorage.getItem('w2w_role');
        const savedAccess = localStorage.getItem('w2w_access');

        if (savedPickups) setPickups(JSON.parse(savedPickups));
        if (savedWallet !== null && savedWallet !== '250') {
          setWalletBalance(Number(savedWallet) || 0);
        } else {
          setWalletBalance(0);
        }
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedEarnings) setCollectorEarnings(JSON.parse(savedEarnings));
        if (savedRole) setCurrentRole(savedRole);
        if (savedAccess) setAccessLevel(savedAccess);
      }
    } catch (e) { }
  };

  const handleUserSession = async (currentUser) => {
    try {
      const metaRole = currentUser?.user_metadata?.role || 'citizen';
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        setProfile({ ...data, wallet_balance: 0 });
        setWalletBalance(0);
        const checkedRole = data.role || metaRole;
        setCurrentRole(checkedRole);
        setAccessLevel(checkedRole === 'admin' ? 'admin' : 'ccr');

        // Reset legacy high database test balance in Supabase to 0
        if (data.wallet_balance && data.wallet_balance > 0) {
          try {
            await supabase.from('profiles').update({ wallet_balance: 0 }).eq('id', currentUser.id);
          } catch (e) {}
        }
      } else {
        if (error) {
          console.warn('Profile fetch note:', error.message);
        }
        setProfile({
          id: currentUser.id,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
          phone: currentUser?.user_metadata?.phone || '',
          role: metaRole,
          wallet_balance: 0,
        });
        setWalletBalance(0);
        setCurrentRole(metaRole);
        setAccessLevel(metaRole === 'admin' ? 'admin' : 'ccr');
      }

      fetchTransactions(currentUser.id);
      fetchCollectorEarnings(currentUser.id);
    } catch (err) {
      console.error('Error handling user session:', err);
    }
  };

  const fetchSupabaseData = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await fetchPickups();
  };

  const fetchPickups = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((p, idx) => ({
          id: p.request_code || p.id,
          dbId: p.id,
          citizenName: p.citizen_name || 'Citizen',
          citizenPhone: p.citizen_phone || '',
          address: p.address,
          wasteType: p.waste_type,
          estimatedWeight: parseFloat(p.estimated_weight) || 0,
          actualWeight: p.actual_weight ? parseFloat(p.actual_weight) : null,
          status: p.status,
          pointsAwarded: p.points_awarded || 0,
          date: p.created_at,
          collectorId: p.collector_id,
          recyclerId: p.recycler_id,
          citizenId: p.citizen_id,
          latitude: parseFloat(p.latitude) || (6.6731 + (Math.sin(idx + 1) * 0.012)),
          longitude: parseFloat(p.longitude) || (-1.5654 + (Math.cos(idx + 1) * 0.012)),
        }));
        setPickups(formatted);
      }
    } catch (e) {
      console.error('Error fetching pickups from Supabase:', e);
    }
  };

  const fetchTransactions = async (userId) => {
    if (!isSupabaseConfigured || !supabase || !userId) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((t) => ({
          id: t.id,
          type: t.type,
          points: t.points,
          description: t.description,
          date: t.created_at,
        }));
        setTransactions(formatted);
      }
    } catch (e) { }
  };

  const fetchCollectorEarnings = async (userId) => {
    if (!isSupabaseConfigured || !supabase || !userId) return;
    try {
      const { data } = await supabase
        .from('collector_earnings')
        .select('*')
        .eq('collector_id', userId)
        .single();

      if (data) {
        // Reset legacy high database test balances (e.g. 7800) to clean 0.00 baseline
        if (parseFloat(data.balance) >= 500) {
          setCollectorEarnings({ balance: 0.00, trips: 0 });
          try {
            await supabase
              .from('collector_earnings')
              .upsert({ collector_id: userId, balance: 0.00, trips: 0 });
          } catch (e) {}
        } else {
          setCollectorEarnings({
            balance: parseFloat(data.balance) || 0.00,
            trips: data.trips || 0,
          });
        }
      } else {
        setCollectorEarnings({ balance: 0.00, trips: 0 });
      }
    } catch (e) {}
  };

  const fetchAllProfiles = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setProfiles(data);
      }
    } catch (e) {
      console.error('Error fetching profiles:', e);
    }
  };

  const updateProfileRole = async (userId, role) => {
    if (!isSupabaseConfigured || !supabase || !userId) return { error: { message: 'Not configured or missing userId' } };
    try {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId);
      if (error) return { error };
      await fetchAllProfiles();
      return { data };
    } catch (e) {
      console.error('Error updating profile role:', e);
      return { error: e };
    }
  };

  const updateProfileWallet = async (userId, walletBalance) => {
    if (!isSupabaseConfigured || !supabase || !userId) return { error: { message: 'Not configured or missing userId' } };
    try {
      const { data, error } = await supabase.from('profiles').update({ wallet_balance: walletBalance }).eq('id', userId);
      if (error) return { error };
      await fetchAllProfiles();
      return { data };
    } catch (e) {
      console.error('Error updating profile wallet:', e);
      return { error: e };
    }
  };

  // SUPABASE AUTH ACTIONS
  const supabaseSignUp = async ({ email, password, fullName, phone, role }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet. Check your .env file.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
        },
      },
    });

    return { data, error };
  };

  const supabaseSignIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase is not configured yet. Check your .env file.' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // Helper persist for local demo mode
  const persist = (key, data) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) { }
  };

  // Switch Role
  const switchRole = (role) => {
    setCurrentRole(role);
    persist('w2w_role', role);
  };

  const login = (level) => {
    setAccessLevel(level);
    persist('w2w_access', level);
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setAccessLevel('login');
    persist('w2w_access', 'login');
  };

  // CITIZEN ACTIONS
  const requestPickup = async (address, wasteType, estimatedWeight) => {
    const code = `REQ-${Math.floor(100 + Math.random() * 900)}`;
    const parsedWeight = parseFloat(estimatedWeight) || 0;
    const citizenName = profile?.full_name || user?.user_metadata?.full_name || 'Kwaku Mensah';
    const citizenPhone = profile?.phone || user?.user_metadata?.phone || '+233 20 999 8888';

    const baseLat = 6.6731;
    const baseLng = -1.5654;
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    const newRequest = {
      id: code,
      request_code: code,
      citizenName,
      citizenPhone,
      address,
      wasteType,
      estimatedWeight: parsedWeight,
      actualWeight: null,
      status: 'pending',
      pointsAwarded: 0,
      date: new Date().toISOString(),
      collectorId: null,
      recyclerId: null,
      citizenId: user?.id || 'citizen-session',
      isRegisteredSession: true,
      latitude: parseFloat((baseLat + latOffset).toFixed(6)),
      longitude: parseFloat((baseLng + lngOffset).toFixed(6)),
    };

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('pickups').insert({
          request_code: code,
          citizen_id: user?.id || null,
          citizen_name: citizenName,
          citizen_phone: citizenPhone,
          address,
          waste_type: wasteType,
          estimated_weight: parsedWeight,
          status: 'pending',
        });
      } catch (err) {
        console.error('Supabase pickup insert error:', err);
      }
    }

    // Create transaction log for new pickup request
    const newTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      type: 'requested',
      points: 0,
      description: `Requested pickup (${code}) for ${parsedWeight}kg of ${wasteType}`,
      date: new Date().toISOString(),
      isRegisteredSession: true,
      citizenId: user?.id || 'citizen-session',
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    persist('w2w_transactions', updatedTxs);

    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'requested',
          points: 0,
          description: newTx.description,
        });
      } catch (e) {}
    }

    const updated = [newRequest, ...pickups];
    setPickups(updated);
    persist('w2w_pickups', updated);
    return newRequest;
  };

  const redeemReward = async (reward) => {
    if (walletBalance >= reward.cost) {
      const newBal = walletBalance - reward.cost;
      setWalletBalance(newBal);
      persist('w2w_wallet', newBal);

      const description = `Redeemed ${reward.title}`;

      if (isSupabaseConfigured && supabase && user?.id) {
        try {
          await supabase.from('profiles').update({ wallet_balance: newBal }).eq('id', user.id);
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'redeemed',
            points: reward.cost,
            description,
          });
        } catch (e) {}
      }

      const newTx = {
        id: `TX-${Math.floor(100 + Math.random() * 900)}`,
        type: 'redeemed',
        points: reward.cost,
        description,
        date: new Date().toISOString(),
        isRegisteredSession: true,
        citizenId: user?.id || 'citizen-session',
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      persist('w2w_transactions', updatedTxs);
      return true;
    }
    return false;
  };

  // COLLECTOR ACTIONS
  const acceptPickup = async (pickupId) => {
    const collectorId = user?.id || 'COL-001';

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .update({ status: 'accepted', collector_id: collectorId })
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);
      } catch (e) { }
    }

    const updated = pickups.map(p => {
      if (p.id === pickupId || p.dbId === pickupId) {
        return { ...p, status: 'accepted', collectorId };
      }
      return p;
    });
    setPickups(updated);
    persist('w2w_pickups', updated);
  };

  const markArrived = async (pickupId) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .update({ status: 'arrived' })
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);
      } catch (e) { }
    }

    const updated = pickups.map(p => {
      if (p.id === pickupId || p.dbId === pickupId) {
        return { ...p, status: 'arrived' };
      }
      return p;
    });
    setPickups(updated);
    persist('w2w_pickups', updated);
  };

  const verifyQRAndCollect = async (pickupId) => {
    const targetPickup = pickups.find(p => p.id === pickupId || p.dbId === pickupId);
    const tripPayout = 10.00; // Collector receives GH₵ 10.00 per completed trip

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .update({ status: 'picked_up' })
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);

        if (user?.id) {
          await supabase
            .from('collector_earnings')
            .upsert({
              collector_id: user.id,
              balance: parseFloat((collectorEarnings.balance + tripPayout).toFixed(2)),
              trips: collectorEarnings.trips + 1,
              updated_at: new Date().toISOString()
            });
        }
      } catch (e) {}
    }

    const updatedEarnings = {
      balance: parseFloat((collectorEarnings.balance + tripPayout).toFixed(2)),
      trips: collectorEarnings.trips + 1,
    };
    setCollectorEarnings(updatedEarnings);
    persist('w2w_earnings', updatedEarnings);

    const updated = pickups.map(p => {
      if (p.id === pickupId || p.dbId === pickupId) {
        return { ...p, status: 'picked_up' };
      }
      return p;
    });
    setPickups(updated);
    persist('w2w_pickups', updated);

    // Log collection event
    const scanTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      type: 'collected',
      points: 0,
      description: `Verified & collected pickup (${pickupId}) - GH₵${tripPayout.toFixed(2)} driver payout`,
      date: new Date().toISOString(),
      isRegisteredSession: true,
      citizenId: user?.id || 'citizen-session',
    };
    const updatedTxs = [scanTx, ...transactions];
    setTransactions(updatedTxs);
    persist('w2w_transactions', updatedTxs);
  };

  // RECYCLER ACTIONS
  const processDelivery = async (pickupId, actualWeight) => {
    const parsedWeight = parseFloat(actualWeight) || 0;
    const pointsAwarded = Math.round(parsedWeight * 10); // Citizen gets 10 EcoPoints per 1 kg
    const tripPayout = 10.00; // Collector receives GH₵ 10.00 per delivery trip
    const recyclerId = user?.id || 'REC-001';

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .update({
            status: 'completed',
            actual_weight: parsedWeight,
            points_awarded: pointsAwarded,
            recycler_id: recyclerId,
          })
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);
      } catch (e) { }
    }

    const updatedPickups = pickups.map(p => {
      if (p.id === pickupId || p.dbId === pickupId) {
        return {
          ...p,
          status: 'completed',
          actualWeight: parsedWeight,
          pointsAwarded,
          recyclerId,
        };
      }
      return p;
    });

    setPickups(updatedPickups);
    persist('w2w_pickups', updatedPickups);

    const newEarnings = {
      balance: parseFloat((collectorEarnings.balance + tripPayout).toFixed(2)),
      trips: collectorEarnings.trips + 1,
    };
    setCollectorEarnings(newEarnings);
    persist('w2w_earnings', newEarnings);

    const targetPickup = pickups.find(p => p.id === pickupId || p.dbId === pickupId);
    if (targetPickup) {
      const isUserCitizen = (targetPickup.citizenId && targetPickup.citizenId === user?.id) ||
        targetPickup.citizenName.includes('You') ||
        targetPickup.citizenName === 'Kwaku Osei';

      if (isUserCitizen) {
        const newBal = walletBalance + pointsAwarded;
        setWalletBalance(newBal);
        persist('w2w_wallet', newBal);

        const description = `Earned from ${parsedWeight}kg of ${targetPickup.wasteType}`;

        if (isSupabaseConfigured && supabase && user?.id) {
          try {
            await supabase.from('profiles').update({ wallet_balance: newBal }).eq('id', user.id);
            await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'earned',
              points: pointsAwarded,
              description,
            });
          } catch (e) { }
        }

        const newTx = {
          id: `TX-${Math.floor(100 + Math.random() * 900)}`,
          type: 'earned',
          points: pointsAwarded,
          description,
          date: new Date().toISOString(),
        };
        const updatedTxs = [newTx, ...transactions];
        setTransactions(updatedTxs);
        persist('w2w_transactions', updatedTxs);
      }
    }
  };

  // Reset demo
  const resetDemo = () => {
    setPickups(INITIAL_PICKUPS);
    setWalletBalance(0);
    setTransactions(INITIAL_TRANSACTIONS);
    setCollectorEarnings({ balance: 0.00, trips: 0 });
    setCurrentRole('citizen');
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('w2w_pickups');
        localStorage.removeItem('w2w_wallet');
        localStorage.removeItem('w2w_transactions');
        localStorage.removeItem('w2w_earnings');
        localStorage.removeItem('w2w_role');
      }
    } catch (e) { }
  };

  // ADMIN MASTER OPERATIONS (Full ecosystem control across Citizen, Collector, Recycler)
  const adminAssignCollector = async (pickupId, collectorId = 'COL-001') => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .update({ status: 'accepted', collector_id: collectorId })
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);
      } catch (e) { }
    }
    const updated = pickups.map(p => {
      if (p.id === pickupId || p.dbId === pickupId) {
        return { ...p, status: 'accepted', collectorId };
      }
      return p;
    });
    setPickups(updated);
    persist('w2w_pickups', updated);
  };

  const adminForceCollect = async (pickupId) => {
    await verifyQRAndCollect(pickupId);
  };

  const adminDirectProcessDelivery = async (pickupId, actualWeight, recyclerId = 'REC-001') => {
    await processDelivery(pickupId, actualWeight);
  };

  const adminCancelPickup = async (pickupId) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('pickups')
          .delete()
          .or(`request_code.eq.${pickupId},id.eq.${pickupId}`);
      } catch (e) { }
    }
    const updated = pickups.filter(p => p.id !== pickupId && p.dbId !== pickupId);
    setPickups(updated);
    persist('w2w_pickups', updated);
  };

  const adminCreateCustomPickup = async ({ citizenName, citizenPhone, address, wasteType, estimatedWeight }) => {
    const code = `REQ-${Math.floor(100 + Math.random() * 900)}`;
    const parsedWeight = parseFloat(estimatedWeight) || 5.0;

    const baseLat = 6.6731;
    const baseLng = -1.5654;
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    const newRequest = {
      id: code,
      request_code: code,
      citizenName: citizenName || 'Citizen User',
      citizenPhone: citizenPhone || '+233 20 000 0000',
      address: address || 'Kumasi Central Market',
      wasteType: wasteType || 'Plastic Bottles',
      estimatedWeight: parsedWeight,
      actualWeight: null,
      status: 'pending',
      pointsAwarded: 0,
      date: new Date().toISOString(),
      collectorId: null,
      recyclerId: null,
      citizenId: null,
      latitude: parseFloat((baseLat + latOffset).toFixed(6)),
      longitude: parseFloat((baseLng + lngOffset).toFixed(6)),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('pickups').insert({
          request_code: code,
          citizen_name: newRequest.citizenName,
          citizen_phone: newRequest.citizenPhone,
          address: newRequest.address,
          waste_type: newRequest.wasteType,
          estimated_weight: parsedWeight,
          status: 'pending',
        });
      } catch (err) { }
    }

    const updated = [newRequest, ...pickups];
    setPickups(updated);
    persist('w2w_pickups', updated);
    return newRequest;
  };

  const adminDisburseCollectorEarnings = async (collectorId, amount) => {
    const deduct = parseFloat(amount) || 0;
    const current = collectorEarnings.balance;
    const newBal = Math.max(0, parseFloat((current - deduct).toFixed(2)));
    const updated = { ...collectorEarnings, balance: newBal };
    setCollectorEarnings(updated);
    persist('w2w_earnings', updated);
    return updated;
  };

  // Environmental Impact Statistics (Calculated strictly from completed operations)
  const getEnvironmentalImpact = () => {
    let plastic = 0.0;
    let organic = 0.0;
    let other = 0.0;

    pickups.forEach(p => {
      if (p.status === 'completed') {
        const wt = p.actualWeight || p.estimatedWeight || 0;
        if (p.wasteType.toLowerCase().includes('plastic') || p.wasteType.toLowerCase().includes('sachet')) {
          plastic += wt;
        } else {
          other += wt;
        }
      }
    });

    const totalWeight = plastic + organic + other;
    const co2Saved = plastic * 1.5 + other * 1.0;
    const landfillDiverted = totalWeight * 0.95;

    return {
      plastic: parseFloat(plastic.toFixed(1)),
      other: parseFloat(other.toFixed(1)),
      total: parseFloat(totalWeight.toFixed(1)),
      co2: parseFloat(co2Saved.toFixed(1)),
      landfill: parseFloat(landfillDiverted.toFixed(1)),
    };
  };

  return (
    <AppContext.Provider value={{
      user,
      session,
      profile,
      isSupabaseActive: isSupabaseConfigured,
      supabaseSignUp,
      supabaseSignIn,
      pickups,
      walletBalance,
      transactions,
      collectorEarnings,
      currentRole,
      accountRole: profile?.role || user?.user_metadata?.role || currentRole,
      accessLevel,
      rewards: INITIAL_REWARDS,
      switchRole,
      login,
      logout,
      requestPickup,
      redeemReward,
      acceptPickup,
      markArrived,
      verifyQRAndCollect,
      processDelivery,
      environmentalImpact: getEnvironmentalImpact(),
      profiles,
      fetchAllProfiles,
      updateProfileRole,
      updateProfileWallet,
      adminAssignCollector,
      adminForceCollect,
      adminDirectProcessDelivery,
      adminCancelPickup,
      adminCreateCustomPickup,
      adminDisburseCollectorEarnings,
      resetDemo
    }}>
      {children}
    </AppContext.Provider>
  );
};
