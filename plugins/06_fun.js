const { randomInt } = require('../src/utils');

const blagues = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau !',
  "Qu'est-ce qu'un crocodile qui surveille la cour d'école ? Un sac à dents !",
  'Comment appelle-t-on un chat tombé dans un pot de colle ? Un chat collant !',
  "Pourquoi les baleines nagent-elles dans l'eau salée ? Parce que le poivre les ferait éternuer !",
  "Qu'est-ce qu'un canif ? Un petit fien !",
  'Pourquoi Superman met-il sa cape par-dessus son slip ? Pour ne pas avoir froid aux oreilles !',
  "Qu'est-ce qu'un chat tombé dans un pot de peinture ? Un chat-peint !",
  "Pourquoi les mathématiciens font-ils de bons détectives ? Parce qu'ils savent toujours x !",
  "Comment appelle-t-on un boomerang qui ne revient pas ? Un bâton !",
  "Qu'est-ce qu'un fromage qui n'est pas à toi ? Un camembert !",
  "Pourquoi les vaches portent-elles des cloches ? Parce que leurs cornes ne fonctionnent pas !",
  "Qu'est-ce qu'un Mexicain sous une voiture ? Carlos !",
  "Pourquoi les aveugles n'aiment pas sauter en parachute ? Ça fait peur au chien !",
  "Qu'est-ce qu'un yaourt dans la forêt ? Un yaourt nature !",
  "Comment appelle-t-on un chien dans le désert ? Un chien chaud !",
];

const citations = [
  '"La vie, c\'est comme une bicyclette, il faut avancer pour ne pas perdre l\'équilibre." — Einstein',
  '"Le succès, c\'est tomber sept fois et se relever huit." — Proverbe japonais',
  '"Sois le changement que tu veux voir dans le monde." — Gandhi',
  '"L\'imagination est plus importante que le savoir." — Einstein',
  '"Un voyage de mille lieues commence par un premier pas." — Lao Tseu',
  '"Le bonheur n\'est pas un état, c\'est une direction." — Anonyme',
  '"Croyez en vous-même et tout devient possible." — Anonyme',
  '"La douleur est temporaire, la fierté est éternelle." — Anonyme',
  '"Votre temps est limité, ne le gaspillez pas à vivre la vie de quelqu\'un d\'autre." — Steve Jobs',
  '"Deux choses sont infinies : l\'univers et la bêtise humaine." — Einstein',
];

const faits = [
  "Les pieuvres ont trois cœurs et du sang bleu.",
  "Une journée sur Vénus dure plus longtemps qu'une année sur Vénus.",
  "Les fourmis n'ont pas de poumons.",
  "Les flamants roses naissent blancs.",
  "Le miel ne se périme jamais. On a trouvé du miel vieux de 3000 ans dans des tombes égyptiennes.",
  "Les manchots ont des genoux, cachés sous leurs plumes.",
  "Une pieuvre peut voir les couleurs bien qu'elle soit daltonienne.",
  "La langue d'une baleine bleue pèse autant qu'un éléphant.",
  "Les éléphants sont les seuls animaux qui ne peuvent pas sauter.",
  "Il existe plus d'arbres sur Terre que d'étoiles dans la Voie Lactée.",
];

const devinettes = [
  { q: "Je commence la nuit et je finis le matin. Qui suis-je ?", r: "La lettre N" },
  { q: "Plus je sèche, plus je suis mouillée. Qui suis-je ?", r: "Une serviette" },
  { q: "J'ai des dents mais je ne mords pas. Qui suis-je ?", r: "Un peigne" },
  { q: "Je cours sans jambes. Qui suis-je ?", r: "Le vent" },
  { q: "Qu'est-ce qui a des mains mais ne peut pas applaudir ?", r: "Une horloge" },
  { q: "Plus il y en a, moins on voit. Qu'est-ce que c'est ?", r: "L'obscurité" },
  { q: "Je parle toutes les langues mais je n'ai pas de bouche. Qui suis-je ?", r: "Un dictionnaire" },
];

const horoscopes = {
  belier: "♈ *Bélier* — Excellente journée pour les projets créatifs. Votre énergie est au maximum!",
  taureau: "♉ *Taureau* — Concentrez-vous sur vos finances aujourd'hui. De bonnes opportunités arrivent.",
  gemeaux: "♊ *Gémeaux* — Les communications sont favorisées. Parlez de vos sentiments librement.",
  cancer: "♋ *Cancer* — Journée calme et introspective. Écoutez votre intuition.",
  lion: "♌ *Lion* — Vous brillez aujourd'hui! Profitez de cette énergie positive.",
  vierge: "♍ *Vierge* — Votre organisation vous permettra d'atteindre vos objectifs.",
  balance: "♎ *Balance* — L'harmonie règne dans vos relations. Belle journée en perspective.",
  scorpion: "♏ *Scorpion* — Votre détermination vous mènera loin. Restez concentré.",
  sagittaire: "♐ *Sagittaire* — Aventure et découvertes au programme! Osez sortir de votre zone de confort.",
  capricorne: "♑ *Capricorne* — Travail et persévérance paieront. Continuez vos efforts.",
  verseau: "♒ *Verseau* — Vos idées originales impressionneront. Partagez-les!",
  poissons: "♓ *Poissons* — Créativité et spiritualité sont vos atouts du jour.",
};

module.exports = {
  commands: [
    'joke','blague','citation','devinette','fact','faits','horoscope','zodiac',
    '8ball','ship','rate','choose','coinflip','dice','truth','dare',
    'compliment','insult','neverhaveiever','wyr','wouldyourather',
  ],
  description: 'Divertissement',
  execute: async ({ sock, m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    switch (cmd) {
      case 'joke':
      case 'blague':
        await m.reply(`😂 *Blague du jour*\n\n${blagues[randomInt(0, blagues.length-1)]}`);
        break;
      case 'citation':
        await m.reply(`💭 *Citation inspirante*\n\n${citations[randomInt(0, citations.length-1)]}`);
        break;
      case 'devinette': {
        const d = devinettes[randomInt(0, devinettes.length-1)];
        await m.reply(`🧩 *Devinette*\n\n❓ ${d.q}\n\n||💡 ${d.r}||`);
        break;
      }
      case 'fact':
      case 'faits':
        await m.reply(`🤓 *Fait insolite*\n\n${faits[randomInt(0, faits.length-1)]}`);
        break;
      case 'horoscope':
      case 'zodiac': {
        const signe = args[0]?.toLowerCase();
        if (!signe || !horoscopes[signe]) {
          return await m.reply(`🔮 *Horoscopes disponibles*\n\n${Object.keys(horoscopes).join(', ')}\n\nUsage: ${cfg.PREFIX}horoscope [signe]`);
        }
        await m.reply(`🔮 *Horoscope*\n\n${horoscopes[signe]}`);
        break;
      }
      case '8ball': {
        const reponses = ['Oui absolument!','Sans aucun doute!','Très probablement.','Oui.','Les signes pointent vers oui.','Réponse nébuleuse, réessayez.','Je ne peux pas le prédire maintenant.','Mieux vaut ne pas vous dire.','Non.','Mes sources disent non.','Très improbable.','Certainement pas!'];
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}8ball [question]`);
        await m.reply(`🎱 *Boule Magique 8*\n\n❓ ${q}\n\n🔮 ${reponses[randomInt(0, reponses.length-1)]}`);
        break;
      }
      case 'ship': {
        if (mentions.length < 2) return await m.reply(`Usage: ${cfg.PREFIX}ship @personne1 @personne2`);
        const pct = randomInt(0, 100);
        const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
        const emoji = pct >= 80 ? '💕' : pct >= 50 ? '💛' : pct >= 30 ? '🤝' : '💔';
        await m.reply(`${emoji} *Compatibilité Amoureuse*\n\n👤 @${mentions[0].split('@')[0]}\n🤝 @${mentions[1].split('@')[0]}\n\n[${bar}] ${pct}%\n\n${pct>=80?'Amour parfait!':pct>=50?'Bonne entente!':pct>=30?'Ça peut marcher...':'Incompatibles 😅'}`, { mentions });
        break;
      }
      case 'rate': {
        const target = mentions[0] || m.sender;
        const pct = randomInt(0, 100);
        await m.reply(`⭐ *Note*\n\n@${target.split('@')[0]}: *${pct}/100*\n${'⭐'.repeat(Math.round(pct/20))}`, { mentions: [target] });
        break;
      }
      case 'choose': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}choose option1|option2|option3`);
        const opts = q.split('|').map(s=>s.trim()).filter(Boolean);
        if (opts.length < 2) return await m.reply('Donnez au moins 2 options séparées par |');
        await m.reply(`🎯 *Choix*\n\nJ'ai choisi: *${opts[randomInt(0, opts.length-1)]}*`);
        break;
      }
      case 'coinflip':
        await m.reply(`🪙 *Pile ou Face*\n\n${Math.random()>0.5?'🟡 PILE':'⚪ FACE'}`);
        break;
      case 'dice': {
        const faces = parseInt(args[0]) || 6;
        await m.reply(`🎲 *Dé à ${faces} faces*\n\nRésultat: *${randomInt(1, faces)}*`);
        break;
      }
      case 'truth': {
        const truths = ['Quelle est ta plus grande peur?','As-tu déjà menti à quelqu\'un que tu aimes?','Quel est ton plus grand secret?','Qui est ton crush en ce moment?','Quelle est la chose la plus embarrassante que tu aies faite?'];
        await m.reply(`💬 *Vérité*\n\n${truths[randomInt(0, truths.length-1)]}`);
        break;
      }
      case 'dare': {
        const dares = ['Envoie un message d\'amour à la dernière personne de ta liste de contacts!','Fais 20 pompes maintenant!','Change ton statut WhatsApp en "Je suis le meilleur!"','Appelle quelqu\'au hasard et dis-lui bonjour!','Chante une chanson dans les 30 prochaines secondes!'];
        await m.reply(`🎯 *Défi*\n\n${dares[randomInt(0, dares.length-1)]}`);
        break;
      }
      case 'compliment': {
        const compliments = ['Tu es absolument brillant(e)!','Ta présence illumine tout autour de toi!','Tu es une personne exceptionnelle!','Tu as un sourire qui réchauffe les cœurs!','Tu es fort(e) et courageux(se)!'];
        const target = mentions[0] || m.sender;
        await m.reply(`💝 @${target.split('@')[0]}, ${compliments[randomInt(0, compliments.length-1)]}`, { mentions: [target] });
        break;
      }
      case 'insult': {
        const insults = ['Tu as l\'intelligence d\'une plante verte!','Tu es aussi utile qu\'une sonnette sur une tombe!','Tu as le charme d\'un cactus mouillé!','Tu confonds vitesse et précipitation!','Ta logique ferait pleurer Einstein!'];
        const target = mentions[0] || m.sender;
        await m.reply(`😤 @${target.split('@')[0]}, ${insults[randomInt(0, insults.length-1)]} 😂 (c'est pour rire!)`, { mentions: [target] });
        break;
      }
      case 'neverhaveiever': {
        const items = ['...jamais bu quelque chose de brûlant directement','...jamais eu le fou rire au mauvais moment','...jamais triché à un examen','...jamais menti à un parent','...jamais eu peur dans l\'obscurité'];
        await m.reply(`🤚 *Je n'ai jamais...*\n\n${items[randomInt(0, items.length-1)]}`);
        break;
      }
      case 'wyr':
      case 'wouldyourather': {
        const choices = [
          ['Voler', 'Devenir invisible'],
          ['Avoir beaucoup d\'argent mais pas d\'amis', 'Avoir des amis mais pas d\'argent'],
          ['Vivre dans le passé', 'Vivre dans le futur'],
          ['Ne jamais dormir', 'Dormir toute la journée'],
          ['Parler toutes les langues', 'Jouer de tous les instruments'],
        ];
        const c = choices[randomInt(0, choices.length-1)];
        await m.reply(`🤔 *Tu préférerais...*\n\n🅰️ ${c[0]}\nou\n🅱️ ${c[1]}`);
        break;
      }
    }
  },
};
