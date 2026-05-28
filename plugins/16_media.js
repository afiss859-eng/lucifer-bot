const { fetchJson, getBuffer } = require('../src/utils');

module.exports = {
  commands: [
    'meme','gif','img','waifu','neko','anime2','manga2',
    'sad','cry','happy','angry','blush','bored','confused',
    'embarrassed','excited','scared','shocked','sleepy','surprised','tired',
  ],
  description: 'Médias et images',
  execute: async ({ sock, m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const nekosApis = {
      waifu: 'https://api.waifu.pics/sfw/waifu',
      neko: 'https://api.waifu.pics/sfw/neko',
      hug: 'https://api.waifu.pics/sfw/hug',
      cry: 'https://api.waifu.pics/sfw/cry',
      happy: 'https://api.waifu.pics/sfw/happy',
      blush: 'https://api.waifu.pics/sfw/blush',
      confused: 'https://api.waifu.pics/sfw/confused',
      sad: 'https://api.waifu.pics/sfw/sad',
      angry: 'https://api.waifu.pics/sfw/angry',
      bored: 'https://api.waifu.pics/sfw/bored',
      scared: 'https://api.waifu.pics/sfw/scared',
    };

    const emojiLabels = {
      waifu: '💖 Waifu', neko: '🐱 Neko', cry: '😭 Pleure',
      happy: '😊 Joyeux', blush: '😊 Rougit', confused: '😕 Confus',
      sad: '😢 Triste', angry: '😠 En colère', bored: '😒 Ennuyé', scared: '😨 Effrayé',
    };

    if (nekosApis[cmd]) {
      try {
        const data = await fetchJson(nekosApis[cmd]);
        const buf = await getBuffer(data.url);
        await m.replyImage(buf, `${emojiLabels[cmd] || cmd}`);
      } catch {
        await m.reply(`❌ Impossible de charger l'image. Réessayez!`);
      }
      return;
    }

    switch (cmd) {
      case 'meme': {
        try {
          const data = await fetchJson('https://meme-api.com/gimme');
          const buf = await getBuffer(data.url);
          await m.replyImage(buf, `😂 *${data.title}*\n👍 ${data.ups}`);
        } catch {
          await m.reply('😂 *Mème du jour*\n\nErreur de chargement. Réessayez dans un moment!');
        }
        break;
      }
      case 'gif': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}gif [mot-clé]`);
        await m.reply(`🎬 Recherche de GIF pour: *${q}*\n\nFonctionnalité GIF: Utilisez GIPHY ou Tenor pour rechercher des GIFs sur: https://giphy.com/search/${encodeURIComponent(q)}`);
        break;
      }
      case 'img': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}img [recherche]`);
        await m.reply(`🖼️ Recherche d'image pour: *${q}*\n\n🔗 Google Images: https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`);
        break;
      }
      case 'anime2': {
        await m.reply(`🎌 *Anime Info*\n\nUsage: ${cfg.PREFIX}anime2 [nom de l'anime]\n\nPour les images anime, utilisez: ${cfg.PREFIX}waifu ou ${cfg.PREFIX}neko`);
        break;
      }
      default:
        await m.reply(`🎨 *Médias*\n\nCommandes disponibles:\n• ${cfg.PREFIX}waifu\n• ${cfg.PREFIX}neko\n• ${cfg.PREFIX}meme\n• ${cfg.PREFIX}gif [mot]\n• ${cfg.PREFIX}img [mot]\n• ${cfg.PREFIX}cry / happy / sad / angry...`);
    }
  },
};
