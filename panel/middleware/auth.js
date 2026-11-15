'use strict';
const jwt = require('jsonwebtoken');
const { Users } = require('../db/database');

const SECRET = String(process.env.JWT_SECRET || '');
if (SECRET.length < 32) {
  throw new Error('JWT_SECRET absent ou trop court : configurez au moins 32 caractères aléatoires dans .env.');
}

function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ error: 'Token manquant. Connectez-vous.' });
  try {
    const { userId } = jwt.verify(token, SECRET);
    const user = Users.get(userId);
    if (!user || !user.isActive) return res.status(401).json({ error: 'Session invalide ou compte désactivé.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré. Reconnectez-vous.' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    next();
  });
}

module.exports = { signToken, authMiddleware, adminMiddleware, SECRET };
