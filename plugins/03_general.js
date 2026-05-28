const config = require('../config/config');
const os = require('os');
const { msToTime } = require('../src/utils');

module.exports = {
  commands: ['ping','info','owner','heure','version','uptime','runtime','speed'],
  description: 'Commandes générales',
  execute: async ({ sock, m, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    switch (cmd) {
      case 'ping': {
        const t = Date.now();
        await sock.sendMessage(m.chat, { text: '🏓 Calcul...' }, { quoted: m });
        await m.reply(`🏓 *Pong!*\n⚡ Latence: *${Date.now()-t}ms*`);
        break;
      }
      case 'speed': {
        const start = Date.now();
        await sock.sendMessage(m.chat, { text: '⚡ Test de vitesse...' }, { quoted: m });
        const latency = Date.now() - start;
        await m.reply(`⚡ *Speed Test*\n\n🏓 Latence: *${latency}ms*\n📡 Statut: *${latency < 300 ? 'Excellent' : latency < 600 ? 'Bon' : 'Lent'}*`);
        break;
      }
      case 'info': {
        const up = process.uptime();
        const h = Math.floor(up/3600), mn = Math.floor((up%3600)/60), s = Math.floor(up%60);
        await m.reply(`╔══════════════════╗
║  *${cfg.BOT_NAME}*
╠══════════════════╣
║ 📌 Version: *${cfg.VERSION}*
║ 👑 Owner: *${cfg.OWNER_NUMBER}*
║ 🔧 Préfixe: *${cfg.PREFIX}*
║ ⏱️ Uptime: *${h}h ${mn}m ${s}s*
║ 💾 RAM: *${(process.memoryUsage().rss/1024/1024).toFixed(1)} MB*
║ 🖥️ OS: *${os.platform()} ${os.arch()}*
║ 📦 Node: *${process.version}*
╚══════════════════╝`);
        break;
      }
      case 'owner': {
        await m.reply(`🔱 *Propriétaire*\n\n📱 wa.me/${cfg.OWNER_NUMBER}\n🤖 Bot: ${cfg.BOT_NAME}`);
        break;
      }
      case 'heure': {
        const now = new Date().toLocaleString('fr-FR', { timeZone: cfg.TIMEZONE });
        await m.reply(`🕐 *Date & Heure*\n\n📅 ${now}`);
        break;
      }
      case 'version': {
        await m.reply(`🤖 *${cfg.BOT_NAME}*\n📌 v${cfg.VERSION}\n👨‍💻 ${cfg.AUTHOR}`);
        break;
      }
      case 'uptime':
      case 'runtime': {
        await m.reply(`⏱️ *Uptime*\n\n${msToTime(process.uptime() * 1000)}`);
        break;
      }
    }
  },
};
