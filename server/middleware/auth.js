const { supabase } = require('../supabase');

// Attach req.user if a valid Supabase JWT is present.
// Does NOT block the request — routes that require auth should call requireAuth.
async function attachUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (!error && data?.user) req.user = data.user;
  next();
}

// Hard-require an authenticated user.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// Require the user to have the 'admin' role (set via Supabase app_metadata).
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const role = req.user.app_metadata?.role;
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
