const axios = require('axios');

const BASE_URL = (process.env.AIMODEL_BASE_URL || 'https://aimodelapi.onrender.com/v1').replace(/\/$/, '');
const AIMODEL_KEY = process.env.AIMODEL_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const HNSEC_ENABLED = false; // Intentionally paused until its API contract is provided.

const timeout = Number.parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000;

function headers(key) {
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function enabled(provider) {
  return provider === 'aimodel' ? !!AIMODEL_KEY : provider === 'groq' ? !!GROQ_KEY : false;
}

async function chat(messages, options = {}) {
  const model = options.model || process.env.AI_MODEL || 'dev-x';
  const providers = options.provider === 'groq' ? ['groq'] : options.provider === 'aimodel' ? ['aimodel'] : ['aimodel', 'groq'];
  let lastError;

  for (const provider of providers) {
    if (!enabled(provider)) continue;
    try {
      const baseURL = provider === 'aimodel' ? BASE_URL : 'https://api.groq.com/openai/v1';
      const response = await axios.post(`${baseURL}/chat/completions`, {
        model: provider === 'groq' ? (options.groqModel || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') : model,
        messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens || 2048,
      }, { headers: headers(provider === 'aimodel' ? AIMODEL_KEY : GROQ_KEY), timeout });
      const text = response.data?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${provider}: réponse vide`);
      return { text, provider, model: response.data?.model || model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Aucun fournisseur IA configuré.');
}

async function generateImage(prompt, options = {}) {
  if (!AIMODEL_KEY) throw new Error('AIMODEL_API_KEY non configurée.');
  const response = await axios.post(`${BASE_URL}/images/generations`, {
    model: options.model || process.env.AI_IMAGE_MODEL || 'image-gen',
    prompt,
    n: 1,
    size: options.size || '1024x1024',
  }, { headers: headers(AIMODEL_KEY), timeout: Math.max(timeout, 60000) });
  const item = response.data?.data?.[0];
  if (!item?.url && !item?.b64_json) throw new Error('API image: réponse sans image.');
  return item;
}

function status() {
  return { aimodel: !!AIMODEL_KEY, groq: !!GROQ_KEY, hnsec: HNSEC_ENABLED, baseURL: BASE_URL };
}

module.exports = { chat, generateImage, status, HNSEC_ENABLED };
