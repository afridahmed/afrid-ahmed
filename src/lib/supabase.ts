import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. Supabase features will be inactive until configured.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
