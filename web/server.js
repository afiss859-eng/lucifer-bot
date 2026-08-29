/**
 * 𓅂 DOMA LUCIFERO — Serveur Dashboard
 */
'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('../config/config');

const app = express();
let _sock = null;
let _connected = false;
let _pairFn = null;
let _getCodeFn = null;
let _pendingCode = null;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Set();
const TOK_FILE = path.join(__dirname, '..', 'database', 'admin_tokens.json');

function loadTokens() {
  try {
    const r = fs.readJsonSync(TOK_FILE);
    if (Array.isArray(r)) r.filter(t => typeof t === 'string' && t.length >= 32).forEach(t => sessions.add(t));
  } catch {}
}
function saveTokens() {
  try { fs.outputJsonSync(TOK_FILE, [...sessions], { spaces: 2 }); } catch {}
}
loadTokens();

function authMW(req, res, next) {
  const t = req.headers['x-admin-token'];
  if (!t || typeof t !== 'string' || !sessions.has(t)) return res.status(401).json({ error: 'Non autorisé.' });
  next();
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/api/login', (req, res) => {
  const pass = String(req.body.password || '').trim();
  const expect = process.env.ADMIN_PASSWORD || config.ADMIN_PASSWORD;
  if (!expect) return res.status(503).json({ error: 'ADMIN_PASSWORD non configuré côté serveur.' });
  const a = Buffer.from(pass);
  const b = Buffer.from(String(expect));
  if (!pass || a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(403).json({ error: 'Mot de passe incorrect.' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token);
  saveTokens();
  res.json({ token });
});

app.post('/api/logout', authMW, (req, res) => {
  sessions.delete(req.headers['x-admin-token']);
  saveTokens();
  res.json({ ok: true });
});

app.get('/api/status', (req, res) => res.json({
  connected: _connected,
  botReady: !!_sock,
  botName: config.BOT_NAME || 'LUCIFERO',
  version: config.VERSION || '2.0',
  owner: config.OWNER_NUMBER || '',
  phone: _sock?.user?.id?.split(':')[0] || null,
  phoneSet: !!(process.env.PHONE_NUMBER || process.env.BOT_PHONE),
  groqReady: !!process.env.GROQ_API_KEY,
  geminiReady: !!process.env.GEMINI_API_KEY,
}));

app.get('/api/paircode/poll', (req, res) => {
  const src = _pendingCode || (_getCodeFn ? _getCodeFn() : null);
  if (src?.code && src.time && Date.now() - src.time < 180000)
    return res.json({ fresh: true, code: src.code, formatted: src.formatted, phone: src.phone });
  res.json({ fresh: false });
});

app.post('/api/paircode', async (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  if (!phone || phone.length < 7) return res.status(400).json({ error: 'Numéro invalide.' });
  if (_connected) return res.status(400).json({ error: 'Bot déjà connecté!' });
  if (!_pairFn) return res.status(503).json({ error: 'Bot pas encore prêt. Réessayez dans quelques secondes.' });
  try {
    const code = await _pairFn(phone);
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
    _pendingCode = { code, formatted, phone, time: Date.now() };
    res.json({ code, formatted });
  } catch (e) { res.status(500).json({ error: e.message || 'Erreur inconnue' }); }
});

app.post('/api/clearsession', authMW, async (req, res) => {
  const dir = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');
  try { await fs.emptyDir(dir); _pendingCode = null; res.json({ message: 'Session vidée. Redémarrez le bot pour générer un nouveau code.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats', authMW, (req, res) => {
  let db; try { db = require('../database/db'); } catch {}
  const d = db?.getData?.() || {};
  res.json({
    totalUsers: Object.keys(d.users || {}).length,
    vipCount: Object.keys(d.vip || {}).length,
    bannedCount: Object.keys(d.banned || {}).length,
    groups: Object.keys(d.notes || {}).length,
    totalCoins: Object.values(d.economy || {}).reduce((a, u) => a + (Number(u?.coins) || 0), 0),
    uptime: Math.floor(process.uptime()), uptimeHuman: fmtUptime(process.uptime()),
    version: config.VERSION || '2.0', connected: _connected,
    botName: _sock?.user?.name || config.BOT_NAME || 'LUCIFERO',
    botNumber: _sock?.user?.id?.split(':')[0] || '—', owner: config.OWNER_NUMBER || '—',
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    groqReady: !!process.env.GROQ_API_KEY, geminiReady: !!process.env.GEMINI_API_KEY,
  });
});

app.get('/api/users', authMW, (req, res) => {
  let db; try { db = require('../database/db'); } catch {}
  const d = db?.getData?.() || {};
  res.json(Object.entries(d.users || {}).slice(0, 300).map(([jid, info]) => ({
    jid, lastSeen: info?.lastSeen || null,
    isVip: !!(d.vip || {})[jid], isBanned: !!(d.banned || {})[jid], coins: (d.economy || {})[jid]?.coins || 0,
  })));
});

app.get('/api/vip', authMW, (req, res) => { let db; try { db = require('../database/db'); } catch {} res.json(db?.getData?.()?.vip || {}); });
app.post('/api/vip/add', authMW, (req, res) => dbAction(res, db => db.addVip(jid(req)), 'VIP ajouté.'));
app.post('/api/vip/remove', authMW, (req, res) => dbAction(res, db => db.removeVip(jid(req)), 'VIP retiré.'));
app.get('/api/banned', authMW, (req, res) => { let db; try { db = require('../database/db'); } catch {} res.json(db?.getData?.()?.banned || {}); });
app.post('/api/banned/add', authMW, (req, res) => dbAction(res, db => db.banUser(jid(req), req.body.reason || 'Via dashboard'), 'Banni.'));
app.post('/api/banned/remove', authMW, (req, res) => dbAction(res, db => db.unbanUser(jid(req)), 'Débanni.'));

app.post('/api/broadcast', authMW, async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  let db; try { db = require('../database/db'); } catch { return res.status(500).json({ error: 'DB non disponible.' }); }
  const users = Object.keys(db.getData?.().users || {}).filter(u => /@s\.whatsapp\.net$/.test(u));
  let sent = 0, failed = 0;
  for (const u of users) {
    try { await _sock.sendMessage(u, { text: `📢 *DOMA LUCIFERO*\n\n${message}` }); sent++; }
    catch { failed++; }
    await delay(700);
  }
  res.json({ message: `Envoyé à ${sent} utilisateurs. Échecs: ${failed}.` });
});

app.post('/api/send', authMW, async (req, res) => {
  const target = toJid(req.body.jid || req.body.phone || '');
  const message = String(req.body.message || '').trim();
  if (!target || !message) return res.status(400).json({ error: 'JID et message requis.' });
  if (!_sock || !_connected) return res.status(503).json({ error: 'Bot non connecté.' });
  try { await _sock.sendMessage(target, { text: message }); res.json({ message: 'Message envoyé.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coins', authMW, (req, res) => {
  const j = jid(req), a = Number(req.body.amount);
  if (!j || !Number.isSafeInteger(a)) return res.status(400).json({ error: 'JID et montant entier requis.' });
  let db; try { db = require('../database/db'); } catch { return res.status(500).json({ error: 'DB non disponible.' }); }
  const balance = db.addCoins(j, a);
  res.json({ message: `Nouveau solde: ${balance} coins.` });
});

app.post('/api/restart', authMW, (req, res) => {
  res.json({ message: 'Redémarrage dans 1s...' });
  setTimeout(() => process.exit(0), 1000);
});

function jid(req) { return toJid(req.body.jid || req.body.phone || ''); }
function toJid(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d+@s\.whatsapp\.net$/.test(s)) return s;
  const clean = s.replace(/\D/g, '');
  return clean ? `${clean}@s.whatsapp.net` : null;
}
function fmtUptime(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60); return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function dbAction(res, fn, okMsg) {
  let db; try { db = require('../database/db'); } catch { return res.status(500).json({ error: 'DB non disponible.' }); }
  try { fn(db); res.json({ message: okMsg }); } catch (e) { res.status(500).json({ error: e.message }); }
}

function startWebServer(port = Number(process.env.PORT) || 3000) { app.listen(port, '0.0.0.0', () => console.log(`🌐 Dashboard: http://localhost:${port}`)); }
function setSocket(s) { _sock = s; }
function setConnected(v) { _connected = !!v; }
function setPairCodeFn(fn) { _pairFn = fn; }
function setGetLastCodeFn(fn) { _getCodeFn = fn; }
function setPendingCode(c) { _pendingCode = c; }
module.exports = { startWebServer, setSocket, setConnected, setPairCodeFn, setGetLastCodeFn, setPendingCode };
