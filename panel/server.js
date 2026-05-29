'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http    = require('http');
const path    = require('path');
const cors    = require('cors');
const { Users } = require('./db/database');

const app  = express();
const PORT = parseInt(process.env.PANEL_PORT) || 4000;

// Token interne pour parler au bot
const INTERNAL_TOKEN  = process.env.INTERNAL_TOKEN  || 'lucifer-internal-2024';
const INTERNAL_PORT   = parseInt(process.env.INTERNAL_API_PORT) || 3500;

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

// ─────────────────────────────────────────────────────────────────────────────
// ── /api/paircode — Proxy vers l'API interne du bot
// Le client entre son numéro → le panel demande au bot → retourne le code 8 chars
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/paircode', require('./middleware/auth').authMiddleware, async (req, res) => {
  const { phone, botId } = req.body;
  if (!phone) return res.status(400).json({ error: 'Numéro de téléphone requis.' });

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 7) return res.status(400).json({ error: 'Numéro invalide. Exemple: 22656060976' });

  try {
    // Appel vers l'API interne du bot (localhost:3500)
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ phone: cleanPhone });
      const options = {
        hostname: '127.0.0.1',
        port: INTERNAL_PORT,
        path: '/paircode',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-internal-token': INTERNAL_TOKEN,
        },
      };
      const req2 = http.request(options, r => {
        let body = '';
        r.on('data', d => (body += d));
        r.on('end', () => {
          try { resolve({ status: r.statusCode, data: JSON.parse(body) }); }
          catch { resolve({ status: r.statusCode, data: { error: 'Réponse invalide du bot.' } }); }
        });
      });
      req2.on('error', () => reject(new Error('Bot non démarré. Lancez `npm start` ou `pm2 start ecosystem.config.js` d\'abord.')));
      req2.setTimeout(15000, () => { req2.destroy(); reject(new Error('Timeout — le bot met trop de temps à répondre.')); });
      req2.write(postData);
      req2.end();
    });

    if (result.status === 200 && result.data.code) {
      // Formater le code: ABCDEFGH → ABCD-EFGH
      const raw  = result.data.code.replace(/-/g, '');
      const code = raw.length === 8 ? `${raw.slice(0,4)}-${raw.slice(4)}` : raw;
      return res.json({ code, phone: cleanPhone, message: result.data.message });
    }

    return res.status(result.status || 500).json({ error: result.data?.error || 'Erreur interne du bot.' });
  } catch (err) {
    return res.status(503).json({
      error: err.message,
      hint: 'Assurez-vous que le bot est démarré: pm2 start ecosystem.config.js',
    });
  }
});

// ── /api/bot-status — Statut de connexion du bot WhatsApp ─────────────────────
app.get('/api/bot-status', require('./middleware/auth').authMiddleware, async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1', port: INTERNAL_PORT, path: '/status', method: 'GET',
        headers: { 'x-internal-token': INTERNAL_TOKEN },
      };
      const r = http.request(options, resp => {
        let body = '';
        resp.on('data', d => (body += d));
        resp.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
      });
      r.on('error', () => resolve({ connected: false, phone: null }));
      r.setTimeout(3000, () => { r.destroy(); resolve({ connected: false, phone: null }); });
      r.end();
    });
    res.json(result);
  } catch {
    res.json({ connected: false, phone: null });
  }
});

// ── /api/admin/broadcast-wa — Broadcast WhatsApp via le bot ───────────────────
app.post('/api/admin/broadcast-wa', require('./middleware/auth').adminMiddleware, async (req, res) => {
  const { jids, message } = req.body;
  if (!jids?.length || !message) return res.status(400).json({ error: 'jids[] et message requis.' });
  const results = [];
  for (const jid of jids.slice(0, 100)) {
    try {
      await new Promise((resolve, reject) => {
        const postData = JSON.stringify({ jid, message });
        const opts = {
          hostname: '127.0.0.1', port: INTERNAL_PORT, path: '/send', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'x-internal-token': INTERNAL_TOKEN },
        };
        const r = http.request(opts, resp => { resp.resume(); resp.on('end', resolve); });
        r.on('error', reject);
        r.write(postData); r.end();
      });
      results.push({ jid, sent: true });
    } catch {
      results.push({ jid, sent: false });
    }
  }
  res.json({ results, sent: results.filter(r => r.sent).length });
});

// ── /api/restart — Redémarrer le bot via PM2 ──────────────────────────────────
app.post('/api/restart', require('./middleware/auth').adminMiddleware, async (req, res) => {
  try {
    const postData = '{}';
    const opts = {
      hostname: '127.0.0.1', port: INTERNAL_PORT, path: '/restart', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'x-internal-token': INTERNAL_TOKEN },
    };
    const r = http.request(opts, resp => { resp.resume(); });
    r.on('error', () => {});
    r.write(postData); r.end();
    res.json({ message: 'Commande de redémarrage envoyée. PM2 va relancer le bot.' });
  } catch {
    res.status(503).json({ error: 'Bot non joignable.' });
  }
});

// ── Pages HTML ────────────────────────────────────────────────────────────────
const pages = { '/': 'index.html', '/login': 'login.html', '/dashboard': 'dashboard.html', '/admin': 'admin.html' };
for (const [route, file] of Object.entries(pages)) {
  app.get(route, (_, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()), version: '2.1.0' }));
app.use((_, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
Users.ensureAdmin();
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  𓅂 DOMA LUCIFERO — Panel SaaS v2.1                ║`);
  console.log(`║  URL:    http://localhost:${PORT}                    ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  👑 Super Admin: admin@lucifero.bot                ║`);
  console.log(`║  🔑 Mot de passe: LuciferAdmin@2024                ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  🛡️  Modérateur:  mod@lucifero.bot                  ║`);
  console.log(`║  🔑 Mot de passe: LuciferMod@2024                  ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  🎫 Support:     support@lucifero.bot              ║`);
  console.log(`║  🔑 Mot de passe: LuciferSupport@2024              ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});

module.exports = app;
