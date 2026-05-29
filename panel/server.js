'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path    = require('path');
const cors    = require('cors');
const { Users } = require('./db/database');

const app  = express();
const PORT = parseInt(process.env.PANEL_PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bots',     require('./routes/bots'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/support',  require('./routes/support'));
app.use('/api/admin',    require('./routes/admin'));

// ── Pages HTML ────────────────────────────────────────────────────────────────
const pages = { '/': 'index.html', '/login': 'login.html', '/dashboard': 'dashboard.html', '/admin': 'admin.html' };
for (const [route, file] of Object.entries(pages)) {
  app.get(route, (_, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()), version: '2.1.0' }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
Users.ensureAdmin();
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║  𓅂 DOMA LUCIFERO — Panel SaaS      ║`);
  console.log(`║  http://localhost:${PORT}              ║`);
  console.log(`║  Admin: ${process.env.ADMIN_EMAIL || 'admin@lucifero.bot'}       ║`);
  console.log(`╚════════════════════════════════════╝\n`);
});

module.exports = app;
