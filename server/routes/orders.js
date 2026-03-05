const { Router } = require('express');
const { supabaseAdmin } = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// POST /api/orders — place an order (guest or authenticated)
router.post('/', async (req, res) => {
  const { items, delivery } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  if (!delivery || !delivery.email) {
    return res.status(400).json({ error: 'delivery details with email are required' });
  }

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal + shipping;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: req.user?.id || null,
      items,
      subtotal,
      shipping,
      total,
      delivery,
      status: 'confirmed'
    })
    .select('id, status, total, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/orders/mine — current user's order history
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total, items, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/orders — all orders (admin only)
router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/orders/:id — update order status (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select('id, status, total, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
