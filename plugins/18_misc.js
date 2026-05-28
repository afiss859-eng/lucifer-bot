const { randomInt } = require('../src/utils');

module.exports = {
  commands: [
    'toss','roll','magic','predict','tarot','lucky','astro',
    'dream','spirit','oracle','rune','chakra','aura','karma',
    'wisdom','proverb','poem','story','riddle2','tongue',
    'abbreviation','wordofday','didyouknow','philosophy',
    'motivate','inspire','affirmation','positivity','energy',
    'meditation','yoga','exercise','diet','health',
    'recipe','ingredient','cocktail','drink','food',
    'color2','fashion','style','trend','beauty',
    'travel','destination','culture','language2','flag2',
    'sport','football','basketball','tennis','swimming',
    'music2','genre','artist','album','song',
    'movie','series','actor','director','genre2',
    'book','author','genre3','literature','poetry',
    'science','physics','chemistry','biology','math2',
    'history','war','empire','revolution','invention',
    'tech','ai','robot','space','planet2',
    'nature','animal2','plant','ocean','weather2',
  ],
  description: 'Commandes diverses',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const wisdoms = [
      "La patience est la clé de toutes les portes.",
      "Celui qui sait attendre n'attend jamais longtemps.",
      "La connaissance parle, mais la sagesse écoute.",
      "Chaque jour est une nouvelle chance de tout changer.",
      "La vie est trop courte pour se soucier de l'opinion des autres.",
      "Un bon ami vaut plus que mille connaissances.",
      "La simplicité est la sophistication ultime.",
    ];

    const proverbs = [
      "Qui ne risque rien n'a rien. 🎯",
      "Mieux vaut tard que jamais. ⏰",
      "L'union fait la force. 💪",
      "A cœur vaillant rien d'impossible. ❤️",
      "Le temps c'est de l'argent. 💰",
      "Les absents ont toujours tort. 🚪",
      "Pierre qui roule n'amasse pas mousse. 🌿",
    ];

    const tarotCards = [
      "🃏 *Le Fou* — Nouvelles aventures, liberté, spontanéité",
      "☀️ *Le Soleil* — Succès, joie, énergie positive",
      "🌙 *La Lune* — Mystère, intuition, illusion",
      "⭐ *L'Étoile* — Espoir, inspiration, sérénité",
      "⚡ *La Tour* — Changement soudain, révélation",
      "❤️ *L'Amoureux* — Amour, choix, harmonie",
      "⚖️ *La Justice* — Équilibre, vérité, karma",
      "🌍 *Le Monde* — Accomplissement, voyage, intégration",
    ];

    const sports = {
      football: "⚽ *Football*\nLe sport le plus populaire au monde avec 4 milliards de fans!",
      basketball: "🏀 *Basketball*\nInventé en 1891 par James Naismith.",
      tennis: "🎾 *Tennis*\nRoland-Garros, Wimbledon, US Open, Australian Open = les 4 Grand Slams.",
      swimming: "🏊 *Natation*\nMichael Phelps détient 23 médailles d'or olympiques!",
    };

    const foods = [
      "🍕 *Pizza Margherita* — Tomate, mozzarella, basilic. Un classique italien!",
      "🍣 *Sushi* — Riz vinaigré avec poisson cru. Délicieux et sain!",
      "🫕 *Couscous* — Un des plats les plus consommés au monde!",
      "🥘 *Paella* — Le plat national espagnol avec riz, safran et fruits de mer.",
      "🍜 *Ramen* — Soupe japonaise avec nouilles et bouillon riche.",
    ];

    const sciences = [
      "⚛️ *Physique Quantique* — Les particules peuvent être à deux endroits en même temps!",
      "🧬 *ADN* — Notre ADN est à 98.7% identique à celui des chimpanzés.",
      "🌌 *Univers* — L'univers a environ 13.8 milliards d'années.",
      "⚡ *Électricité* — La foudre est 5x plus chaude que la surface du soleil.",
      "🦠 *Biologie* — Il y a plus de bactéries dans votre bouche que d'humains sur Terre.",
    ];

    const affirmations = [
      "Je suis capable d'accomplir tout ce que je veux! 💪",
      "Je mérite tout le bonheur du monde! 🌟",
      "Chaque jour je deviens une meilleure version de moi-même! 🌱",
      "Je suis fort(e) et courageux(se)! 🦁",
      "Ma vie est pleine de belles opportunités! ✨",
    ];

    switch (cmd) {
      case 'toss':
        await m.reply(`🪙 *Pile ou Face*\n\n${Math.random()>0.5?'🟡 PILE!':'⚪ FACE!'}`);
        break;
      case 'roll':
        await m.reply(`🎲 *Dé*\n\n${randomInt(1, 6)}`);
        break;
      case 'tarot': {
        const card = tarotCards[randomInt(0, tarotCards.length-1)];
        await m.reply(`🔮 *Tirage Tarot*\n\n${card}\n\n_Votre destin pour aujourd'hui..._`);
        break;
      }
      case 'lucky': {
        const nums = Array.from({length:6}, ()=>randomInt(1,49)).sort((a,b)=>a-b);
        await m.reply(`🍀 *Numéros Chanceux*\n\n${nums.join(' - ')}\n\n_Bonne chance au loto!_`);
        break;
      }
      case 'predict': {
        const predictions = ['Oui, cela va arriver!', 'Non, il faut changer de direction.', 'Soyez patient, le moment n\'est pas encore venu.', 'Les étoiles sont en votre faveur!', 'Un obstacle sera bientôt surmonté.', 'Une surprise agréable vous attend.'];
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}predict [question]`);
        await m.reply(`🔮 *Prédiction*\n\n❓ ${q}\n\n✨ ${predictions[randomInt(0, predictions.length-1)]}`);
        break;
      }
      case 'wisdom':
        await m.reply(`🦉 *Sagesse*\n\n_${wisdoms[randomInt(0, wisdoms.length-1)]}_`);
        break;
      case 'proverb':
        await m.reply(`📜 *Proverbe*\n\n_${proverbs[randomInt(0, proverbs.length-1)]}_`);
        break;
      case 'motivate':
      case 'inspire':
        await m.reply(`🔥 *Motivation*\n\n_${wisdoms[randomInt(0, wisdoms.length-1)]}_\n\n💪 Allez, vous pouvez le faire!`);
        break;
      case 'affirmation':
      case 'positivity':
        await m.reply(`✨ *Affirmation du jour*\n\n${affirmations[randomInt(0, affirmations.length-1)]}`);
        break;
      case 'food':
      case 'recipe':
        await m.reply(`🍽️ *Plat du jour*\n\n${foods[randomInt(0, foods.length-1)]}`);
        break;
      case 'science':
      case 'didyouknow':
        await m.reply(`🔬 *Le saviez-vous?*\n\n${sciences[randomInt(0, sciences.length-1)]}`);
        break;
      case 'football':
      case 'basketball':
      case 'tennis':
      case 'swimming': {
        const info = sports[cmd] || `🏅 *Sport*\n\nLe sport est bon pour la santé!`;
        await m.reply(info);
        break;
      }
      case 'dream': {
        const dreams = ['🌊 Rêve de l\'eau = émotions refoulées', '🕊️ Voler = désir de liberté', '🌪️ Tempête = conflits intérieurs', '🦁 Lion = force et courage', '👑 Couronne = ambition et pouvoir'];
        if (!q) return await m.reply(`🌙 *Interprétation des Rêves*\n\n${dreams[randomInt(0,dreams.length-1)]}\n\nUsage: ${cfg.PREFIX}dream [élément du rêve]`);
        await m.reply(`🌙 *Interprétation: ${q}*\n\nVotre rêve sur "${q}" symbolise: une transformation profonde et de nouvelles opportunités qui se présentent dans votre vie.`);
        break;
      }
      case 'tongue': {
        const virelangues = ['Un chasseur sachant chasser doit savoir chasser sans son chien.','Les chaussettes de l\'archiduchesse sont-elles sèches ou archi-sèches?','Je veux et j\'exige, j\'exige et je veux, que vous me cédantiez ce dont je vous céde.'];
        await m.reply(`👅 *Virelangue*\n\n_${virelangues[randomInt(0,virelangues.length-1)]}_\n\nEssayez de le dire 3 fois rapidement!`);
        break;
      }
      case 'health':
      case 'exercise':
      case 'yoga':
      case 'meditation': {
        const tips = ['💧 Buvez 2 litres d\'eau par jour', '🏃 Faites 30 min d\'exercice quotidien', '😴 Dormez 7-8 heures par nuit', '🥗 Mangez 5 fruits et légumes par jour', '🧘 Méditez 10 minutes chaque matin', '🚶 Marchez au moins 10 000 pas par jour'];
        await m.reply(`❤️ *Conseil Santé*\n\n${tips[randomInt(0,tips.length-1)]}`);
        break;
      }
      case 'space':
      case 'planet2': {
        const facts = ['🌍 La Terre tourne sur elle-même en 23h 56min 4s','🌙 La Lune s\'éloigne de la Terre de 3.8cm par an','☀️ Le soleil représente 99.86% de la masse du système solaire','🪐 Saturne est si léger qu\'il flotterait sur l\'eau!','♾️ L\'univers visible contient environ 2 trillions de galaxies'];
        await m.reply(`🚀 *Espace*\n\n${facts[randomInt(0,facts.length-1)]}`);
        break;
      }
      default:
        await m.reply(`ℹ️ Commande *${cmd}* disponible dans ${cfg.BOT_NAME}!\n\nTapez ${cfg.PREFIX}menu pour voir toutes les commandes.`);
    }
  },
};
