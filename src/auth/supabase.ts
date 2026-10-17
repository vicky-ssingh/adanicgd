import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the login gate. Only the public URL + anon (publishable)
 * key ship to the browser — never the service-role key. Both come from Vite env
 * vars (.env.local locally, Netlify environment variables in production).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
