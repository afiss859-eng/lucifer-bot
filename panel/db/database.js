'use strict';
/**
 * Panel Database — JSON-based, zero external DB dependency
 * Stores: users, bots, plans, payments, tickets, sessions
 */
const fs   = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data');
const FILES = {
  users:    path.join(DB_PATH, 'users.json'),
  bots:     path.join(DB_PATH, 'bots.json'),
  payments: path.join(DB_PATH, 'payments.json'),
  tickets:  path.join(DB_PATH, 'tickets.json'),
  settings: path.join(DB_PATH, 'settings.json'),
};

// Ensure data dir + files exist
fs.ensureDirSync(DB_PATH);
for (const [key, file] of Object.entries(FILES)) {
  if (!fs.existsSync(file)) {
    const defaults = {
      users:    {},
      bots:     {},
      payments: [],
      tickets:  [],
      settings: { maintenanceMode: false, registrationOpen: true, announcementBanner: '' },
    };
    fs.outputJsonSync(file, defaults[key], { spaces: 2 });
  }
}

function read(key)        { return fs.readJsonSync(FILES[key]); }
function write(key, data) { fs.outputJsonSync(FILES[key], data, { spaces: 2 }); }
function uid()            { return crypto.randomBytes(10).toString('hex'); }
function now()            { return new Date().toISOString(); }

// ─── USERS ────────────────────────────────────────────────────────────────────
const Users = {
  getAll()           { return read('users'); },
  get(id)            { return read('users')[id] || null; },
  getByEmail(email)  {
    const all = read('users');
    return Object.values(all).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  create({ name, email, passwordHash, plan = 'free' }) {
    const all = read('users');
    const id  = uid();
    const user = { id, name, email, passwordHash, plan, maxBots: 1, isAdmin: false, isActive: true, createdAt: now(), lastLogin: null, botIds: [] };
    all[id] = user;
    write('users', all);
    return user;
  },
  update(id, patch) {
    const all = read('users');
    if (!all[id]) return null;
    all[id] = { ...all[id], ...patch, updatedAt: now() };
    write('users', all);
    return all[id];
  },
  delete(id) {
    const all = read('users');
    delete all[id];
    write('users', all);
  },
  count() { return Object.keys(read('users')).length; },
  // Admin seeder
  ensureAdmin() {
    const all = read('users');
    const hasAdmin = Object.values(all).some(u => u.isAdmin);
    if (!hasAdmin) {
      const bcrypt = require('bcryptjs');
      const id = 'admin-' + uid();
      const adminPass = process.env.ADMIN_PASSWORD || 'lucifer2024';
      all[id] = {
        id, name: 'Super Admin', email: process.env.ADMIN_EMAIL || 'admin@lucifero.bot',
        passwordHash: bcrypt.hashSync(adminPass, 10),
        plan: 'owner', maxBots: 999, isAdmin: true, isActive: true,
        createdAt: now(), lastLogin: null, botIds: [],
      };
      write('users', all);
      console.log(`👑 Compte admin créé — Email: ${all[id].email} | Pass: ${adminPass}`);
    }
  },
};

// ─── BOTS ─────────────────────────────────────────────────────────────────────
const Bots = {
  getAll()          { return read('bots'); },
  get(id)           { return read('bots')[id] || null; },
  getByOwner(userId){ return Object.values(read('bots')).filter(b => b.userId === userId); },
  create({ userId, name, phone, prefix = '.', ownerNumber, sessionName }) {
    const all = read('bots');
    const id  = uid();
    const bot = {
      id, userId, name, phone, prefix, ownerNumber,
      sessionName: sessionName || `session-${id}`,
      status: 'stopped', connectedAt: null, qrCode: null, pairCode: null,
      commands: '684+', plan: 'free', createdAt: now(),
    };
    all[id] = bot;
    write('bots', all);
    return bot;
  },
  update(id, patch) {
    const all = read('bots');
    if (!all[id]) return null;
    all[id] = { ...all[id], ...patch };
    write('bots', all);
    return all[id];
  },
  delete(id) {
    const all = read('bots');
    delete all[id];
    write('bots', all);
  },
  count()        { return Object.keys(read('bots')).length; },
  countRunning() { return Object.values(read('bots')).filter(b => b.status === 'running').length; },
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
const PLANS = {
  free:    { name: '🆓 Gratuit',   price: 0,    maxBots: 1,  features: ['1 bot', '684+ commandes', 'Support communauté'] },
  basic:   { name: '⚡ Basic',     price: 5,    maxBots: 2,  features: ['2 bots', 'IA Groq/Gemini', 'Support prioritaire'] },
  vip:     { name: '👑 VIP',       price: 15,   maxBots: 5,  features: ['5 bots', 'Toutes fonctions VIP', 'Canal officiel', 'Support direct'] },
  premium: { name: '💎 Premium',   price: 30,   maxBots: 20, features: ['20 bots', 'Dashboard avancé', 'API accès', 'Support 24/7'] },
};

const Payments = {
  getAll()         { return read('payments'); },
  getByUser(userId){ return read('payments').filter(p => p.userId === userId); },
  create({ userId, plan, amount, method, reference }) {
    const all = read('payments');
    const payment = { id: uid(), userId, plan, amount, method, reference, status: 'pending', createdAt: now() };
    all.push(payment);
    write('payments', all);
    return payment;
  },
  confirm(id) {
    const all = read('payments');
    const p = all.find(x => x.id === id);
    if (p) { p.status = 'confirmed'; p.confirmedAt = now(); write('payments', all); }
    return p;
  },
  count() { return read('payments').length; },
  revenue() { return read('payments').filter(p => p.status === 'confirmed').reduce((a,p) => a + (p.amount||0), 0); },
};

// ─── TICKETS ──────────────────────────────────────────────────────────────────
const Tickets = {
  getAll()          { return read('tickets'); },
  getByUser(userId) { return read('tickets').filter(t => t.userId === userId); },
  create({ userId, userName, subject, message, priority = 'normal' }) {
    const all = read('tickets');
    const ticket = { id: uid(), userId, userName, subject, message, priority, status: 'open', reply: null, createdAt: now(), repliedAt: null };
    all.push(ticket);
    write('tickets', all);
    return ticket;
  },
  reply(id, reply) {
    const all = read('tickets');
    const t = all.find(x => x.id === id);
    if (t) { t.reply = reply; t.status = 'closed'; t.repliedAt = now(); write('tickets', all); }
    return t;
  },
  countOpen() { return read('tickets').filter(t => t.status === 'open').length; },
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const Settings = {
  get()         { return read('settings'); },
  update(patch) { const s = read('settings'); write('settings', { ...s, ...patch }); },
};

module.exports = { Users, Bots, Payments, Tickets, Settings, PLANS, uid, now };
