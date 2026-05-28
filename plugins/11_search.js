const { fetchJson } = require('../src/utils');

module.exports = {
  commands: [
    'wiki','define','country','capital','flag','population',
    'crypto','covid','color','ip2','cat','dog','fox','duck',
    'joke2','advice','quote','trivia2','number2','year',
    'bible','quran','dictionary','synonym','antonym',
  ],
  description: 'Commandes de recherche',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'wiki': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}wiki [sujet]`);
        try {
          const data = await fetchJson(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
          if (data.type === 'disambiguation' || !data.extract) return await m.reply(`❌ Aucun résultat pour "${q}"`);
          const text = data.extract?.substring(0, 800);
          await m.reply(`📚 *Wikipedia: ${data.title}*\n\n${text}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`);
        } catch { await m.reply(`❌ Erreur lors de la recherche Wikipedia.`); }
        break;
      }
      case 'crypto': {
        const coin = (args[0] || 'bitcoin').toLowerCase();
        try {
          const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,eur&include_24hr_change=true`);
          const info = data[coin];
          if (!info) return await m.reply(`❌ Crypto "${coin}" introuvable.`);
          const change = info.usd_24h_change?.toFixed(2);
          const arrow = change >= 0 ? '📈' : '📉';
          await m.reply(`₿ *${coin.toUpperCase()}*\n\n💵 USD: *$${info.usd?.toLocaleString()}*\n💶 EUR: *€${info.eur?.toLocaleString()}*\n${arrow} 24h: *${change}%*`);
        } catch { await m.reply(`❌ Erreur lors de la récupération du prix.`); }
        break;
      }
      case 'cat': {
        try {
          const data = await fetchJson('https://api.thecatapi.com/v1/images/search');
          await m.replyImage(Buffer.from(await (await (await import('node-fetch')).default(data[0].url)).arrayBuffer()), '🐱 Voici un chat mignon!');
        } catch { await m.reply('🐱 Miaou! Voici un chat imaginaire: 🐱'); }
        break;
      }
      case 'dog': {
        try {
          const data = await fetchJson('https://dog.ceo/api/breeds/image/random');
          await m.replyImage(Buffer.from(await (await (await import('node-fetch')).default(data.message)).arrayBuffer()), '🐶 Voici un chien mignon!');
        } catch { await m.reply('🐶 Woof! Voici un chien imaginaire: 🐶'); }
        break;
      }
      case 'advice': {
        try {
          const data = await fetchJson('https://api.adviceslip.com/advice');
          await m.reply(`💡 *Conseil du jour*\n\n_"${data.slip.advice}"_`);
        } catch { await m.reply(`💡 *Conseil*\n\n_Soyez patient, le succès viendra._`); }
        break;
      }
      case 'trivia2': {
        try {
          const data = await fetchJson('https://opentdb.com/api.php?amount=1&type=multiple&lang=fr');
          const q2 = data.results[0];
          const answers = [...q2.incorrect_answers, q2.correct_answer].sort(()=>Math.random()-0.5);
          const letters = ['A','B','C','D'];
          const opts = answers.map((a,i)=>`${letters[i]}. ${a}`).join('\n');
          await m.reply(`🎓 *Trivia*\n\n❓ ${q2.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'")}\n\n${opts}\n\n_Catégorie: ${q2.category}_`);
        } catch { await m.reply(`🎓 *Trivia*\n\n❓ Quelle est la capitale de la France?\nA. Lyon\nB. Paris\nC. Marseille\nD. Nice\n\n||Réponse: B. Paris||`); }
        break;
      }
      case 'country': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}country [pays]`);
        try {
          const data = await fetchJson(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
          const c = data[0];
          const langs = Object.values(c.languages||{}).join(', ');
          const curr = Object.values(c.currencies||{}).map(x=>x.name).join(', ');
          await m.reply(`🌍 *${c.name.common}*\n\n🏛️ Capitale: ${c.capital?.[0]||'N/A'}\n👥 Population: ${c.population?.toLocaleString()}\n🗣️ Langue(s): ${langs}\n💰 Monnaie: ${curr}\n🌐 Région: ${c.region}\n${c.flag} Drapeau`);
        } catch { await m.reply(`❌ Pays "${q}" introuvable.`); }
        break;
      }
      case 'ip2': {
        const ip = args[0];
        if (!ip) return await m.reply(`Usage: ${cfg.PREFIX}ip2 [adresse IP]`);
        try {
          const data = await fetchJson(`http://ip-api.com/json/${ip}?lang=fr`);
          if (data.status !== 'success') return await m.reply('❌ IP invalide ou non trouvée.');
          await m.reply(`🌐 *Info IP*\n\n📍 IP: ${data.query}\n🌍 Pays: ${data.country}\n🏙️ Ville: ${data.city}\n📡 FAI: ${data.isp}\n🕐 Fuseau: ${data.timezone}`);
        } catch { await m.reply('❌ Erreur lors de la récupération des infos IP.'); }
        break;
      }
      case 'quote': {
        const quotes = [
          {q:"Le succès c'est tomber sept fois, se relever huit.", a:"Proverbe japonais"},
          {q:"La vie est ce qui arrive pendant qu'on fait d'autres projets.", a:"John Lennon"},
          {q:"Soyez le changement que vous souhaitez voir dans le monde.", a:"Gandhi"},
          {q:"L'imagination est plus importante que le savoir.", a:"Einstein"},
          {q:"Celui qui déplace des montagnes commence par enlever les petites pierres.", a:"Confucius"},
        ];
        const r = quotes[Math.floor(Math.random()*quotes.length)];
        await m.reply(`💬 *Citation*\n\n_"${r.q}"_\n\n— *${r.a}*`);
        break;
      }
      case 'color': {
        const hex = args[0]?.replace('#','') || Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        await m.reply(`🎨 *Couleur #${hex.toUpperCase()}*\n\n🔴 Rouge: ${r}\n🟢 Vert: ${g}\n🔵 Bleu: ${b}\n\n🔗 https://www.color-hex.com/color/${hex}`);
        break;
      }
    }
  },
};
