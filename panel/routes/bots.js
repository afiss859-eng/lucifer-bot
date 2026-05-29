'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Users, Bots, PLANS } = require('../db/database');

router.use(authMiddleware);

// GET /api/bots — liste des bots du client
router.get('/', (req, res) => {
  const bots = Bots.getByOwner(req.user.id);
  res.json(bots);
});

// POST /api/bots — créer un bot
router.post('/', (req, res) => {
  const user = req.user;
  const userBots = Bots.getByOwner(user.id);
  const maxBots = PLANS[user.plan]?.maxBots || 1;
  if (userBots.length >= maxBots) {
    return res.status(403).json({
      error: `Plan ${user.plan} limité à ${maxBots} bot(s). Passez à un plan supérieur.`,
      upgrade: true,
    });
  }
  const { name, phone, prefix, ownerNumber } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nom et numéro requis.' });
  const bot = Bots.create({ userId: user.id, name, phone, prefix: prefix || '.', ownerNumber: ownerNumber || phone });
  Users.update(user.id, { botIds: [...(user.botIds || []), bot.id] });
  res.status(201).json(bot);
});

// GET /api/bots/:id
router.get('/:id', (req, res) => {
  const bot = Bots.get(req.params.id);
  if (!bot || bot.userId !== req.user.id) return res.status(404).json({ error: 'Bot introuvable.' });
  res.json(bot);
});

// PATCH /api/bots/:id — modifier config
router.patch('/:id', (req, res) => {
  const bot = Bots.get(req.params.id);
  if (!bot || bot.userId !== req.user.id) return res.status(404).json({ error: 'Bot introuvable.' });
  const allowed = ['name', 'prefix', 'ownerNumber'];
  const patch = {};
  for (const k of allowed) { if (req.body[k] !== undefined) patch[k] = req.body[k]; }
  const updated = Bots.update(req.params.id, patch);
  res.json(updated);
});

// DELETE /api/bots/:id
router.delete('/:id', (req, res) => {
  const bot = Bots.get(req.params.id);
  if (!bot || bot.userId !== req.user.id) return res.status(404).json({ error: 'Bot introuvable.' });
  Bots.delete(req.params.id);
  res.json({ message: 'Bot supprimé.' });
});

// POST /api/bots/:id/connect — générer QR / pair code
router.post('/:id/connect', async (req, res) => {
  const bot = Bots.get(req.params.id);
  if (!bot || bot.userId !== req.user.id) return res.status(404).json({ error: 'Bot introuvable.' });

  const { method, phone } = req.body; // method: 'qr' | 'paircode'
  Bots.update(bot.id, { status: 'connecting', qrCode: null, pairCode: null });

  // On indique au client qu'il doit lancer le bot localement avec la méthode choisie
  res.json({
    message: method === 'paircode'
      ? `Lancez le bot avec: npm start\nEntrez le numéro ${phone || bot.phone} dans le dashboard pour recevoir le code.`
      : 'Lancez le bot avec: npm start\nLe QR code apparaîtra sur le dashboard.',
    instructions: {
      step1: 'Ouvrez votre terminal (Termux ou VPS)',
      step2: 'Allez dans le dossier: cd lucifer-bot',
      step3: 'Lancez: npm start',
      step4: method === 'paircode'
        ? `Dans le dashboard, cliquez "Générer Code" avec le numéro ${phone || bot.phone}`
        : 'Scannez le QR code qui apparaît dans le dashboard',
    },
  });
});

module.exports = router;
