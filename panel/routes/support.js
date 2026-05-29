'use strict';
const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Tickets } = require('../db/database');

// ── CLIENT: Ouvrir un ticket ──────────────────────────────────────────────────
router.post('/', authMiddleware, (req, res) => {
  const { subject, message, priority } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Sujet et message requis.' });
  const ticket = Tickets.create({
    userId:   req.user.id,
    userName: req.user.name,
    subject, message,
    priority: priority || 'normal',
  });
  res.status(201).json(ticket);
});

// ── CLIENT: Mes tickets ───────────────────────────────────────────────────────
router.get('/mine', authMiddleware, (req, res) => {
  res.json(Tickets.getByUser(req.user.id));
});

// ── ADMIN: Tous les tickets ───────────────────────────────────────────────────
router.get('/', adminMiddleware, (req, res) => {
  res.json(Tickets.getAll());
});

// ── ADMIN: Répondre à un ticket ───────────────────────────────────────────────
router.post('/:id/reply', adminMiddleware, (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ error: 'Réponse requise.' });
  const ticket = Tickets.reply(req.params.id, reply);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable.' });
  res.json(ticket);
});

module.exports = router;
