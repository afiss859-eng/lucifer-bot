/**
 * Plugin 37 — Motivation: Photos, Musiques & Vidéos
 * Commandes: .motivation, .inspire, .musique, .video, .domamusic, .domaimg
 * 
 * 📌 Pour ajouter vos propres médias:
 *    - Photos: ajoutez les URLs dans DOMA_PHOTOS
 *    - Musiques: ajoutez les URLs MP3 dans DOMA_MUSICS
 *    - Vidéos: ajoutez les URLs MP4 dans DOMA_VIDEOS
 */

const axios = require('axios');

// ════════════════════════════════════════════════════════════════════════════
// 📸 PHOTOS DE DOMA LUCIFERO
// → Remplacez ces URLs par vos vraies photos
// → Uploadez sur imgbb.com, imgur.com, ou tout hébergeur d'images
// ════════════════════════════════════════════════════════════════════════════
const DOMA_PHOTOS = (process.env.DOMA_PHOTOS || '').split(',').filter(Boolean);

// Photos de motivation par défaut (thème sombre/mystérieux)
const MOTIVATION_IMAGES = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',  // nuit étoilée
  'https://images.unsplash.com/photo-1502581827181-9cf3c3ee0106?w=800&q=80',  // montagne coucher soleil
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',  // montagne brume
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',  // forêt mystérieuse
  'https://images.unsplash.com/photo-1534796636912-3b4e6a0c8b0e?w=800&q=80',  // univers galaxie
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',  // montagne épique
  'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=800&q=80',  // chat mystérieux
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',     // feu/flamme
];

// ════════════════════════════════════════════════════════════════════════════
// 🎵 MUSIQUES DE MOTIVATION
// → Format: { titre, artiste, url (MP3 direct), duree }
// → Ajoutez vos propres musiques via les variables .env DOMA_MUSIC_1, etc.
// ════════════════════════════════════════════════════════════════════════════
const DOMA_MUSICS = [
  {
    titre: 'Epic Motivation',
    artiste: 'DOMA LUCIFERO',
    url: process.env.DOMA_MUSIC_1 || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duree: '3:45',
  },
  {
    titre: 'Dark Power',
    artiste: 'DOMA LUCIFERO',
    url: process.env.DOMA_MUSIC_2 || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duree: '4:10',
  },
  {
    titre: 'Rise Up',
    artiste: 'DOMA LUCIFERO',
    url: process.env.DOMA_MUSIC_3 || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duree: '3:20',
  },
  {
    titre: 'Unstoppable',
    artiste: 'DOMA LUCIFERO',
    url: process.env.DOMA_MUSIC_4 || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duree: '4:55',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 🎬 VIDÉOS DE MOTIVATION
// → Format: { titre, description, url (MP4 direct) }
// → Ou liens YouTube (envoyés comme texte)
// ════════════════════════════════════════════════════════════════════════════
const DOMA_VIDEOS = [
  {
    titre: '🔥 La Motivation ultime',
    description: 'Vidéo motivation DOMA LUCIFERO',
    url: process.env.DOMA_VIDEO_1 || null,
    youtube: 'https://youtu.be/lFdkNkLlX1Y',
  },
  {
    titre: '💪 Ne jamais abandonner',
    description: 'Persévérance & succès',
    url: process.env.DOMA_VIDEO_2 || null,
    youtube: 'https://youtu.be/mgmVOuLgFB0',
  },
  {
    titre: '👑 Mentalité de champion',
    description: 'Développez votre mindset gagnant',
    url: process.env.DOMA_VIDEO_3 || null,
    youtube: 'https://youtu.be/0o8XMlL8MtA',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// Citations de motivation DOMA style
// ════════════════════════════════════════════════════════════════════════════
const DOMA_QUOTES = [
  '🔥 *"La douleur d\'aujourd\'hui est la force de demain."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '⚡ *"Ceux qui abandonnent ne gagnent jamais. Ceux qui gagnent n\'abandonnent jamais."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '👑 *"Sois la raison pour laquelle quelqu\'un ne lâche pas."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '🌑 *"Dans l\'obscurité, tu apprendras à briller."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '🔱 *"Le succès n\'est pas final, l\'échec n\'est pas fatal. C\'est le courage de continuer qui compte."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '💎 *"Les diamants se forment sous pression. Toi aussi."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '🌟 *"Ton seul concurrent c\'est la personne que tu étais hier."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
  '🚀 *"Rêve grand. Travaille dur. Reste humble."*\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂',
];

module.exports = {
  commands: [
    'motivation','inspire','motiv',
    'musique','music','domamusic','playlist',
    'video','domafilm','domavideo',
    'domaimg','domaimage','domaimg','doma',
    'listemusique','listvideos',
  ],
  description: 'Photos, musiques & vidéos de motivation DOMA',

  execute: async ({ sock, m, args, q, config: cfg, logger }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const chat = m.chat;

    switch (cmd) {

      // ── Photo de motivation ───────────────────────────────────────────────
      case 'domaimg':
      case 'domaimage': {
        // Priorité aux photos personnelles de Doma
        const photos = DOMA_PHOTOS.length > 0 ? DOMA_PHOTOS : MOTIVATION_IMAGES;
        const url = photos[Math.floor(Math.random() * photos.length)];
        const quote = DOMA_QUOTES[Math.floor(Math.random() * DOMA_QUOTES.length)];
        await m.react('📸');
        try {
          await sock.sendMessage(chat, {
            image: { url },
            caption: `📸 *DOMA LUCIFERO*\n\n${quote}\n\n📺 Suivez: https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c`,
          });
        } catch(e) {
          await m.reply(`📸 *DOMA LUCIFERO*\n\n${quote}\n\n❌ Image indisponible. Configurez DOMA_PHOTOS dans .env`);
        }
        break;
      }

      case 'doma': {
        // Envoie présentation complète de DOMA
        const quote = DOMA_QUOTES[Math.floor(Math.random() * DOMA_QUOTES.length)];
        const photos = DOMA_PHOTOS.length > 0 ? DOMA_PHOTOS : MOTIVATION_IMAGES;
        await m.react('👑');
        try {
          await sock.sendMessage(chat, {
            image: { url: photos[0] },
            caption: `👑 *𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂*\n\n${quote}\n\n🤖 *Bot WhatsApp 700+ Commandes*\n📦 Plugins: IA, Économie, Jeux, Anti-spam & +\n\n📺 Canal officiel:\nhttps://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c`,
          });
        } catch {
          await m.reply(`👑 *𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂*\n\n${quote}\n\n🤖 Bot WhatsApp 700+ Commandes\n📺 https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c`);
        }
        break;
      }

      // ── Citation de motivation avec image ─────────────────────────────────
      case 'motivation':
      case 'inspire':
      case 'motiv': {
        const quote = DOMA_QUOTES[Math.floor(Math.random() * DOMA_QUOTES.length)];
        const imgUrl = MOTIVATION_IMAGES[Math.floor(Math.random() * MOTIVATION_IMAGES.length)];
        await m.react('🔥');
        try {
          await sock.sendMessage(chat, {
            image: { url: imgUrl },
            caption: `🔥 *MOTIVATION DOMA*\n\n${quote}`,
          });
        } catch {
          await m.reply(`🔥 *MOTIVATION DOMA*\n\n${quote}`);
        }
        break;
      }

      // ── Musique ───────────────────────────────────────────────────────────
      case 'musique':
      case 'music':
      case 'domamusic': {
        const numStr = args[0];
        let track;
        if (numStr && !isNaN(numStr)) {
          const idx = parseInt(numStr) - 1;
          track = DOMA_MUSICS[idx];
          if (!track) return await m.reply(`❌ Musique #${numStr} introuvable.\n\nUtilisez ${cfg.PREFIX}playlist pour voir la liste.`);
        } else {
          track = DOMA_MUSICS[Math.floor(Math.random() * DOMA_MUSICS.length)];
        }

        await m.react('🎵');
        await m.reply(`🎵 *${track.titre}*\n👤 ${track.artiste}\n⏱️ Durée: ${track.duree}\n\n⏳ Envoi en cours...`);

        try {
          await sock.sendMessage(chat, {
            audio: { url: track.url },
            mimetype: 'audio/mpeg',
            ptt: false,
          });
        } catch(e) {
          logger.error('music send:', e.message);
          await m.reply(
            `❌ *Impossible d\'envoyer la musique.*\n\n` +
            `💡 Pour ajouter vos musiques, configurez dans .env:\n` +
            `• DOMA_MUSIC_1=https://url-mp3-direct.com/son.mp3\n` +
            `• DOMA_MUSIC_2=...\n\n` +
            `📁 L'URL doit pointer vers un fichier MP3 accessible publiquement.`
          );
        }
        break;
      }

      // ── Playlist ──────────────────────────────────────────────────────────
      case 'playlist':
      case 'listemusique': {
        const list = DOMA_MUSICS.map((t, i) => `${i+1}. 🎵 *${t.titre}* — ${t.artiste} (${t.duree})`).join('\n');
        await m.reply(`🎶 *Playlist DOMA LUCIFERO*\n\n${list}\n\n▶️ Écouter: ${cfg.PREFIX}musique [numéro]\nEx: ${cfg.PREFIX}musique 1`);
        break;
      }

      // ── Vidéo ─────────────────────────────────────────────────────────────
      case 'video':
      case 'domafilm':
      case 'domavideo': {
        const numStr = args[0];
        let vid;
        if (numStr && !isNaN(numStr)) {
          const idx = parseInt(numStr) - 1;
          vid = DOMA_VIDEOS[idx];
          if (!vid) return await m.reply(`❌ Vidéo #${numStr} introuvable.\nUtilisez ${cfg.PREFIX}listvideos pour la liste.`);
        } else {
          vid = DOMA_VIDEOS[Math.floor(Math.random() * DOMA_VIDEOS.length)];
        }

        await m.react('🎬');

        // Si URL MP4 directe disponible
        if (vid.url) {
          await m.reply(`🎬 *${vid.titre}*\n📝 ${vid.description}\n\n⏳ Envoi de la vidéo...`);
          try {
            await sock.sendMessage(chat, {
              video: { url: vid.url },
              caption: `🎬 *${vid.titre}*\n${vid.description}\n\n— 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂`,
              gifPlayback: false,
            });
          } catch(e) {
            logger.error('video send:', e.message);
            // Fallback: lien YouTube
            await m.reply(`🎬 *${vid.titre}*\n📝 ${vid.description}\n\n▶️ Regarder: ${vid.youtube || '(non disponible)'}`);
          }
        } else {
          // Envoyer le lien YouTube
          await m.reply(
            `🎬 *${vid.titre}*\n📝 ${vid.description}\n\n▶️ *Regarder sur YouTube:*\n${vid.youtube}\n\n` +
            `💡 Pour des vidéos directes, configurez dans .env:\n*DOMA_VIDEO_1=https://url-mp4.com/video.mp4*`
          );
        }
        break;
      }

      // ── Liste des vidéos ──────────────────────────────────────────────────
      case 'listvideos': {
        const list = DOMA_VIDEOS.map((v, i) =>
          `${i+1}. 🎬 *${v.titre}*\n   ${v.description}${v.url ? ' ✅ MP4' : ' 📺 YouTube'}`
        ).join('\n\n');
        await m.reply(`🎬 *Vidéos DOMA LUCIFERO*\n\n${list}\n\n▶️ Voir: ${cfg.PREFIX}video [numéro]\nEx: ${cfg.PREFIX}video 1`);
        break;
      }
    }
  },
};
