const fs = require('fs-extra');
const path = require('path');

const DB_DIR = __dirname;
const cache = new Map();

function loadDB(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(DB_DIR, `${name}.json`);
  if (!fs.existsSync(file)) fs.writeJsonSync(file, {});
  let data;
  try { data = fs.readJsonSync(file); } catch { data = {}; fs.writeJsonSync(file, {}); }
  cache.set(name, data && typeof data === 'object' ? data : {});
  return cache.get(name);
}

function saveDB(name, data) {
  const normalized = data && typeof data === 'object' ? data : {};
  cache.set(name, normalized);
  const file = path.join(DB_DIR, `${name}.json`);
  const tmp = `${file}.tmp`;
  fs.writeJsonSync(tmp, normalized, { spaces: 2 });
  fs.moveSync(tmp, file, { overwrite: true });
}

function touchUser(jid) {
  if (!jid) return;
  const data = loadDB('users');
  if (!data[jid]) data[jid] = { firstSeen: Date.now() };
  data[jid].lastSeen = Date.now();
  // Do not rewrite users.json on every message; flush periodically.
  scheduleUsersFlush();
}

let usersFlushTimer = null;
function scheduleUsersFlush() {
  if (usersFlushTimer) return;
  usersFlushTimer = setTimeout(() => {
    usersFlushTimer = null;
    const data = cache.get('users');
    if (!data) return;
    try { saveDB('users', data); } catch (_) {}
  }, 1000);
  usersFlushTimer.unref?.();
}

function getData() {
  return { users: loadDB('users'), vip: loadDB('vip'), banned: loadDB('banned'), warn: loadDB('warn'), economy: loadDB('economy'), notes: loadDB('notes') };
}

function isVip(jid) { return !!loadDB('vip')[jid]; }
function addVip(jid) { const d = loadDB('vip'); d[jid] = { addedAt: Date.now() }; saveDB('vip', d); }
function removeVip(jid) { const d = loadDB('vip'); delete d[jid]; saveDB('vip', d); }
function listVip() { return Object.keys(loadDB('vip')); }

function isBanned(jid) { return !!loadDB('banned')[jid]; }
function banUser(jid, reason = 'Aucune raison') { const d = loadDB('banned'); d[jid] = { reason, bannedAt: Date.now() }; saveDB('banned', d); }
function unbanUser(jid) { const d = loadDB('banned'); delete d[jid]; saveDB('banned', d); }

function getWarns(jid) { return loadDB('warn')[jid] || 0; }
function addWarn(jid) { const d = loadDB('warn'); d[jid] = (d[jid] || 0) + 1; saveDB('warn', d); return d[jid]; }
function resetWarn(jid) { const d = loadDB('warn'); d[jid] = 0; saveDB('warn', d); }

function getCoins(jid) { return loadDB('economy')[jid]?.coins || 0; }
function addCoins(jid, amount) { const d = loadDB('economy'); if (!d[jid]) d[jid] = { coins: 0, lastDaily: 0, lastWork: 0 }; d[jid].coins += Number(amount) || 0; saveDB('economy', d); return d[jid].coins; }
function removeCoins(jid, amount) { const d = loadDB('economy'); if (!d[jid]) d[jid] = { coins: 0, lastDaily: 0, lastWork: 0 }; d[jid].coins = Math.max(0, d[jid].coins - (Number(amount) || 0)); saveDB('economy', d); return d[jid].coins; }
function getLastDaily(jid) { return loadDB('economy')[jid]?.lastDaily || 0; }
function setLastDaily(jid) { const d = loadDB('economy'); if (!d[jid]) d[jid] = { coins: 0, lastDaily: 0, lastWork: 0 }; d[jid].lastDaily = Date.now(); saveDB('economy', d); }
function getLastWork(jid) { return loadDB('economy')[jid]?.lastWork || 0; }
function setLastWork(jid) { const d = loadDB('economy'); if (!d[jid]) d[jid] = { coins: 0, lastDaily: 0, lastWork: 0 }; d[jid].lastWork = Date.now(); saveDB('economy', d); }
function getRichList() { return Object.entries(loadDB('economy')).map(([jid, d]) => ({ jid, coins: d.coins || 0 })).sort((a, b) => b.coins - a.coins).slice(0, 10); }

function saveNote(chat, name, content) { const d = loadDB('notes'); if (!d[chat]) d[chat] = {}; d[chat][name] = content; saveDB('notes', d); }
function getNote(chat, name) { return loadDB('notes')[chat]?.[name] || null; }
function deleteNote(chat, name) { const d = loadDB('notes'); if (d[chat]) delete d[chat][name]; saveDB('notes', d); }
function listNotes(chat) { return Object.keys(loadDB('notes')[chat] || {}); }

module.exports = { touchUser, getData, isVip, addVip, removeVip, listVip, isBanned, banUser, unbanUser, getWarns, addWarn, resetWarn, getCoins, addCoins, removeCoins, getLastDaily, setLastDaily, getLastWork, setLastWork, getRichList, saveNote, getNote, deleteNote, listNotes };
