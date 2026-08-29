const { chat, generateImage } = require('../src/ai');

const histories = new Map();
const MAX_HISTORY = 12;

function key(m) { return m.sender || m.chat; }
function getHistory(k) { return histories.get(k) || []; }
function saveHistory(k, history) { histories.set(k, history.slice(-MAX_HISTORY)); }

module.exports = {
  commands: ['ai', 'ask', 'imagine', 'aiimage', 'aicode', 'translate', 'summarize', 'aistatus', 'resetai'],
  description: 'IA multi-fournisseur (AI Model API + Groq)',
  execute: async ({ m, args, config }) => {
    const cmd = m.body.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    const prompt = args.join(' ').trim();
    if (cmd === 'resetai') { histories.delete(key(m)); return m.reply('🧠 Historique IA réinitialisé.'); }
    if (cmd === 'aistatus') {
      const { status } = require('../src/ai');
      const s = status();
      return m.reply(`🤖 *IA Lucifer*\n\nAI Model API: ${s.aimodel ? '🟢 active' : '🔴 clé absente'}\nGroq: ${s.groq ? '🟢 active' : '🔴 clé absente'}\nHNSEC: ⏸️ en pause`);
    }
    if (!prompt) return m.reply(`Usage: ${config.PREFIX}${cmd} votre demande`);

    try {
      if (cmd === 'imagine' || cmd === 'aiimage') {
        const image = await generateImage(prompt);
        if (image.url) return m.reply(`🖼️ ${image.url}`);
        return m.reply('🖼️ Image générée, mais l’API a renvoyé des données qui nécessitent un traitement local.');
      }

      let system = 'Tu es Lucifer Bot, un assistant utile, précis et respectueux. Réponds en français sauf si l’utilisateur demande une autre langue.';
      if (cmd === 'aicode') system += ' Tu es particulièrement compétent en programmation. Donne du code complet et explique brièvement les points importants.';
      if (cmd === 'translate') system += ' Traduis le texte fourni naturellement. Si aucune langue cible n’est indiquée, demande-la.';
      if (cmd === 'summarize') system += ' Résume le texte fourni avec les idées essentielles, sans inventer d’informations.';

      const k = key(m);
      const history = getHistory(k);
      const messages = [{ role: 'system', content: system }, ...history, { role: 'user', content: prompt }];
      const result = await chat(messages);
      saveHistory(k, [...history, { role: 'user', content: prompt }, { role: 'assistant', content: result.text }]);
      await m.reply(`🤖 *Lucifer IA* · ${result.provider}\n\n${result.text}`);
    } catch (error) {
      await m.reply(`❌ IA indisponible : ${error?.message || 'erreur inconnue'}`);
    }
  },
};
