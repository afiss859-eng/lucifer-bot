/**
 * Plugin 38 — Galerie DOMA & Ambiance
 * Commandes: .galerie, .ambiance, .night, .fire, .power, .dark
 * 
 * 📌 CONFIGURER VOS PROPRES PHOTOS:
 *    Ajoutez dans votre .env sur Render:
 *    DOMA_PHOTO_1=https://imgur.com/xxxxx.jpg
 *    DOMA_PHOTO_2=https://imgur.com/yyyyy.jpg
 *    ... jusqu'à DOMA_PHOTO_20
 */

const axios = require('axios');

function getDomaPictures() {
  const pics = [];
  for (let i = 1; i <= 20; i++) {
    const url = process.env[`DOMA_PHOTO_${i}`];
    if (url) pics.push({ url, title: `📸 DOMA Photo #${i}` });
  }
  return pics;
}

// Ambiances thématiques (images publiques de qualité)
const AMBIANCES = {
  night: {
    label: '🌙 Nuit Mystérieuse',
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800',
      'https://images.unsplash.com/photo-1475070929565-c985b496cb9f?w=800',
    ],
  },
  fire: {
    label: '🔥 Feu & Puissance',
    images: [
      'https://images.unsplash.com/photo-1514354050279-bbca60b7d29e?w=800',
      'https://images.unsplash.com/photo-1488048924544-c818a467dacd?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
    ],
  },
  power: {
    label: '⚡ Énergie & Force',
    images: [
      'https://images.unsplash.com/photo-1534796636912-3b4e6a0c8b0e?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    ],
  },
  dark: {
    label: '🌑 Univers Sombre',
    images: [
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800',
      'https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=800',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
    ],
  },
  ambiance: {
    label: '🎭 Ambiance DOMA',
    images: [
      'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?w=800',
      'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=800',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
    ],
  },
};

module.exports = {
  commands: ['galerie','gallery','ambiance','night','fire','power','dark','domapack','addphoto'],
  description: 'Galerie DOMA Lucifero & Ambiances',

  execute: async ({ sock, m, args, q, isOwner, config: cfg, logger }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const chat = m.chat;

    // ── Ajouter une photo (owner) ─────────────────────────────────────────
    if (cmd === 'addphoto') {
      if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
      return await m.reply(
        `📸 *Ajouter des photos DOMA*\n\n` +
        `Pour ajouter vos photos personnelles:\n\n` +
        `1️⃣ Uploadez sur *imgur.com* ou *imgbb.com* (gratuit)\n` +
        `2️⃣ Copiez l'URL directe (ex: https://i.imgur.com/xxxxx.jpg)\n` +
        `3️⃣ Ajoutez dans votre .env sur Render:\n\n` +
        `\`\`\`\nDOMA_PHOTO_1=https://i.imgur.com/xxxxx.jpg\n` +
        `DOMA_PHOTO_2=https://i.imgur.com/yyyyy.jpg\n` +
        `...\`\`\`\n\n` +
        `4️⃣ Redéployez sur Render\n\n` +
        `Ensuite: *${cfg.PREFIX}galerie* affichera vos photos!`
      );
    }

    // ── Galerie principale ────────────────────────────────────────────────
    if (cmd === 'galerie' || cmd === 'gallery') {
      const domaPics = getDomaPictures();

      if (domaPics.length === 0) {
        // Aucune photo configurée → afficher menu ambiances
        return await m.reply(
          `📸 *Galerie DOMA LUCIFERO*\n\n` +
          `Aucune photo personnelle configurée.\n\n` +
          `📌 *Ambiances disponibles:*\n` +
          `• ${cfg.PREFIX}night — 🌙 Nuit Mystérieuse\n` +
          `• ${cfg.PREFIX}fire — 🔥 Feu & Puissance\n` +
          `• ${cfg.PREFIX}power — ⚡ Énergie & Force\n` +
          `• ${cfg.PREFIX}dark — 🌑 Univers Sombre\n` +
          `• ${cfg.PREFIX}ambiance — 🎭 Ambiance DOMA\n\n` +
          `📸 Pour ajouter vos photos: ${cfg.PREFIX}addphoto`
        );
      }

      const numStr = args[0];
      if (numStr && !isNaN(numStr)) {
        const idx = parseInt(numStr) - 1;
        const pic = domaPics[idx];
        if (!pic) return await m.reply(`❌ Photo #${numStr} introuvable. Il y a ${domaPics.length} photos.`);
        try {
          await sock.sendMessage(chat, {
            image: { url: pic.url },
            caption: `${pic.title}\n\n𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂`,
          });
        } catch(e) {
          await m.reply(`❌ Image indisponible: ${e.message}`);
        }
      } else {
        // Envoyer toutes les photos (max 5 à la fois)
        const toSend = domaPics.slice(0, 5);
        await m.reply(`📸 *Galerie DOMA* — ${domaPics.length} photo(s)\n\nEnvoi de ${toSend.length} photo(s)...`);
        for (const pic of toSend) {
          try {
            await sock.sendMessage(chat, {
              image: { url: pic.url },
              caption: `${pic.title} — 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂`,
            });
            await new Promise(r => setTimeout(r, 800));
          } catch(e) {
            logger.error('galerie pic:', e.message);
          }
        }
        if (domaPics.length > 5) {
          await m.reply(`📸 +${domaPics.length-5} autres photos. Utilisez: ${cfg.PREFIX}galerie [numéro]`);
        }
      }
      return;
    }

    // ── Ambiances thématiques ─────────────────────────────────────────────
    const ambianceCmds = ['night','fire','power','dark','ambiance'];
    if (ambianceCmds.includes(cmd) || cmd === 'domapack') {
      const theme = cmd === 'domapack' ? 'ambiance' : cmd;
      const amb = AMBIANCES[theme] || AMBIANCES.ambiance;
      const images = amb.images;

      await m.react('🎨');
      await m.reply(`🎨 *${amb.label}*\n\nEnvoi de ${images.length} images...`);

      for (let i = 0; i < images.length; i++) {
        try {
          await sock.sendMessage(chat, {
            image: { url: images[i] },
            caption: i === images.length - 1 ? `${amb.label}\n\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂` : '',
          });
          await new Promise(r => setTimeout(r, 700));
        } catch(e) {
          logger.error('ambiance img:', e.message);
        }
      }
      return;
    }
  },
};
