const { getContentType } = require('@whiskeysockets/baileys');

function smsg(sock, m) {
  if (!m) return m;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = !!m.key.fromMe;
    m.isGroup = m.chat?.endsWith('@g.us');
    m.sender = m.fromMe
      ? (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net'
      : m.isGroup
        ? m.key.participant
        : m.chat;
    if (m.sender?.includes(':')) m.sender = m.sender.split(':')[0] + '@s.whatsapp.net';
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = m.mtype === 'viewOnceMessage'
      ? m.message[m.mtype]?.message?.[getContentType(m.message[m.mtype]?.message || {})]
      : m.message[m.mtype];

    m.body = m.message.conversation || m.msg?.caption || m.msg?.text ||
      (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) || '';

    m.reply = (text, options = {}) =>
      sock.sendMessage(m.chat, { text: String(text) }, { quoted: m, ...options });
    m.replyImage = (buffer, caption = '') =>
      sock.sendMessage(m.chat, { image: buffer, caption: String(caption) }, { quoted: m });
    m.react = (emoji) =>
      sock.sendMessage(m.chat, { react: { text: String(emoji), key: m.key } });
  }
  return m;
}

async function fetchJson(url, opts = {}) {
  const axios = require('axios');
  const res = await axios({ method: 'get', url, timeout: 30000, ...opts });
  return res.data;
}

async function getBuffer(url, opts = {}) {
  const axios = require('axios');
  const res = await axios({ method: 'get', url, responseType: 'arraybuffer', timeout: 30000, ...opts });
  return Buffer.from(res.data);
}

function msToTime(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}j ${h}h ${m}m ${s}s`;
}

function randomInt(min, max) {
  min = Math.ceil(Number(min)); max = Math.floor(Number(max));
  if (max < min) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function formatNumber(n) {
  return Number(n || 0).toLocaleString('fr-FR');
}

module.exports = { smsg, fetchJson, getBuffer, msToTime, randomInt, sleep, formatNumber };
