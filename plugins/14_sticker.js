module.exports = {
  commands: ['sticker','toimg','stickerinfo','s','anim'],
  description: 'Stickers',
  execute: async ({ sock, m, args, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = m.message?.imageMessage || quoted?.imageMessage;
    const stickerMsg = m.message?.stickerMessage || quoted?.stickerMessage;

    switch (cmd) {
      case 'sticker':
      case 's': {
        if (!imgMsg) {
          return await m.reply(`📌 *Créer un Sticker*\n\nEnvoyez une image avec la légende *${cfg.PREFIX}s*\nou répondez à une image avec *${cfg.PREFIX}s*`);
        }
        try {
          const buffer = await sock.downloadMediaMessage(imgMsg?.url ? m : { message: { imageMessage: imgMsg } });
          await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
        } catch {
          await m.reply('❌ Impossible de créer le sticker. Assurez-vous d\'envoyer une image.');
        }
        break;
      }
      case 'toimg': {
        if (!stickerMsg) {
          return await m.reply(`📌 Répondez à un sticker avec *${cfg.PREFIX}toimg* pour le convertir en image.`);
        }
        try {
          const buffer = await sock.downloadMediaMessage(stickerMsg?.url ? m : { message: { stickerMessage: stickerMsg } });
          await sock.sendMessage(m.chat, { image: buffer, caption: '✅ Sticker converti en image!' }, { quoted: m });
        } catch {
          await m.reply('❌ Impossible de convertir le sticker.');
        }
        break;
      }
      case 'anim':
        await m.reply('🎬 Stickers animés: Envoyez un GIF avec la légende .anim');
        break;
    }
  },
};
