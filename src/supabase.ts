import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ptdvchxzbrbytjoqiqyd.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_Q0r-Qa9R_y6PCrwahwjqyg_3y-Ua54T';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
