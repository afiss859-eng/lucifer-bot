'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Payments, PLANS } = require('../db/database');

router.use(authMiddleware);

// GET /api/payments/plans — afficher les plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// GET /api/payments — historique client
router.get('/', (req, res) => {
  res.json(Payments.getByUser(req.user.id));
});

// POST /api/payments — créer une demande de paiement
router.post('/', (req, res) => {
  const { plan, method, reference } = req.body;
  if (!plan || !PLANS[plan]) return res.status(400).json({ error: `Plan invalide. Options: ${Object.keys(PLANS).join(', ')}` });
  if (plan === 'free') return res.status(400).json({ error: 'Le plan gratuit est activé automatiquement.' });
  if (!method) return res.status(400).json({ error: 'Méthode de paiement requise (paypal, mtn, orange, wave, crypto).' });

  const amount = PLANS[plan].price;
  const payment = Payments.create({ userId: req.user.id, plan, amount, method, reference: reference || '' });

  const instructions = {
    paypal:  { info: `Envoyez ${amount}$ via PayPal`, detail: `Email PayPal: ${process.env.PAYPAL_EMAIL || 'contact@lucifero.bot'}`, note: 'Mentionnez votre email + plan dans la note' },
    mtn:     { info: `Envoyez ${amount}$ via MTN Money`, detail: `Numéro: ${process.env.MTN_NUMBER || '+237600000000'}`, note: `Référence: ${payment.id}` },
    orange:  { info: `Envoyez ${amount}$ via Orange Money`, detail: `Numéro: ${process.env.ORANGE_NUMBER || '+237600000000'}`, note: `Référence: ${payment.id}` },
    wave:    { info: `Envoyez ${amount}$ via Wave`, detail: `Numéro: ${process.env.WAVE_NUMBER || '+237600000000'}`, note: `Référence: ${payment.id}` },
    crypto:  { info: `Envoyez ${amount}$ USDT (TRC20)`, detail: `Adresse: ${process.env.CRYPTO_ADDRESS || 'TRC20_ADDRESS'}`, note: `Référence: ${payment.id}` },
  };

  res.status(201).json({
    payment,
    instructions: instructions[method] || { info: `Montant: ${amount}$`, note: `Référence: ${payment.id}` },
    message: 'Paiement créé. Envoyez la preuve à l\'admin pour confirmation.',
    whatsapp: `wa.me/${process.env.OWNER_NUMBER || '584265781353'}?text=Paiement ${payment.id} - Plan ${plan}`,
  });
});

module.exports = router;
