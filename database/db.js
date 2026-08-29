const fs = require('fs-extra');
const path = require('path');

const DB_DIR = path.join(__dirname);

function loadDB(name) {
  const file = path.join(DB_DIR, `${name}.json`);
  if (!fs.existsSync(file)) fs.writeJsonSync(file, {});
  try {
    return fs.readJsonSync(file);
  } catch {
    fs.writeJsonSync(file, {});
    return {};
  }
}

function saveDB(name, data) {
  const file = path.join(DB_DIR, `${name}.json`);
  fs.writeJsonSync(file, data, { spaces: 2 });
}

// ─── USERS ─────────────────────────────────────────────
function touchUser(jid) {
  if (!jid) return;
  const db = loadDB('users');
  if (!db[jid]) db[jid] = { firstSeen: Date.now() };
  db[jid].lastSeen = Date.now();
  saveDB('users', db);
}

// Retourne une vue compatible avec le dashboard.
function getData() {
  return {
    users: loadDB('users'),
    vip: loadDB('vip'),
    banned: loadDB('banned'),
    warn: loadDB('warn'),
    economy: loadDB('economy'),
    notes: loadDB('notes'),
  };
}

// ─── VIP ───────────────────────────────────────────────
function isVip(jid) {
  return !!loadDB('vip')[jid];
}
function addVip(jid) {
  const db = loadDB('vip');
  db[jid] = { addedAt: Date.now() };
  saveDB('vip', db);
}
function removeVip(jid) {
  const db = loadDB('vip');
  delete db[jid];
  saveDB('vip', db);
}
function listVip() {
  return Object.keys(loadDB('vip'));
}

// ─── BANNED ────────────────────────────────────────────
function isBanned(jid) {
  return !!loadDB('banned')[jid];
}
function banUser(jid, reason = 'Aucune raison') {
  const db = loadDB('banned');
  db[jid] = { reason, bannedAt: Date.now() };
  saveDB('banned', db);
}
function unbanUser(jid) {
  const db = loadDB('banned');
  delete db[jid];
  saveDB('banned', db);
}

// ─── WARN ──────────────────────────────────────────────
function getWarns(jid) {
  return loadDB('warn')[jid] || 0;
}
function addWarn(jid) {
  const db = loadDB('warn');
  db[jid] = (db[jid] || 0) + 1;
  saveDB('warn', db);
  return db[jid];
}
function resetWarn(jid) {
  const db = loadDB('warn');
  db[jid] = 0;
  saveDB('warn', db);
}

// ─── ÉCONOMIE ──────────────────────────────────────────
function getCoins(jid) {
  return loadDB('economy')[jid]?.coins || 0;
}
function addCoins(jid, amount) {
  const db = loadDB('economy');
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, lastWork: 0 };
  db[jid].coins += Number(amount) || 0;
  saveDB('economy', db);
  return db[jid].coins;
}
function removeCoins(jid, amount) {
  const db = loadDB('economy');
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, lastWork: 0 };
  db[jid].coins = Math.max(0, db[jid].coins - (Number(amount) || 0));
  saveDB('economy', db);
  return db[jid].coins;
}
function getLastDaily(jid) {
  return loadDB('economy')[jid]?.lastDaily || 0;
}
function setLastDaily(jid) {
  const db = loadDB('economy');
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, lastWork: 0 };
  db[jid].lastDaily = Date.now();
  saveDB('economy', db);
}
function getLastWork(jid) {
  return loadDB('economy')[jid]?.lastWork || 0;
}
function setLastWork(jid) {
  const db = loadDB('economy');
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, lastWork: 0 };
  db[jid].lastWork = Date.now();
  saveDB('economy', db);
}
function getRichList() {
  return Object.entries(loadDB('economy'))
    .map(([jid, d]) => ({ jid, coins: d.coins || 0 }))
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10);
}

// ─── NOTES ─────────────────────────────────────────────
function saveNote(chat, name, content) {
  const db = loadDB('notes');
  if (!db[chat]) db[chat] = {};
  db[chat][name] = content;
  saveDB('notes', db);
}
function getNote(chat, name) {
  return loadDB('notes')[chat]?.[name] || null;
}
function deleteNote(chat, name) {
  const db = loadDB('notes');
  if (db[chat]) delete db[chat][name];
  saveDB('notes', db);
}
function listNotes(chat) {
  return Object.keys(loadDB('notes')[chat] || {});
}

module.exports = {
  touchUser, getData,
  isVip, addVip, removeVip, listVip,
  isBanned, banUser, unbanUser,
  getWarns, addWarn, resetWarn,
  getCoins, addCoins, removeCoins,
  getLastDaily, setLastDaily, getLastWork, setLastWork, getRichList,
  saveNote, getNote, deleteNote, listNotes,
};
