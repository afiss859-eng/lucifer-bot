'use strict';
const router = require('express').Router();
const { adminMiddleware } = require('../middleware/auth');
const { Users, Bots, Payments, Tickets, Settings, PLANS } = require('../db/database');
const bcrypt = require('bcryptjs');

router.use(adminMiddleware);

// ── Stats globales ────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  res.json({
    users:       Users.count(),
    bots:        Bots.count(),
    botsRunning: Bots.countRunning(),
    payments:    Payments.count(),
    revenue:     Payments.revenue(),
    tickets:     Tickets.countOpen(),
    uptime:      Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform:    process.platform,
  });
});

// ── Tous les utilisateurs ─────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const all = Users.getAll();
  const safe = Object.values(all).map(({ passwordHash, ...u }) => u);
  res.json(safe);
});

// ── Détails utilisateur ───────────────────────────────────────────────────────
router.get('/users/:id', (req, res) => {
  const user = Users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  const { passwordHash, ...safe } = user;
  const bots = Bots.getByOwner(req.params.id);
  const payments = Payments.getByUser(req.params.id);
  const tickets  = Tickets.getByUser(req.params.id);
  res.json({ user: safe, bots, payments, tickets });
});

// ── Modifier plan d'un utilisateur ────────────────────────────────────────────
router.patch('/users/:id/plan', (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: `Plan invalide. Options: ${Object.keys(PLANS).join(', ')}` });
  const maxBots = PLANS[plan].maxBots;
  const user = Users.update(req.params.id, { plan, maxBots });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  res.json({ message: `Plan mis à jour: ${plan}`, user });
});

// ── Activer / Désactiver un compte ────────────────────────────────────────────
router.patch('/users/:id/toggle', (req, res) => {
  const user = Users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Introuvable.' });
  if (user.isAdmin) return res.status(403).json({ error: 'Impossible de désactiver un admin.' });
  Users.update(req.params.id, { isActive: !user.isActive });
  res.json({ message: `Compte ${user.isActive ? 'désactivé' : 'réactivé'}.` });
});

// ── Donner / Retirer droits admin ─────────────────────────────────────────────
router.patch('/users/:id/admin', (req, res) => {
  const { isAdmin } = req.body;
  Users.update(req.params.id, { isAdmin: !!isAdmin });
  res.json({ message: `Droits admin ${isAdmin ? 'accordés' : 'retirés'}.` });
});

// ── Réinitialiser mot de passe ────────────────────────────────────────────────
router.patch('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Minimum 6 caractères.' });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  Users.update(req.params.id, { passwordHash });
  res.json({ message: 'Mot de passe réinitialisé.' });
});

// ── Supprimer utilisateur ─────────────────────────────────────────────────────
router.delete('/users/:id', (req, res) => {
  const user = Users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Introuvable.' });
  if (user.isAdmin) return res.status(403).json({ error: 'Impossible de supprimer un admin.' });
  Bots.getByOwner(req.params.id).forEach(b => Bots.delete(b.id));
  Users.delete(req.params.id);
  res.json({ message: 'Utilisateur supprimé.' });
});

// ── Tous les bots (toutes plateformes) ───────────────────────────────────────
router.get('/bots', (req, res) => {
  const allBots = Object.values(Bots.getAll());
  const allUsers = Users.getAll();
  res.json(allBots.map(b => ({ ...b, ownerName: allUsers[b.userId]?.name || 'Inconnu' })));
});

// ── Tous les paiements ────────────────────────────────────────────────────────
router.get('/payments', (req, res) => {
  const all = Payments.getAll();
  const users = Users.getAll();
  res.json(all.map(p => ({ ...p, userName: users[p.userId]?.name || 'Inconnu' })));
});

// ── Confirmer un paiement ─────────────────────────────────────────────────────
router.post('/payments/:id/confirm', (req, res) => {
  const payment = Payments.confirm(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Paiement introuvable.' });
  // Upgrade user plan
  Users.update(payment.userId, { plan: payment.plan, maxBots: PLANS[payment.plan]?.maxBots || 1 });
  res.json({ message: `Paiement confirmé. Plan ${payment.plan} activé.`, payment });
});

// ── Paramètres globaux ────────────────────────────────────────────────────────
router.get('/settings', (req, res) => res.json(Settings.get()));
router.patch('/settings', (req, res) => { Settings.update(req.body); res.json(Settings.get()); });

// ── Broadcast WhatsApp bot ────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  // This would integrate with the running bot instance
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis.' });
  res.json({ message: 'Broadcast mis en file d\'attente.', note: 'Le bot doit être connecté.' });
});

// ── Tickets support ───────────────────────────────────────────────────────────
router.get('/tickets', (req, res) => res.json(Tickets.getAll()));

module.exports = router;
