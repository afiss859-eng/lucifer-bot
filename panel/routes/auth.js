'use strict';
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { Users } = require('../db/database');
const { signToken } = require('../middleware/auth');
const { Settings } = require('../db/database');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const settings = Settings.get();
    if (!settings.registrationOpen) return res.status(403).json({ error: 'Les inscriptions sont fermées.' });
    if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe: minimum 6 caractères.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide.' });
    if (Users.getByEmail(email)) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = Users.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });
    const token = signToken(user.id);
    res.status(201).json({ token, user: safeUser(user), message: 'Compte créé avec succès!' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur. Réessayez.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });
    const user = Users.getByEmail(email);
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    if (!user.isActive) return res.status(403).json({ error: 'Compte désactivé. Contactez le support.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    Users.update(user.id, { lastLogin: new Date().toISOString() });
    const token = signToken(user.id);
    res.json({ token, user: safeUser(user), message: 'Connexion réussie!' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur. Réessayez.' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Nouveau mot de passe: minimum 6 caractères.' });
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    Users.update(req.user.id, { passwordHash });
    res.json({ message: 'Mot de passe modifié avec succès!' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

function safeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

module.exports = router;
