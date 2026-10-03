import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl: any;
supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
    ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey
    ?? process.env.EXPO_PUBLIC_SUPABASE_KEY;

// No-op storage used during SSR/Node render, where `window` doesn't exist.
// AsyncStorage's web implementation calls into localStorage, which throws
// in that environment.
const noopStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
};

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            storage: isBrowser ? AsyncStorage : noopStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })