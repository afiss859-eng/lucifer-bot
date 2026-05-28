/**
 * 𓅂 DOMA LUCIFERO — Plugin IA (29)
 * Intégration IA: ChatGPT-style via Groq (gratuit) + Gemini + fallback
 * Commandes: .ai, .chat, .gpt, .gemini, .imagine2, .code2, .translate2, .resume2, .correct, .poem2
 */

const axios = require('axios');

// ─── Prompts système ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu t'appelles 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 AI, une IA intégrée dans un bot WhatsApp ultra-puissant nommé 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂.
Tu réponds toujours en français (sauf si on te parle dans une autre langue).
Tu es intelligent, utile, direct et légèrement mystérieux. Tu peux coder, expliquer, traduire, écrire des poèmes.
Garde tes réponses concises et lisibles sur WhatsApp (utilise des émojis et des sauts de ligne).`;

// ─── Mémoire de conversation (par utilisateur) ────────────────────────────────
const conversations = new Map();

function getHistory(jid) {
  if (!conversations.has(jid)) conversations.set(jid, []);
  return conversations.get(jid);
}

function addToHistory(jid, role, content) {
  const hist = getHistory(jid);
  hist.push({ role, content });
  if (hist.length > 10) hist.splice(0, 2); // Garde les 5 derniers échanges
}

// ─── Appel API Groq (Llama3 — GRATUIT) ───────────────────────────────────────
async function callGroq(jid, userMsg) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY non configurée');

  addToHistory(jid, 'user', userMsg);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...getHistory(jid),
  ];

  const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama3-8b-8192',
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const reply = res.data.choices[0].message.content;
  addToHistory(jid, 'assistant', reply);
  return reply;
}

// ─── Appel API Gemini (GRATUIT) ────────────────────────────────────────────────
async function callGemini(jid, userMsg) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurée');

  const hist = getHistory(jid);
  const contents = [];
  for (const h of hist) {
    contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
  }
  contents.push({ role: 'user', parts: [{ text: userMsg }] });

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    },
    { timeout: 30000 }
  );

  const reply = res.data.candidates[0].content.parts[0].text;
  addToHistory(jid, 'user', userMsg);
  addToHistory(jid, 'assistant', reply);
  return reply;
}

// ─── Appel API gratuit (fallback sans clé) ────────────────────────────────────
async function callFreeAI(userMsg) {
  // API publique sans clé (peut être instable)
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: userMsg }], max_tokens: 512 },
      { headers: { Authorization: 'Bearer free' }, timeout: 10000 }
    );
    return res.data.choices[0].message.content;
  } catch {
    // Vraiment gratuit et public:
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMsg)}&format=json&no_html=1`, { timeout: 10000 });
    const abstract = res.data?.AbstractText;
    if (abstract) return `📖 ${abstract}`;
    throw new Error('Aucune API disponible');
  }
}

// ─── Fonction principale de sélection d'IA ────────────────────────────────────
async function callAI(jid, userMsg, preferGemini = false) {
  if (preferGemini && process.env.GEMINI_API_KEY) return await callGemini(jid, userMsg);
  if (process.env.GROQ_API_KEY) return await callGroq(jid, userMsg);
  if (process.env.GEMINI_API_KEY) return await callGemini(jid, userMsg);
  // Fallback sans clé
  return await callFreeAI(userMsg);
}

// ─── Plugin ──────────────────────────────────────────────────────────────────
module.exports = {
  commands: [
    'ai', 'chat', 'gpt', 'gemini2', 'ia',
    'aicode', 'aitranslate', 'aipoem', 'aisummary', 'aicorrect',
    'aihelp', 'aistory', 'aireset', 'aistats2',
  ],
  description: 'Intelligence Artificielle (IA)',

  execute: async ({ sock, m, args, q, isOwner, isVip, config: cfg, logger }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const jid = m.sender;

    // Certaines commandes IA réservées aux VIP
    const vipCmds = ['aistory', 'aicode', 'aisummary'];
    if (vipCmds.includes(cmd) && !isVip) {
      return await m.reply(`👑 *Commande VIP*\n\nCette commande IA est réservée aux membres VIP.\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
    }

    switch (cmd) {
      // ── Chat général ──────────────────────────────────────────────────────
      case 'ai':
      case 'chat':
      case 'gpt':
      case 'ia': {
        if (!q) return await m.reply(`🤖 *Lucifero AI*\n\nUsage: ${cfg.PREFIX}ai [votre question]\n\nEx: ${cfg.PREFIX}ai Explique-moi la relativité\n\n_Modèles: Groq Llama3 / Gemini Flash_`);
        await m.react('🤖');
        try {
          const response = await callAI(jid, q);
          await m.reply(`🤖 *Lucifero AI*\n\n${response}`);
        } catch (e) {
          logger.error('AI error:', e.message);
          await m.reply(`❌ *Erreur IA*\n\n${e.message.includes('clé') ? e.message : 'Service temporairement indisponible.'}\n\n💡 Configurez ${e.message.includes('GROQ') ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'} dans votre .env\n\n🔗 Clé gratuite Groq: https://console.groq.com/keys`);
        }
        break;
      }

      case 'gemini2': {
        if (!q) return await m.reply(`♊ *Gemini AI*\n\nUsage: ${cfg.PREFIX}gemini2 [question]`);
        if (!process.env.GEMINI_API_KEY) return await m.reply(`❌ *Gemini non configuré*\n\n1. Créez une clé gratuite: https://aistudio.google.com/apikey\n2. Ajoutez dans .env: GEMINI_API_KEY=votre_clé`);
        await m.react('♊');
        try {
          const response = await callGemini(jid, q);
          await m.reply(`♊ *Gemini AI*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur Gemini: ${e.message}`);
        }
        break;
      }

      // ── Code ──────────────────────────────────────────────────────────────
      case 'aicode': {
        if (!q) return await m.reply(`💻 *AI Code*\n\nUsage: ${cfg.PREFIX}aicode [description]\n\nEx: ${cfg.PREFIX}aicode Fonction Python pour trier une liste`);
        await m.react('💻');
        try {
          const prompt = `Écris du code pour: ${q}\n\nRéponds UNIQUEMENT avec le code + une courte explication. Format WhatsApp.`;
          const response = await callAI(jid + ':code', prompt);
          await m.reply(`💻 *AI Code*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Traduction ────────────────────────────────────────────────────────
      case 'aitranslate': {
        if (!q) return await m.reply(`🌐 *AI Traduction*\n\nUsage: ${cfg.PREFIX}aitranslate [langue] [texte]\n\nEx: ${cfg.PREFIX}aitranslate anglais Bonjour comment ça va`);
        await m.react('🌐');
        try {
          const [lang, ...rest] = args;
          const text = rest.join(' ');
          const prompt = `Traduis ce texte en ${lang || 'anglais'}: "${text || q}"\n\nDonne uniquement la traduction, sans explication.`;
          const response = await callAI(jid + ':translate', prompt);
          await m.reply(`🌐 *Traduction*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Poème ─────────────────────────────────────────────────────────────
      case 'aipoem': {
        const subject = q || 'la nuit et les étoiles';
        await m.react('📝');
        try {
          const prompt = `Écris un court poème de 4-6 lignes en français sur: ${subject}\nStyle: lyrique et mystérieux. Sans titre.`;
          const response = await callAI(jid + ':poem', prompt);
          await m.reply(`📝 *Poème IA*\n\n_${response}_\n\n— 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 AI`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Résumé ────────────────────────────────────────────────────────────
      case 'aisummary': {
        if (!q) return await m.reply(`📋 *AI Résumé*\n\nUsage: ${cfg.PREFIX}aisummary [texte long à résumer]`);
        await m.react('📋');
        try {
          const prompt = `Résume ce texte en 3-5 points clés (format liste):\n\n${q}`;
          const response = await callAI(jid + ':summary', prompt);
          await m.reply(`📋 *Résumé IA*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Correction ────────────────────────────────────────────────────────
      case 'aicorrect': {
        if (!q) return await m.reply(`✍️ *Correction IA*\n\nUsage: ${cfg.PREFIX}aicorrect [texte à corriger]`);
        await m.react('✍️');
        try {
          const prompt = `Corrige les fautes d'orthographe et de grammaire dans ce texte, puis donne le texte corrigé:\n\n"${q}"\n\nRéponds: "✅ Texte corrigé:\n[texte corrigé]\n\n📝 Corrections: [liste des corrections]"`;
          const response = await callAI(jid + ':correct', prompt);
          await m.reply(`✍️ *Correction IA*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Histoire ──────────────────────────────────────────────────────────
      case 'aistory': {
        const theme = q || 'un héros mystérieux dans un monde sombre';
        await m.react('📖');
        try {
          const prompt = `Écris une courte histoire créative (200-300 mots) sur: ${theme}\nStyle: engageant et avec une fin surprenante.`;
          const response = await callAI(jid + ':story', prompt);
          await m.reply(`📖 *Histoire IA*\n\n${response}`);
        } catch (e) {
          await m.reply(`❌ Erreur: ${e.message}`);
        }
        break;
      }

      // ── Reset historique ──────────────────────────────────────────────────
      case 'aireset':
        conversations.delete(jid);
        conversations.delete(jid + ':code');
        conversations.delete(jid + ':translate');
        await m.reply(`🔄 *Mémoire IA réinitialisée*\n\nVotre historique de conversation a été effacé.`);
        break;

      // ── Aide & Stats ──────────────────────────────────────────────────────
      case 'aihelp':
        await m.reply(`🤖 *Commandes IA Disponibles*\n\n📌 *Général:*\n• ${cfg.PREFIX}ai [question] — Chat IA\n• ${cfg.PREFIX}gemini2 [question] — Gemini AI\n• ${cfg.PREFIX}aireset — Effacer mémoire\n\n👑 *VIP seulement:*\n• ${cfg.PREFIX}aicode [desc] — Générer du code\n• ${cfg.PREFIX}aisummary [texte] — Résumer\n• ${cfg.PREFIX}aistory [thème] — Histoire\n\n🆓 *Gratuit:*\n• ${cfg.PREFIX}aitranslate [lang] [texte]\n• ${cfg.PREFIX}aipoem [sujet]\n• ${cfg.PREFIX}aicorrect [texte]\n\n⚙️ *Config requise (.env):*\n• GROQ_API_KEY (gratuit: console.groq.com)\n• GEMINI_API_KEY (gratuit: aistudio.google.com)`);
        break;

      case 'aistats2': {
        const hist = getHistory(jid);
        const hasGroq = !!process.env.GROQ_API_KEY;
        const hasGemini = !!process.env.GEMINI_API_KEY;
        await m.reply(`📊 *Stats IA*\n\n🤖 Modèles disponibles:\n• Groq Llama3: ${hasGroq ? '✅ Configuré' : '❌ Non configuré'}\n• Google Gemini: ${hasGemini ? '✅ Configuré' : '❌ Non configuré'}\n\n💬 Votre historique: ${hist.length} messages\n\n💡 Clé gratuite Groq: https://console.groq.com/keys`);
        break;
      }

      default:
        await m.reply(`🤖 *IA*\n\nUtilisez ${cfg.PREFIX}aihelp pour voir toutes les commandes IA.`);
    }
  },
};
