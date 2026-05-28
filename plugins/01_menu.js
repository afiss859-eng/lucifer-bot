const config = require('../config/config');
const moment = require('moment');

module.exports = {
  commands: ['menu', 'help', 'aide', 'start', 'cmds'],
  description: 'Menu principal',
  execute: async ({ sock, m, isOwner, isVip }) => {
    const p = config.PREFIX;
    const now = moment().format('DD/MM/YYYY HH:mm');
    const vipTag = isVip ? '👑 *VIP*' : '👤 *Membre*';

    const menu = `
╔══════════════════════════════╗
║  𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂
║  Version ${config.VERSION} | ${now}
║  Statut: ${vipTag}
╠══════════════════════════════╣
║ 📋 *GÉNÉRAL* (${p}menu1)
║ 🎮 *DIVERTISSEMENT* (${p}menu2)
║ 🛠️ *OUTILS* (${p}menu3)
║ 🎵 *MÉDIAS* (${p}menu4)
║ 👥 *GROUPE* (${p}menu5)
║ 💰 *ÉCONOMIE* (${p}menu6)
║ 🃏 *JEUX* (${p}menu7)
║ 🔞 *ANIME* (${p}menu8)
║ 🌐 *RECHERCHE* (${p}menu9)
║ 👑 *VIP* (${p}menuvip)
║ 🔱 *OWNER* (${p}menuowner)
╠══════════════════════════════╣
║ 📊 500+ commandes disponibles
║ Préfixe: *${p}*
╚══════════════════════════════╝
_𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 | by afiss859-eng_`;

    await m.reply(menu);
  },
};
