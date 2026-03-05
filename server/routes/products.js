const { Router } = require('express');
const { supabase, supabaseAdmin } = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

// GET /api/products  — list all products, optionally filter by category
router.get('/', async (req, res) => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at', { ascending: true });

  if (req.query.category && req.query.category !== 'all') {
    query = query.eq('category', req.query.category);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
});

// POST /api/products — create (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, category, price, badge, description, specs, img, in_stock } = req.body;

  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'name, category, and price are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ name, category, price, badge: badge || null, description, specs, img, in_stock: in_stock ?? true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/products/:id — update (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  const allowed = ['name', 'category', 'price', 'badge', 'description', 'specs', 'img', 'in_stock'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/products/:id — delete (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

module.exports = router;
