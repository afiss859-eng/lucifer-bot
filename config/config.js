require('dotenv').config();

const ownerNumber = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
const adminPassword = process.env.ADMIN_PASSWORD || process.env.PANEL_PASSWORD || '';

module.exports = {
  BOT_NAME: process.env.BOT_NAME || '𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  OWNER_NUMBER: ownerNumber,
  PREFIX: process.env.PREFIX || '.',
  SESSION_NAME: process.env.SESSION_NAME || 'lucifer-session',
  ADMIN_PASSWORD: adminPassword,
  VERSION: '2.1.0',
  AUTHOR: 'afiss859-eng',
  TIMEZONE: process.env.TIMEZONE || 'Africa/Ouagadougou',

  THEME: {
    primary: '🔴', secondary: '⚫', vip: '👑', owner: '🔱', admin: '⚡',
    error: '❌', success: '✅', info: '🔵', warning: '⚠️',
  },

  ANTI_SPAM_DELAY: 2000,
  MAX_WARN: 3,
  DAILY_COINS: 100,
  WORK_MIN: 50,
  WORK_MAX: 200,
};