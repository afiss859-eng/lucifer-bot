/**
 * 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Dashboard Web
 * Pair Code: appelle requestPairCode() de index.js (attend le signal QR interne)
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs-extra');
const crypto  = require('crypto');
const config  = require('../config/config');

const app = express();
let _sock        = null;
let _connected   = false;
let _pairCodeFn  = null;   // ← Fonction injectée par index.js

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Sessions admin ──────────────────────────────────────────────────────────
const sessions = new Set();
const ADMIN_TOKEN_FILE = path.join(__dirname, '..', 'database', 'admin_tokens.json');

function loadTokens() {
  try {
    const raw = fs.readJsonSync(ADMIN_TOKEN_FILE);
    Array.isArray(raw) && raw.forEach(t => sessions.add(t));
  } catch {}
}
function saveTokens() { fs.outputJsonSync(ADMIN_TOKEN_FILE, [...sessions]); }
loadTokens();

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Non autorisé. Connectez-vous d\'abord.' });
  }
  next();
}

// ─── Routes publiques ─────────────────────────────────────────────────────────

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

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
  sessions.delete(req.headers['x-admin-token']);
  saveTokens();
  res.json({ message: 'Déconnecté.' });
});

// ─── Statut public ────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    connected:  _connected,
    botName:    config.BOT_NAME,
    version:    config.VERSION,
    owner:      config.OWNER_NUMBER,
    botReady:   !!_sock,
    socketReady: !!_pairCodeFn,
  });
});

// ─── Pair Code ────────────────────────────────────────────────────────────────
// Accessible SANS auth — nécessaire pour la première connexion
// Délègue à requestPairCode() dans index.js qui gère correctement le timing Baileys
app.post('/api/paircode', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Numéro de téléphone requis.' });
  }

  // Vérifier format numéro
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 7) {
    return res.status(400).json({
      error: 'Numéro invalide.',
      tip: 'Entrez le numéro complet avec l\'indicatif pays, sans le + (ex: 584265781353)',
    });
  }

  if (_connected) {
    return res.status(400).json({ error: 'Bot déjà connecté à WhatsApp.' });
  }

  if (!_pairCodeFn) {
    return res.status(503).json({
      error: 'Bot en cours de démarrage. Attendez 20-30 secondes puis réessayez.',
    });
  }

  try {
    // Délègue à index.js — attend le bon état Baileys avant de générer le code
    const code = await _pairCodeFn(cleanPhone);
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;

    res.json({
      code,
      formatted,
      message: `Code: ${formatted} — WhatsApp → ⚙️ Paramètres → Appareils liés → Lier avec numéro`,
    });
  } catch (err) {
    const msg = err.message || 'Erreur inconnue';

    // Erreurs communes avec solutions
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
      return res.status(429).json({
        error: 'Trop de tentatives. Attendez 1-2 minutes.',
        tip: 'WhatsApp limite les demandes de code. Patientez avant de réessayer.',
      });
    }
    if (msg.includes('Timeout') || msg.includes('timeout')) {
      return res.status(503).json({
        error: 'Délai dépassé. Le bot n\'est pas encore prêt.',
        tip: 'Attendez 30 secondes que le bot finisse de démarrer, puis réessayez.',
      });
    }
    if (msg.includes('already') || msg.includes('déjà')) {
      return res.status(400).json({
        error: 'Bot déjà connecté ou code déjà demandé.',
        tip: 'Si vous avez une ancienne session, supprimez le dossier "session" et redéployez.',
      });
    }

    res.status(500).json({
      error: 'Erreur: ' + msg,
      tip: 'Si le problème persiste: supprimez la session et redéployez.',
    });
  }
});

// ─── Vider la session (⚠️ déconnecte le bot) ─────────────────────────────────
app.post('/api/clearsession', authMiddleware, async (req, res) => {
  const sessionDir = path.join(__dirname, '..', config.SESSION_NAME || 'session');
  try {
    await fs.emptyDir(sessionDir);
    res.json({ message: '✅ Session vidée. Redémarrez le service sur Render pour reconnecter.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Routes admin (protégées) ─────────────────────────────────────────────────

app.get('/api/stats', authMiddleware, (req, res) => {
  const db   = require('../database/db');
  const data = db.getData();
  res.json({
    totalUsers:  Object.keys(data.users   || {}).length,
    vipCount:    Object.keys(data.vip     || {}).length,
    bannedCount: Object.keys(data.banned  || {}).length,
    groups:      Object.keys(data.notes   || {}).length,
    totalCoins:  Object.values(data.economy || {}).reduce((a, u) => a + (u.coins || 0), 0),
    uptime:      Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    version:     config.VERSION,
    commands:    '700+',
    connected:   _connected,
    botName:     _sock?.user?.name || config.BOT_NAME,
    botNumber:   _sock?.user?.id?.split(':')[0] || 'Non connecté',
    memoryMB:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

app.get('/api/vip', authMiddleware, (req, res) => {
  res.json(require('../database/db').getData().vip || {});
});

app.post('/api/vip/add', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  db.addVip(j);
  res.json({ message: `✅ VIP ajouté: ${j}` });
});

app.post('/api/vip/remove', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  db.removeVip(j);
  res.json({ message: `✅ VIP retiré: ${j}` });
});

app.get('/api/banned', authMiddleware, (req, res) => {
  res.json(require('../database/db').getData().banned || {});
});

app.post('/api/banned/add', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid, reason } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  db.banUser(j, reason || 'Via admin panel');
  res.json({ message: `🚫 Banni: ${j}` });
});

app.post('/api/banned/remove', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID requis.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  db.unbanUser(j);
  res.json({ message: `✅ Débanni: ${j}` });
});

app.post('/api/broadcast', authMiddleware, async (req, res) => {
  const db = require('../database/db');
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  const users = Object.keys(db.getData().users || {});
  let sent = 0, failed = 0;
  for (const jid of users) {
    try {
      await _sock.sendMessage(jid, { text: `📢 *Annonce LUCIFERO*\n\n${message}` });
      sent++;
      await new Promise(r => setTimeout(r, 800));
    } catch { failed++; }
  }
  res.json({ message: `📢 Broadcast: ${sent} envoyés, ${failed} échecs.` });
});

app.post('/api/coins', authMiddleware, (req, res) => {
  const db = require('../database/db');
  const { jid, amount } = req.body;
  if (!jid || !amount) return res.status(400).json({ error: 'JID et montant requis.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  const newBalance = db.addCoins(j, parseInt(amount));
  res.json({ message: `💰 ${amount} coins — Solde: ${newBalance}` });
});

app.post('/api/send', authMiddleware, async (req, res) => {
  const { jid, message } = req.body;
  if (!jid || !message) return res.status(400).json({ error: 'JID et message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  const j = jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net';
  try {
    await _sock.sendMessage(j, { text: message });
    res.json({ message: `✅ Envoyé à ${j}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/restart', authMiddleware, (req, res) => {
  res.json({ message: '🔄 Redémarrage en cours...' });
  setTimeout(() => process.exit(0), 500);
});

app.get('/api/users', authMiddleware, (req, res) => {
  const db   = require('../database/db');
  const data = db.getData();
  const users = Object.entries(data.users || {}).map(([jid, info]) => ({
    jid,
    lastSeen: info.lastSeen || null,
    isVip:    !!(data.vip || {})[jid],
    isBanned: !!(data.banned || {})[jid],
    coins:    (data.economy || {})[jid]?.coins || 0,
  }));
  res.json(users.slice(0, 200));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
function startWebServer(port = 3000) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n🌐 Dashboard: http://localhost:${port}`);
    console.log(`🔑 Mot de passe admin: ${process.env.ADMIN_PASSWORD || 'lucifer2024'}`);
    console.log(`📲 Entrez votre numéro sur le dashboard pour connecter le bot\n`);
  });
}

function setSocket(sock)       { _sock = sock; }
function setConnected(val)     { _connected = val; }
function setPairCodeFn(fn)     { _pairCodeFn = fn; }

module.exports = { startWebServer, setSocket, setConnected, setPairCodeFn };
