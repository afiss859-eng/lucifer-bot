/**
 * 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Dashboard Web
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs-extra');
const crypto  = require('crypto');
const config  = require('../config/config');

const app = express();
let _sock          = null;
let _connected     = false;
let _pairCodeFn    = null;
let _getLastCodeFn = null;
let _pendingCode   = null;   // Code poussé par index.js (pair code auto)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Sessions admin ────────────────────────────────────────────────────────────
const sessions = new Set();
const TOKEN_FILE = path.join(__dirname, '..', 'database', 'admin_tokens.json');
function loadTokens() { try { const r = fs.readJsonSync(TOKEN_FILE); Array.isArray(r) && r.forEach(t => sessions.add(t)); } catch {} }
function saveTokens() { fs.outputJsonSync(TOKEN_FILE, [...sessions]); }
loadTokens();

function auth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Non autorisé.' });
  next();
}

// ── Routes publiques ──────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || config.ADMIN_PASSWORD || 'lucifer2024'))
    return res.status(403).json({ error: 'Mot de passe incorrect.' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token); saveTokens();
  res.json({ token, message: 'Connexion réussie!' });
});

app.post('/api/logout', auth, (req, res) => {
  sessions.delete(req.headers['x-admin-token']); saveTokens();
  res.json({ message: 'Déconnecté.' });
});

app.get('/api/status', (req, res) => {
  res.json({
    connected:  _connected,
    botName:    config.BOT_NAME,
    version:    config.VERSION,
    owner:      config.OWNER_NUMBER,
    botReady:   !!_sock,
  });
});

// ── Pair Code (✅ NOUVEAU FLOW) ────────────────────────────────────────────────
app.post('/api/paircode', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Numéro requis.' });

  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 7) return res.status(400).json({
    error: 'Numéro invalide.',
    tip: 'Entrez l\'indicatif pays + numéro sans le + ni les zéros inutiles.\nEx France: 33612345678 | Côte d\'Ivoire: 2250102030405',
  });

  if (_connected) return res.status(400).json({ error: 'Bot déjà connecté.' });
  if (!_pairCodeFn) return res.status(503).json({
    error: 'Bot pas encore prêt.',
    tip: 'Attendez 20-30 secondes que le bot finisse de démarrer.',
  });

  try {
    const code = await _pairCodeFn(clean);
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
    _pendingCode = { code, formatted, time: Date.now() };
    res.json({ code, formatted, message: 'Code généré! Vérifiez votre WhatsApp (notification) ou entrez le code manuellement.' });
  } catch(e) {
    const msg = e.message || 'Erreur inconnue';
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('429'))
      return res.status(429).json({ error: 'Trop de tentatives. Attendez 2 minutes.', tip: 'WhatsApp limite les demandes de code.' });
    if (msg.includes('déjà connecté') || msg.includes('already'))
      return res.status(400).json({ error: msg, tip: 'Videz la session via le bouton du dashboard et redémarrez.' });
    res.status(500).json({ error: msg, tip: 'Si ça persiste, videz la session et redéployez.' });
  }
});

// ── Polling code (le dashboard vérifie si un code a été généré en auto) ────────
app.get('/api/paircode/poll', (req, res) => {
  const src = _pendingCode || (_getLastCodeFn ? _getLastCodeFn() : null);
  if (src && src.code && Date.now() - src.time < 120000) {
    res.json({ code: src.code, formatted: src.formatted || src.code, fresh: true });
  } else {
    res.json({ fresh: false });
  }
});

// ── Vider la session ──────────────────────────────────────────────────────────
app.post('/api/clearsession', auth, async (req, res) => {
  const sessionDir = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');
  try {
    await fs.emptyDir(sessionDir);
    res.json({ message: '✅ Session vidée. Redémarrez le service sur Render pour reconnecter.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes admin (protégées) ──────────────────────────────────────────────────
app.get('/api/stats', auth, (req, res) => {
  const db = require('../database/db'), d = db.getData();
  res.json({
    totalUsers:  Object.keys(d.users   || {}).length,
    vipCount:    Object.keys(d.vip     || {}).length,
    bannedCount: Object.keys(d.banned  || {}).length,
    groups:      Object.keys(d.notes   || {}).length,
    totalCoins:  Object.values(d.economy || {}).reduce((a, u) => a + (u.coins || 0), 0),
    uptime:      Math.floor(process.uptime()),
    uptimeHuman: fmtUptime(process.uptime()),
    version:     config.VERSION,
    commands:    '700+',
    connected:   _connected,
    botName:     _sock?.user?.name || config.BOT_NAME,
    botNumber:   _sock?.user?.id?.split(':')[0] || 'Non connecté',
    memoryMB:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

app.get('/api/users', auth, (req, res) => {
  const db = require('../database/db'), d = db.getData();
  res.json(Object.entries(d.users || {}).slice(0, 200).map(([jid, info]) => ({
    jid, lastSeen: info.lastSeen || null,
    isVip: !!(d.vip || {})[jid], isBanned: !!(d.banned || {})[jid],
    coins: (d.economy || {})[jid]?.coins || 0,
  })));
});

app.get('/api/vip', auth, (req, res) => res.json(require('../database/db').getData().vip || {}));
app.post('/api/vip/add', auth, (req, res) => {
  const db = require('../database/db'), j = norm(req.body.jid);
  if (!j) return res.status(400).json({ error: 'JID requis.' });
  db.addVip(j); res.json({ message: '✅ VIP: ' + j });
});
app.post('/api/vip/remove', auth, (req, res) => {
  const db = require('../database/db'), j = norm(req.body.jid);
  if (!j) return res.status(400).json({ error: 'JID requis.' });
  db.removeVip(j); res.json({ message: '✅ Retiré: ' + j });
});

app.get('/api/banned', auth, (req, res) => res.json(require('../database/db').getData().banned || {}));
app.post('/api/banned/add', auth, (req, res) => {
  const db = require('../database/db'), j = norm(req.body.jid);
  if (!j) return res.status(400).json({ error: 'JID requis.' });
  db.banUser(j, req.body.reason || 'Via panel'); res.json({ message: '🚫 Banni: ' + j });
});
app.post('/api/banned/remove', auth, (req, res) => {
  const db = require('../database/db'), j = norm(req.body.jid);
  if (!j) return res.status(400).json({ error: 'JID requis.' });
  db.unbanUser(j); res.json({ message: '✅ Débanni: ' + j });
});

app.post('/api/broadcast', auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  const users = Object.keys(require('../database/db').getData().users || {});
  let sent = 0, failed = 0;
  for (const jid of users) {
    try { await _sock.sendMessage(jid, { text: `📢 *Annonce LUCIFERO*\n\n${message}` }); sent++; await new Promise(r => setTimeout(r, 800)); }
    catch { failed++; }
  }
  res.json({ message: `📢 ${sent} envoyés, ${failed} échecs.` });
});

app.post('/api/send', auth, async (req, res) => {
  const { jid, message } = req.body;
  if (!jid || !message) return res.status(400).json({ error: 'JID et message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  try { await _sock.sendMessage(norm(jid), { text: message }); res.json({ message: '✅ Envoyé' }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coins', auth, (req, res) => {
  const db = require('../database/db'), j = norm(req.body.jid), a = parseInt(req.body.amount);
  if (!j || isNaN(a)) return res.status(400).json({ error: 'JID et montant requis.' });
  res.json({ message: `💰 Solde: ${db.addCoins(j, a)}` });
});

app.post('/api/restart', auth, (req, res) => {
  res.json({ message: '🔄 Redémarrage...' });
  setTimeout(() => process.exit(0), 500);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function norm(jid) { if (!jid) return null; return jid.includes('@') ? jid : jid.replace(/\D/g,'') + '@s.whatsapp.net'; }
function fmtUptime(s) { return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${Math.floor(s%60)}s`; }

// ── Exports ───────────────────────────────────────────────────────────────────
function startWebServer(port = 3000) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n🌐 Dashboard: http://localhost:${port}`);
    console.log(`🔑 Mot de passe: ${process.env.ADMIN_PASSWORD || 'lucifer2024'}\n`);
  });
}
function setSocket(s)        { _sock = s; }
function setConnected(v)     { _connected = v; }
function setPairCodeFn(fn)   { _pairCodeFn = fn; }
function setGetLastCodeFn(fn){ _getLastCodeFn = fn; }
function setPendingCode(c)   { _pendingCode = { code: c, formatted: c.match(/.{1,4}/g)?.join('-') || c, time: Date.now() }; }

module.exports = { startWebServer, setSocket, setConnected, setPairCodeFn, setGetLastCodeFn, setPendingCode };
