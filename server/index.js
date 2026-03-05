require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const { attachUser } = require('./middleware/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:4000'] }));
app.use(express.json());
app.use(attachUser);  // attach req.user on every request if token present

// ── API routes ────────────────────────────────
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Static files ──────────────────────────────
const root = path.join(__dirname, '..');
app.use('/admin', express.static(path.join(root, 'admin')));
app.use(express.static(root, { index: 'index.html' }));

// Serve index.html for any unmatched non-API route (SPA fallback)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

// ── Error handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Ada's Kitchen API running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
