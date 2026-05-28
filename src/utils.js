const { proto, getContentType } = require('@whiskeysockets/baileys');

function smsg(sock, m, store) {
  if (!m) return m;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat?.endsWith('@g.us');
    m.sender = m.fromMe
      ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
      : m.isGroup
      ? m.key.participant
      : m.chat;
    if (m.sender?.includes(':')) m.sender = m.sender.split(':')[0] + '@s.whatsapp.net';
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg =
      m.mtype === 'viewOnceMessage'
        ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
        : m.message[m.mtype];
    m.body =
      m.message?.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) ||
      '';
    m.reply = (text) =>
      sock.sendMessage(m.chat, { text: String(text) }, { quoted: m });
    m.replyImage = (buffer, caption = '') =>
      sock.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
    m.react = (emoji) =>
      sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  }
  return m;
}

async function fetchJson(url, opts = {}) {
  const axios = require('axios');
  const res = await axios({ method: 'get', url, ...opts });
  return res.data;
}

async function getBuffer(url) {
  const axios = require('axios');
  const res = await axios({ method: 'get', url, responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

function msToTime(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}j ${h}h ${m}m ${s}s`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

module.exports = { smsg, fetchJson, getBuffer, msToTime, randomInt, sleep, formatNumber };
