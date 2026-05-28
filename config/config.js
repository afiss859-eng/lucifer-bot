require('dotenv').config();

module.exports = {
  BOT_NAME: process.env.BOT_NAME || '𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '584265781353',
  PREFIX: process.env.PREFIX || '.',
  SESSION_NAME: process.env.SESSION_NAME || 'lucifer-session',
  VERSION: '2.0.0',
  AUTHOR: 'afiss859-eng',
  TIMEZONE: process.env.TIMEZONE || 'America/Caracas',

  // Couleurs thème sombre
  THEME: {
    primary: '🔴',
    secondary: '⚫',
    vip: '👑',
    owner: '🔱',
    admin: '⚡',
    error: '❌',
    success: '✅',
    info: '🔵',
    warning: '⚠️',
  },

  // Anti-spam
  ANTI_SPAM_DELAY: 2000,
  MAX_WARN: 3,

  // Économie
  DAILY_COINS: 100,
  WORK_MIN: 50,
  WORK_MAX: 200,
};
