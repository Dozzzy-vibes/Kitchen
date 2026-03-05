const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Public client — respects Row Level Security
const supabase = createClient(url, anonKey);

// Service-role client — bypasses RLS (admin use only)
const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { supabase, supabaseAdmin };
