const { randomInt } = require('../src/utils');

module.exports = {
  commands: [
    'facebook','instagram','twitter2','tiktok2','youtube2','snapchat',
    'linkedin','whatsapp2','telegram','discord2','reddit','pinterest2',
    'twitch','spotify2','netflix2','amazon2','google2','apple2',
    'bio2','caption','hashtag','viral','trending2',
  ],
  description: 'Réseaux sociaux & tendances',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const socialTips = {
      instagram: `📸 *Conseils Instagram*\n\n📈 Boostez votre compte:\n• Postez tous les jours à 7h, 12h ou 18h\n• Utilisez 20-25 hashtags pertinents\n• Stories quotidiennes = +40% de portée\n• Répondez aux commentaires en 1h\n• Collaborez avec d'autres comptes\n• Reels = format le plus viral\n• Bio optimisée avec mots-clés`,
      tiktok2: `🎵 *Conseils TikTok*\n\n📈 Stratégie virale:\n• Les 3 premières secondes sont cruciales\n• Utilisez les sons tendance\n• Postez 1-3 fois/jour\n• Texte à l'écran = +30% de rétention\n• Répondez aux commentaires en vidéo\n• Longueur idéale: 15-30 secondes\n• Hashtags: #PourToi #FYP + niche`,
      youtube2: `▶️ *Conseils YouTube*\n\n📈 Croissance:\n• Miniature + Titre = 50% du succès\n• Les 30 premières secondes = crucial\n• Vidéos de 8-12 min = meilleur watch time\n• Postez 1-2 fois/semaine régulièrement\n• SEO: mots-clés dans titre, description, tags\n• Créez des playlists thématiques\n• Call-to-action systématique`,
      twitter2: `🐦 *Conseils Twitter/X*\n\n📈 Engagement:\n• Postez 3-5 tweets/jour\n• Les threads = meilleure portée\n• Images = 2x plus d'engagement\n• Meilleurs horaires: 9h, 12h, 17h\n• Participez aux tendances (#Trending)\n• Retweetez avec commentaire\n• Évitez la zone 00h-6h`,
      facebook: `📘 *Conseils Facebook*\n\n📈 Stratégie:\n• Vidéos natives = meilleure portée organique\n• Groupes = meilleur engagement\n• Facebook Live booste l'algorithme\n• Postez 1-2 fois/jour max\n• Questions ouvertes = plus de commentaires\n• Partagez du contenu varié (photo/vidéo/lien)\n• Publicité Facebook ciblée = ROI élevé`,
      linkedin: `💼 *Conseils LinkedIn*\n\n📈 Profil professionnel:\n• Photo professionnelle = 14x plus de vues\n• Titre accrocheur (pas juste votre poste)\n• Résumé avec mots-clés secteur\n• Postez 3-5 fois/semaine\n• Articles longs = forte portée\n• Engagez dans votre réseau\n• Recommandations = crédibilité`,
    };

    const captions = [
      '✨ Chaque jour est une nouvelle opportunité. Saisissez-la! 💪',
      '🌟 Le succès n\'est pas final, l\'échec n\'est pas fatal. Ce qui compte, c\'est le courage de continuer.',
      '🔥 Travaillez en silence, laissez le succès faire du bruit.',
      '💎 Tu es plus fort que tu ne le penses, plus courageux que tu ne le crois.',
      '🌈 La vie est trop courte pour rester ordinaire.',
      '⚡ Soyez la version la plus folle de vous-même. Personne ne peut être vous mieux que vous.',
      '🎯 Fixez des objectifs qui vous font peur et des plans qui vous excitent.',
      '🌙 Même dans l\'obscurité, les étoiles brillent.',
    ];

    const hashtags = {
      motivation: '#motivation #success #mindset #goals #inspiration #hustle #grind #entrepreneur #lifestyle #positivity',
      food: '#foodie #foodphotography #instafood #homemade #yummy #delicious #cooking #recipe #foodlover #eat',
      fitness: '#fitness #workout #gym #fitnessmotivation #health #training #bodybuilding #fit #exercise #healthy',
      travel: '#travel #wanderlust #adventure #explore #travelgram #instatravel #vacation #photography #travelphotography',
      fashion: '#fashion #style #outfit #ootd #clothes #streetstyle #fashionista #trend #beauty #instafashion',
    };

    if (socialTips[cmd]) {
      return await m.reply(socialTips[cmd]);
    }

    switch (cmd) {
      case 'caption': {
        const c = captions[randomInt(0, captions.length - 1)];
        await m.reply(`📝 *Caption Instagram/TikTok*\n\n${c}\n\n_Copiez et adaptez selon votre post!_`);
        break;
      }
      case 'hashtag': {
        const topic = args[0]?.toLowerCase() || 'motivation';
        const tags = hashtags[topic] || hashtags.motivation;
        const topicFound = hashtags[topic] ? topic : 'motivation';
        await m.reply(`#️⃣ *Hashtags — ${topicFound}*\n\n${tags}\n\n📋 Copiez ces hashtags pour plus de portée!\n\nTopics: ${Object.keys(hashtags).join(', ')}`);
        break;
      }
      case 'viral': {
        await m.reply(`🔥 *Guide Contenu Viral*\n\n📊 Les 5 secrets du contenu viral:\n\n1️⃣ *Émotion forte* — Joie, surprise, indignation\n2️⃣ *Praticabilité* — "Je peux utiliser ça maintenant"\n3️⃣ *Storytelling* — Une histoire captivante\n4️⃣ *Timing* — Surfer sur les tendances\n5️⃣ *Visuels de qualité* — Miniature/première image irresistible\n\n🎯 Format: Court, percutant, valeur immédiate!`);
        break;
      }
      case 'trending2': {
        await m.reply(`📈 *Tendances du moment*\n\n🔗 Consultez les tendances:\n• TikTok: https://www.tiktok.com/explore\n• Twitter: https://twitter.com/explore\n• YouTube: https://youtube.com/feed/trending\n• Google: https://trends.google.com/trends/?geo=FR\n• Instagram: Section Explorer`);
        break;
      }
      case 'bio2': {
        const bios = [
          '✨ Créateur de contenu | Passionné de vie | Sur ma voie 🚀',
          '🔥 Je construis mon empire silencieusement | Entrepreneur | Dreamer',
          '🌍 Voyageur | Storyteller | Chaque jour est une aventure',
          '💻 Tech enthusiast | Coffee addict ☕ | Building the future',
          '🎵 Music is my language | Vibes over everything | Live your best life',
        ];
        await m.reply(`📝 *Idées de Bio*\n\n${bios.map((b, i) => `${i + 1}. ${b}`).join('\n\n')}`);
        break;
      }
      case 'snapchat':
      case 'discord2':
      case 'reddit':
      case 'pinterest2':
      case 'twitch':
      case 'spotify2':
      case 'netflix2':
      case 'amazon2':
      case 'google2':
      case 'apple2': {
        const platform = cmd.replace('2', '').charAt(0).toUpperCase() + cmd.replace('2', '').slice(1);
        await m.reply(`📱 *${platform}*\n\nPlateforme populaire utilisée par des millions d'utilisateurs!\n\n💡 Conseil: Créez un compte professionnel pour maximiser votre présence en ligne.`);
        break;
      }
      default:
        await m.reply(`📱 *Réseaux Sociaux*\n\nCommandes: ${cfg.PREFIX}instagram, ${cfg.PREFIX}tiktok2, ${cfg.PREFIX}youtube2, ${cfg.PREFIX}caption, ${cfg.PREFIX}hashtag [topic], ${cfg.PREFIX}viral`);
    }
  },
};
