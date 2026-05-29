/**
 * Plugin 35 — Horoscope, Blague & Citations
 * Commandes: .horoscope, .blague, .citation, .motdujour, .fait, .defi
 */
const axios = require('axios');

const SIGNES = ['bélier','taureau','gémeaux','cancer','lion','vierge','balance','scorpion','sagittaire','capricorne','verseau','poissons'];
const SIGNES_EN = { 'bélier':'aries','taureau':'taurus','gémeaux':'gemini','cancer':'cancer','lion':'leo','vierge':'virgo','balance':'libra','scorpion':'scorpio','sagittaire':'sagittarius','capricorne':'capricorn','verseau':'aquarius','poissons':'pisces' };

const BLAGUES = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant? Parce que sinon ils tomberaient dans le bateau! 😄",
  "Un homme entre dans une bibliothèque et dit : «Un steak haché et des frites.» La bibliothécaire répond : «Monsieur, ici c'est une bibliothèque.» L'homme chuchote : «Pardon... un steak haché et des frites.» 🤫",
  "Qu'est-ce qu'un canif ? Un petit fien! 😂",
  "Pourquoi les Belges mettent-ils leurs fromages dans des bouteilles? Pour faire du lait concentré! 🧀",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël? Un chat-peint de Noël! 🎄",
  "Qu'est-ce qu'un crocodile qui surveille une valise? Un sac à dents! 👜",
  "Pourquoi les fantômes ne mentent-ils jamais? Parce qu'on peut voir à travers eux! 👻",
  "Comment s'appelle le chat qui mange des haricots? Ari-miaou! 🐱",
];

const CITATIONS = [
  { text: "La vie c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", author: "Albert Einstein" },
  { text: "Le succès c'est se promener d'échec en échec tout en restant motivé.", author: "Winston Churchill" },
  { text: "Soyez le changement que vous voulez voir dans le monde.", author: "Mahatma Gandhi" },
  { text: "Le seul moyen de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "L'imagination est plus importante que le savoir.", author: "Albert Einstein" },
  { text: "La persévérance est la clé du succès.", author: "Charles De Gaulle" },
  { text: "Chaque accomplissement commence par la décision d'essayer.", author: "John F. Kennedy" },
  { text: "Ne comptez pas les jours, faites que les jours comptent.", author: "Muhammad Ali" },
  { text: "Le meilleur moyen de prédire l'avenir est de le créer.", author: "Peter Drucker" },
  { text: "Toute notre vie n'est que le fruit de nos pensées.", author: "Marc Aurèle" },
];

const DEFIS = [
  "🏃 Faites 20 pompes maintenant!",
  "🧘 Méditez 5 minutes les yeux fermés.",
  "📞 Appelez quelqu'un que vous n'avez pas contacté depuis longtemps.",
  "💧 Buvez 2 grands verres d'eau.",
  "📚 Lisez 10 pages d'un livre.",
  "😊 Faites sourire quelqu'un aujourd'hui.",
  "🎵 Écoutez votre chanson préférée et dansez!",
  "✍️ Écrivez 3 choses pour lesquelles vous êtes reconnaissant.",
  "🌿 Faites une promenade de 15 minutes.",
  "📵 Posez votre téléphone pendant 30 minutes.",
];

module.exports = {
  commands: ['horoscope','blague','joke','citation','quote','motdujour','fait','faitalea','defi','challenge'],
  description: 'Horoscope, blagues, citations & défis',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch(cmd) {
      case 'horoscope': {
        const signe = (args[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const signeList = SIGNES.map(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,''));
        if (!signe || !signeList.includes(signe)) {
          return await m.reply(`♈ *Horoscope*\n\nUsage: ${cfg.PREFIX}horoscope [signe]\n\nSignes disponibles:\n${SIGNES.map((s,i) => `${['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'][i]} ${s}`).join('\n')}`);
        }
        const idx = signeList.indexOf(signe);
        const signeFr = SIGNES[idx];
        const signeEn = SIGNES_EN[signeFr] || signe;
        await m.react('🔮');
        try {
          const res = await axios.get(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${signeEn}&day=TODAY`, { timeout: 10000 });
          const data = res.data?.data;
          const emojis = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
          await m.reply(`${emojis[idx]} *Horoscope ${signeFr.charAt(0).toUpperCase()+signeFr.slice(1)}*\n\n📅 Aujourd'hui\n\n${data?.horoscope_data || 'Disponible bientôt.'}\n\n💫 _(Traduit automatiquement)_`);
        } catch {
          // Horoscope généré localement
          const forecasts = [
            `Les astres vous sont favorables aujourd'hui. Profitez-en pour avancer vos projets.`,
            `Une rencontre inattendue pourrait changer votre journée. Restez ouvert.`,
            `Prenez soin de votre santé aujourd'hui. Repos et nutrition sont essentiels.`,
            `Votre créativité est à son apogée. Exprimez-vous sans retenue.`,
          ];
          const f = forecasts[Math.floor(Math.random()*forecasts.length)];
          await m.reply(`${emojis[idx]} *Horoscope ${signeFr.charAt(0).toUpperCase()+signeFr.slice(1)}*\n\n📅 Aujourd'hui\n\n🔮 ${f}\n\n💛 Amour: ${'⭐'.repeat(Math.floor(Math.random()*3)+3)}\n💼 Travail: ${'⭐'.repeat(Math.floor(Math.random()*3)+3)}\n💰 Finance: ${'⭐'.repeat(Math.floor(Math.random()*3)+3)}`);
        }
        break;
      }

      case 'blague':
      case 'joke': {
        await m.react('😂');
        const blague = BLAGUES[Math.floor(Math.random()*BLAGUES.length)];
        await m.reply(`😂 *Blague du jour*\n\n${blague}`);
        break;
      }

      case 'citation':
      case 'quote': {
        await m.react('💭');
        const cit = CITATIONS[Math.floor(Math.random()*CITATIONS.length)];
        await m.reply(`💭 *Citation inspirante*\n\n_"${cit.text}"_\n\n— *${cit.author}*`);
        break;
      }

      case 'motdujour': {
        const mots = [
          { mot: 'Sérendipité', def: 'Fait de trouver quelque chose d\'intéressant par hasard.' },
          { mot: 'Épiphanie', def: 'Apparition, manifestation divine ; prise de conscience soudaine.' },
          { mot: 'Résilience', def: 'Capacité à surmonter les épreuves difficiles.' },
          { mot: 'Bienveillance', def: 'Disposition affective d\'une volonté qui vise le bien d\'autrui.' },
          { mot: 'Mélancolie', def: 'État d\'abattement, de tristesse vague et profonde.' },
          { mot: 'Osmose', def: 'Communication, pénétration mutuelle d\'idées ou de sentiments.' },
          { mot: 'Perspicace', def: 'Qui voit avec pénétration, qui comprend vite.' },
        ];
        const mot = mots[new Date().getDate() % mots.length];
        await m.reply(`📖 *Mot du jour*\n\n✨ *${mot.mot}*\n\n📝 ${mot.def}`);
        break;
      }

      case 'fait':
      case 'faitalea': {
        const faits = [
          "🐙 Les pieuvres ont trois cœurs et leur sang est bleu.",
          "🍯 Le miel ne se périme jamais. Des pots vieux de 3000 ans ont été retrouvés en Égypte.",
          "🦷 L'émail des dents est la substance la plus dure du corps humain.",
          "🐘 Les éléphants sont les seuls animaux qui ne peuvent pas sauter.",
          "🌙 Sur la Lune, un astronaute pèse 6 fois moins qu'sur Terre.",
          "🧠 Le cerveau humain génère environ 70 000 pensées par jour.",
          "🐠 Les poissons peuvent se noyer si l'eau manque d'oxygène.",
          "⚡ La foudre frappe la Terre environ 100 fois par seconde.",
        ];
        await m.reply(`🔬 *Fait aléatoire*\n\n${faits[Math.floor(Math.random()*faits.length)]}`);
        break;
      }

      case 'defi':
      case 'challenge': {
        await m.react('💪');
        const defi = DEFIS[Math.floor(Math.random()*DEFIS.length)];
        await m.reply(`💪 *Défi du jour*\n\n${defi}\n\n_Relevez le défi et dites-moi si vous l'avez fait!_`);
        break;
      }
    }
  },
};
