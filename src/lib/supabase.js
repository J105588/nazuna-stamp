import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

let adminPasscode = '';

const customFetch = (url, options) => {
  if (adminPasscode) {
    const headers = new Headers(options?.headers);
    headers.set('x-admin-passcode', adminPasscode);
    options = { ...options, headers };
  }
  return fetch(url, options);
};


export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: customFetch
      }
    })
  : null;

export const setAdminAuth = (passcode) => {
  adminPasscode = passcode;
};
