/**
 * 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Dashboard Web
 * Panel admin: QR, Pair Code, stats, VIP/Ban management
 */

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('../config/config');

const app = express();
let _sock = null;        // Baileys socket reference
let _qrCode = null;      // Latest QR data URI
let _pairCode = null;    // Latest pair code
let _connected = false;  // Connection state

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Session Admin ───────────────────────────────────────────────────────────
const sessions = new Set();
const ADMIN_TOKEN_FILE = path.join(__dirname, '..', 'database', 'admin_tokens.json');

function loadTokens() {
  try { return new Set(JSON.readJsonSync(ADMIN_TOKEN_FILE)); } catch { return new Set(); }
}
function saveTokens() {
  fs.outputJsonSync(ADMIN_TOKEN_FILE, [...sessions]);
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Non autorisé. Connectez-vous.' });
  }
  next();
}

// ─── Routes Publiques ─────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || config.ADMIN_PASSWORD || 'lucifer2024';
  if (password !== adminPass) return res.status(403).json({ error: 'Mot de passe incorrect.' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token);
  saveTokens();
  res.json({ token, message: 'Connexion réussie!' });
});

app.post('/api/logout', authMiddleware, (req, res) => {
  const token = req.headers['x-admin-token'];
  sessions.delete(token);
  saveTokens();
  res.json({ message: 'Déconnecté.' });
});

// ─── Routes Bot Status ────────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
  res.json({
    connected: _connected,
    botName: config.BOT_NAME,
    version: config.VERSION,
    owner: config.OWNER_NUMBER,
    hasQr: !!_qrCode,
    hasPairCode: !!_pairCode,
    pairCode: _pairCode,
  });
});

app.get('/api/qr', (req, res) => {
  if (!_qrCode) return res.status(404).json({ error: 'Pas de QR disponible. Démarrez le bot.' });
  res.json({ qr: _qrCode });
});

app.post('/api/paircode', authMiddleware, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Numéro requis.' });
  if (!_sock) return res.status(503).json({ error: 'Bot non démarré.' });
  if (_connected) return res.status(400).json({ error: 'Déjà connecté.' });
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const code = await _sock.requestPairingCode(cleanPhone);
    _pairCode = code;
    res.json({ code, message: `Code: ${code} — Entrez dans WhatsApp > Appareils liés > Lier via numéro` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Routes Admin (protégées) ─────────────────────────────────────────────────

app.get('/api/stats', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const data = db.getData();
  res.json({
    totalUsers: Object.keys(data.users || {}).length,
    vipCount: Object.keys(data.vip || {}).length,
    bannedCount: Object.keys(data.banned || {}).length,
    groups: Object.keys(data.notes || {}).length,
    economy: Object.values(data.economy || {}).reduce((a, u) => a + (u.coins || 0), 0),
    uptime: process.uptime(),
    version: config.VERSION,
    commands: config.TOTAL_COMMANDS || '684+',
  });
});

app.get('/api/vip', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const data = db.getData();
  res.json(data.vip || {});
});

app.post('/api/vip/add', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  db.addVip(jid);
  res.json({ message: `VIP ajouté: ${jid}` });
});

app.post('/api/vip/remove', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  db.delVip(jid);
  res.json({ message: `VIP retiré: ${jid}` });
});

app.get('/api/banned', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const data = db.getData();
  res.json(data.banned || {});
});

app.post('/api/banned/add', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid, reason } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  db.banUser(jid, reason || 'Via admin panel');
  res.json({ message: `Banni: ${jid}` });
});

app.post('/api/banned/remove', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  db.unbanUser(jid);
  res.json({ message: `Débanni: ${jid}` });
});

app.post('/api/broadcast', authMiddleware, async (req, res) => {
  const db = require('../database/db');
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });

  const data = db.getData();
  const users = Object.keys(data.users || {});
  let sent = 0;
  for (const jid of users) {
    try {
      await _sock.sendMessage(jid, { text: `📢 *Annonce du bot*\n\n${message}` });
      sent++;
      await new Promise(r => setTimeout(r, 500));
    } catch {}
  }
  res.json({ message: `Broadcast envoyé à ${sent} utilisateurs.` });
});

app.post('/api/coins', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid, amount } = req.body;
  if (!jid || !amount) return res.status(400).json({ error: 'JID et montant requis.' });
  db.addCoins(jid, parseInt(amount));
  res.json({ message: `${amount} coins ajoutés à ${jid}` });
});

app.post('/api/restart', authMiddleware, (req, res) => {
  res.json({ message: 'Redémarrage...' });
  setTimeout(() => process.exit(0), 500);
});

// ─── Exports ─────────────────────────────────────────────────────────────────

function startWebServer(port = 3000) {
  app.listen(port, () => {
    console.log(`\n🌐 Dashboard: http://localhost:${port}`);
    console.log(`🔑 Mot de passe admin: ${process.env.ADMIN_PASSWORD || 'lucifer2024'}`);
  });
}

function setSocket(sock) { _sock = sock; }
function setQr(qr) { _qrCode = qr; }
function setPairCode(code) { _pairCode = code; }
function setConnected(val) { _connected = val; _qrCode = null; _pairCode = null; }

module.exports = { startWebServer, setSocket, setQr, setPairCode, setConnected };
