const { fetchJson } = require('../src/utils');

module.exports = {
  commands: [
    'ytmp3','ytmp4','tiktokdl','igdl','fbdl','twitter','pintdl',
    'play','spotify','soundcloud','lyrics','ytsearch',
    'mediainfo','mediasize',
  ],
  description: 'Téléchargements médias',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const dlMsg = (platform, url, type) =>
      `📥 *${platform} Downloader*\n\nURL: ${url || 'Non fournie'}\nType: *${type}*\n\n⚠️ _Pour activer les téléchargements réels, connectez une clé API de téléchargement._\n\n🔗 Alternatives gratuites:\n• https://ssyoutube.com\n• https://snaptik.app\n• https://snapinsta.app`;

    switch (cmd) {
      case 'ytmp3': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}ytmp3 [URL YouTube]\nEx: ${cfg.PREFIX}ytmp3 https://youtube.com/watch?v=...`);
        await m.reply(dlMsg('YouTube', q, '🎵 Audio MP3'));
        break;
      }
      case 'ytmp4': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}ytmp4 [URL YouTube]`);
        await m.reply(dlMsg('YouTube', q, '🎬 Vidéo MP4'));
        break;
      }
      case 'tiktokdl': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}tiktokdl [URL TikTok]`);
        await m.reply(dlMsg('TikTok', q, '🎬 Vidéo sans filigrane') + '\n• https://snaptik.app');
        break;
      }
      case 'igdl': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}igdl [URL Instagram]`);
        await m.reply(dlMsg('Instagram', q, '📸 Photo/Vidéo') + '\n• https://snapinsta.app');
        break;
      }
      case 'fbdl': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}fbdl [URL Facebook]`);
        await m.reply(dlMsg('Facebook', q, '🎬 Vidéo') + '\n• https://fdown.net');
        break;
      }
      case 'twitter': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}twitter [URL Twitter/X]`);
        await m.reply(dlMsg('Twitter/X', q, '🐦 Vidéo/GIF') + '\n• https://twittervideodownloader.com');
        break;
      }
      case 'pintdl': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}pintdl [URL Pinterest]`);
        await m.reply(dlMsg('Pinterest', q, '📌 Image/Vidéo'));
        break;
      }
      case 'play': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}play [titre de la chanson]\nEx: ${cfg.PREFIX}play Bohemian Rhapsody`);
        await m.reply(`🎵 *Recherche audio*\n\n🔍 Titre: *${q}*\n\n🔗 Trouvez sur:\n• YouTube: https://youtube.com/results?search_query=${encodeURIComponent(q)}\n• Spotify: https://open.spotify.com/search/${encodeURIComponent(q)}`);
        break;
      }
      case 'lyrics': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}lyrics [titre - artiste]`);
        try {
          const data = await fetchJson(`https://api.lyrics.ovh/v1/${encodeURIComponent(q.split(' - ')[1]||'unknown')}/${encodeURIComponent(q.split(' - ')[0])}`);
          const text = data.lyrics?.substring(0, 1500) || 'Paroles non trouvées';
          await m.reply(`🎵 *Paroles: ${q}*\n\n${text}${data.lyrics?.length > 1500 ? '\n\n_[suite...]_' : ''}`);
        } catch {
          await m.reply(`🎵 *Paroles: ${q}*\n\n❌ Paroles non trouvées.\n\n🔗 Cherchez sur: https://genius.com/search?q=${encodeURIComponent(q)}`);
        }
        break;
      }
      case 'ytsearch': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}ytsearch [recherche]`);
        await m.reply(`🔍 *Recherche YouTube*\n\n🔎 "${q}"\n\n🔗 https://youtube.com/results?search_query=${encodeURIComponent(q)}`);
        break;
      }
      case 'spotify': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}spotify [titre]`);
        await m.reply(`🟢 *Spotify*\n\n🔍 Recherche: "${q}"\n\n🔗 https://open.spotify.com/search/${encodeURIComponent(q)}`);
        break;
      }
      case 'soundcloud': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}soundcloud [titre]`);
        await m.reply(`☁️ *SoundCloud*\n\n🔍 Recherche: "${q}"\n\n🔗 https://soundcloud.com/search?q=${encodeURIComponent(q)}`);
        break;
      }
      case 'mediainfo':
        await m.reply(`ℹ️ *MediaInfo*\n\nRépondez à un média (vidéo/audio/image) avec cette commande pour voir ses informations.`);
        break;
      case 'mediasize':
        await m.reply(`📦 *Taille du Média*\n\nRépondez à un fichier pour voir sa taille.`);
        break;
    }
  },
};
