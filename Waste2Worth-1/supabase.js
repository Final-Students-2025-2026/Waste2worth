import { createClient } from '@supabase/supabase-js';

// Safe AsyncStorage loader
let customStorage = null;
try {
  customStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback to localStorage or in-memory if module not installed
  if (typeof localStorage !== 'undefined') {
    customStorage = localStorage;
  }
}

// Clean Supabase URL (strip trailing /rest/v1 if user included it)
let rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
if (rawUrl.endsWith('/rest/v1/')) {
  rawUrl = rawUrl.replace('/rest/v1/', '');
} else if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace('/rest/v1', '');
}
const supabaseUrl = rawUrl.trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        ...(customStorage ? { storage: customStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
