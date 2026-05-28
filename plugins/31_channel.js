/**
 * 𓅂 DOMA LUCIFERO — Plugin Canal & Auto-Promo (31)
 * Auto-envoie le lien canal aux nouveaux utilisateurs
 * Commandes: .canal, .channel2, .promo, .subscribe2
 */

const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c';
const CHANNEL_NAME = '𝔻𝕠𝕞𝕒 𝕃𝕦𝕔𝕚𝕗𝕖𝕣𝕚𝕠 Tech';

const channelMessage = `📺 *Suivez notre canal officiel WhatsApp!*

*${CHANNEL_NAME}*

🔥 *Ce que vous trouverez sur le canal:*
• 🤖 Mises à jour du bot
• 💡 Nouvelles commandes
• 🎉 Événements VIP gratuits
• 📢 Annonces exclusives
• 🛠️ Tutoriels & astuces

👆 *Rejoignez maintenant:*
${CHANNEL_LINK}

_Cliquez sur le lien et appuyez sur "Suivre" ✅_`;

// Track users who already received the promo (avoid spam)
const promoSent = new Set();

module.exports = {
  commands: ['canal', 'channel2', 'promo', 'subscribe2', 'suivre', 'chainebot'],
  description: 'Canal & Promotion',
  channelLink: CHANNEL_LINK,
  channelName: CHANNEL_NAME,

  /**
   * Called automatically by index.js when a new user sends their first command
   */
  async sendChannelPromo(sock, jid, pushName) {
    if (promoSent.has(jid)) return;
    promoSent.add(jid);

    try {
      await sock.sendMessage(jid, {
        text: `👋 *Bienvenue ${pushName || ''}!*\n\n𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 est prêt à vous servir!\n\n${channelMessage}`,
      });
    } catch {}
  },

  execute: async ({ sock, m, args, q, isOwner, isVip, config: cfg, logger, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'canal':
      case 'channel2':
      case 'promo':
      case 'subscribe2':
      case 'suivre':
      case 'chainebot':
        await m.reply(channelMessage);
        break;
    }
  },
};
