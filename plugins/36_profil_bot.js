/**
 * Plugin 36 — Profil du Bot (photo, bio, statut)
 * Commandes: .setpp, .setbio, .profilbot, .resetpp, .setstatus
 */
const axios = require('axios');

// ── Photo de profil par défaut de DOMA LUCIFERO ──────────────────────────────
const DOMA_PROFILE_PHOTOS = [
  'https://i.ibb.co/0jZ3Q3d/lucifer.jpg',  // placeholder — remplacez par vraie URL
];

// URL de la photo officielle du bot (définissez dans .env: BOT_PROFILE_PIC_URL)
function getBotProfileUrl() {
  return process.env.BOT_PROFILE_PIC_URL || null;
}

module.exports = {
  commands: ['setpp','setbio','profilbot','profilebot','resetpp','setstatus','botinfo','setname2'],
  description: 'Gestion du profil du bot',
  ownerOnly: true,
  execute: async ({ sock, m, args, q, isOwner, config: cfg, logger }) => {
    if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {

      // ── Photo de profil depuis URL ou image citée ─────────────────────────
      case 'setpp': {
        let imageUrl = null;

        // 1. Image en pièce jointe dans le message
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.imageMessage) {
          try {
            const stream = await sock.downloadContentFromMessage(quoted.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buf = Buffer.concat(chunks);
            await sock.updateProfilePicture(sock.user.id.split(':')[0] + '@s.whatsapp.net', buf);
            return await m.reply('✅ *Photo de profil mise à jour!*\n\n📸 Image de la citation utilisée.');
          } catch(e) {
            logger.error('setpp quoted:', e.message);
          }
        }

        // 2. URL fournie en argument
        if (args[0] && args[0].startsWith('http')) {
          imageUrl = args[0];
        } else if (!imageUrl) {
          return await m.reply(
            `📸 *Changer la photo de profil du bot*\n\n` +
            `Usage:\n` +
            `• ${cfg.PREFIX}setpp [URL de l'image]\n` +
            `• Citez une image et tapez ${cfg.PREFIX}setpp\n\n` +
            `Ex: ${cfg.PREFIX}setpp https://exemple.com/photo.jpg`
          );
        }

        try {
          const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
          const buf = Buffer.from(res.data);
          await sock.updateProfilePicture(sock.user.id.split(':')[0] + '@s.whatsapp.net', buf);
          await m.reply('✅ *Photo de profil mise à jour!*\n\n📸 Source: ' + imageUrl);
        } catch(e) {
          await m.reply(`❌ Erreur: ${e.message}\n\nVérifiez que l'URL est une image valide (jpg/png).`);
        }
        break;
      }

      // ── Changer le groupe cible (changer PP d'un groupe) ─────────────────
      case 'resetpp': {
        const defaultUrl = getBotProfileUrl();
        if (!defaultUrl) {
          return await m.reply(`❌ Aucune photo par défaut configurée.\n\nAjoutez dans votre .env:\n*BOT_PROFILE_PIC_URL=https://url-de-votre-photo.jpg*`);
        }
        try {
          const res = await axios.get(defaultUrl, { responseType: 'arraybuffer', timeout: 15000 });
          await sock.updateProfilePicture(sock.user.id.split(':')[0] + '@s.whatsapp.net', Buffer.from(res.data));
          await m.reply('✅ *Photo de profil réinitialisée!*');
        } catch(e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Bio / À propos ────────────────────────────────────────────────────
      case 'setbio':
      case 'setstatus': {
        const bio = q || cfg.BOT_NAME + ' | 700+ Commandes WhatsApp';
        if (bio.length > 139) return await m.reply('❌ Bio trop longue. Maximum 139 caractères.\nActuellement: ' + bio.length);
        try {
          await sock.updateProfileStatus(bio);
          await m.reply(`✅ *Bio mise à jour!*\n\n📝 _${bio}_`);
        } catch(e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Infos complètes du bot ─────────────────────────────────────────────
      case 'profilbot':
      case 'profilebot':
      case 'botinfo': {
        const botJid = sock.user?.id;
        const botNum = botJid?.split(':')[0] || 'Inconnu';
        const botName = sock.user?.name || cfg.BOT_NAME;
        const uptime = process.uptime();
        const h = Math.floor(uptime/3600), mn = Math.floor((uptime%3600)/60), s = Math.floor(uptime%60);
        const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        await m.reply(
`╔══════════════════════════════╗
║  𓅂 *DOMA LUCIFERO* 𓅂        
╠══════════════════════════════╣
║ 📛 Nom:     *${botName}*
║ 📞 Numéro:  *${botNum}*
║ 🔖 Version: *${cfg.VERSION}*
║ ⚡ Prefix:  *${cfg.PREFIX}*
║ 📦 Cmds:    *700+*
║ ⏱️  Uptime:  *${h}h ${mn}m ${s}s*
║ 🧠 RAM:     *${mem} MB*
║ 📍 Owner:   *${cfg.OWNER_NUMBER}*
╠══════════════════════════════╣
║ 🌐 Dashboard: activé
║ 🤖 IA: ${process.env.GROQ_API_KEY ? '✅ Groq' : process.env.GEMINI_API_KEY ? '✅ Gemini' : '❌ Non configurée'}
╚══════════════════════════════╝

📺 Canal: https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c`
        );

        // Envoyer aussi la photo de profil si disponible
        const ppUrl = getBotProfileUrl();
        if (ppUrl) {
          try {
            await sock.sendMessage(m.chat, {
              image: { url: ppUrl },
              caption: `🤖 *${botName}* — Photo de profil officielle`
            });
          } catch {}
        }
        break;
      }

      default:
        await m.reply(`📸 *Commandes profil:*\n\n• ${cfg.PREFIX}setpp [url] — Changer la photo\n• ${cfg.PREFIX}setbio [texte] — Changer la bio\n• ${cfg.PREFIX}profilbot — Voir les infos du bot\n• ${cfg.PREFIX}resetpp — Remettre la photo par défaut`);
    }
  },
};
