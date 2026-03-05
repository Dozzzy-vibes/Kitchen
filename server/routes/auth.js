const { Router } = require('express');
const { supabase, supabaseAdmin } = require('../supabase');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name } }
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    user: { id: data.user.id, email: data.user.email, first_name, last_name },
    access_token: data.session?.access_token || null,
    message: data.session ? 'Registered and logged in' : 'Check your email to confirm your account'
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid email or password' });

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata?.first_name,
      last_name: data.user.user_metadata?.last_name,
      role: data.user.app_metadata?.role || 'customer'
    },
    access_token: data.session.access_token
  });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) await supabase.auth.admin.signOut(token).catch(() => {});
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    first_name: req.user.user_metadata?.first_name,
    last_name: req.user.user_metadata?.last_name,
    role: req.user.app_metadata?.role || 'customer'
  });
});

module.exports = router;
