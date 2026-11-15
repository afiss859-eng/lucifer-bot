'use strict';

const FLOOD_WINDOW_MS = 10_000;
const FLOOD_LIMIT = 5;
const floodTracker = new Map();

const BAD_WORDS = [
  'connard', 'connasse', 'encule', 'enculee', 'salope', 'putain',
  'merde', 'batard', 'fdp', 'ntm', 'motherfucker', 'fuck you',
];

function isEnabled(db, chat, key) {
  return db?.getNote?.(chat, `__${key}__`) === '1';
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function trackFlood(chat, sender, now, tracker = floodTracker) {
  const key = `${chat}:${sender}`;
  const recent = (tracker.get(key) || []).filter(ts => now - ts < FLOOD_WINDOW_MS);
  recent.push(now);
  tracker.set(key, recent);
  if (tracker.size > 2000) {
    for (const [k, entries] of tracker) {
      if (!entries.length || now - entries[entries.length - 1] > FLOOD_WINDOW_MS * 3) tracker.delete(k);
    }
  }
  return recent.length > FLOOD_LIMIT;
}

function analyzeGroupMessage({
  chat, sender, body, mtype, isViewOnce = false, isForwarded, mentionCount = 0, db, now = Date.now(), tracker,
}) {
  if (!chat || !String(chat).endsWith('@g.us') || !sender) return null;

  const text = normalizeText(body);
  const hasUrl = /(?:https?:\/\/|www\.)\S+/i.test(String(body || ''));
  const hasInvite = /chat\.whatsapp\.com\/[\w-]+/i.test(String(body || ''));

  if (isEnabled(db, chat, 'antiinvite') && hasInvite) return 'Lien d’invitation WhatsApp interdit';
  if (isEnabled(db, chat, 'antilink') && hasUrl) return 'Lien interdit';
  if (isEnabled(db, chat, 'antiads') && hasUrl && /promo|promotion|reduction|code promo|abonnez-vous|vente flash|offre speciale/.test(text)) {
    return 'Publicité interdite';
  }
  if ((isEnabled(db, chat, 'antibadword') || isEnabled(db, chat, 'antivulgaire') || isEnabled(db, chat, 'antiinsult')) &&
      BAD_WORDS.some(word => new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text))) {
    return 'Insulte ou vulgarité interdite';
  }
  if (isEnabled(db, chat, 'antithreat') && /\b(je vais te tuer|je vais te frapper|je vais vous tuer|je vais vous frapper)\b/.test(text)) {
    return 'Menace interdite';
  }
  if (isEnabled(db, chat, 'antiscam') && /(envoyez|envoie|partagez|partage) .{0,35}(code de verification|code whatsapp|mot de passe|code otp)/.test(text)) {
    return 'Tentative probable d’arnaque';
  }
  if (isEnabled(db, chat, 'antiforward') && isForwarded) return 'Message transféré interdit';
  if (isEnabled(db, chat, 'antitag') && mentionCount > 5) return 'Mention massive interdite';
  if (isEnabled(db, chat, 'antiviewonce') && (isViewOnce || /viewonce/i.test(String(mtype || '')))) return 'Média à vue unique interdit';
  if (isEnabled(db, chat, 'antisticker') && /sticker/i.test(String(mtype || ''))) return 'Autocollants interdits';
  if (isEnabled(db, chat, 'antiaudio') && /audio|ptt/i.test(String(mtype || ''))) return 'Messages audio interdits';
  if (isEnabled(db, chat, 'antivideo') && /video/i.test(String(mtype || ''))) return 'Vidéos interdites';
  if (isEnabled(db, chat, 'antiimage') && /image/i.test(String(mtype || ''))) return 'Images interdites';
  if (isEnabled(db, chat, 'antidoc') && /document/i.test(String(mtype || ''))) return 'Documents interdits';
  if (isEnabled(db, chat, 'antigif') && /gif/i.test(String(mtype || ''))) return 'GIF interdits';

  if ((isEnabled(db, chat, 'antispam') || isEnabled(db, chat, 'antiflood')) &&
      trackFlood(chat, sender, now, tracker || floodTracker)) {
    return 'Trop de messages envoyés rapidement';
  }

  return null;
}

function canonicalJid(value) {
  const raw = String(value || '');
  const at = raw.indexOf('@');
  if (at < 0) return raw.split(':')[0];
  return raw.slice(0, at).split(':')[0] + raw.slice(at);
}

function sameJid(a, b) {
  const left = canonicalJid(a);
  const right = canonicalJid(b);
  return !!left && left === right;
}

async function enforceGroupGuard({ sock, m, db, isOwner = false, logger }) {
  if (!m?.isGroup) return false;

  const body = String(m.body || m.text || m.msg?.caption || '');
  const contextInfo = m.msg?.contextInfo ||
    m.msg?.message?.extendedTextMessage?.contextInfo ||
    m.message?.extendedTextMessage?.contextInfo || {};
  const mentionCount = Array.isArray(contextInfo.mentionedJid) ? contextInfo.mentionedJid.length : 0;
  const reason = analyzeGroupMessage({
    chat: m.chat,
    sender: m.sender,
    body,
    mtype: m.mtype,
    isViewOnce: !!m.isViewOnce,
    isForwarded: !!contextInfo.isForwarded || Number(contextInfo.forwardingScore) > 0,
    mentionCount,
    db,
  });
  if (!reason) return false;

  let metadata;
  try {
    metadata = await sock.groupMetadata(m.chat);
  } catch (error) {
    logger?.warn?.(`Protection de groupe: métadonnées indisponibles: ${error.message}`);
    return false;
  }

  const participants = metadata?.participants || [];
  const actor = participants.find(p => sameJid(p.id || p.jid, m.sender));
  if (isOwner || actor?.admin) return false;

  const botJid = sock.user?.id || sock.user?.jid || '';
  const bot = participants.find(p => sameJid(p.id || p.jid, botJid));
  if (!bot?.admin) {
    logger?.warn?.(`Protection ${reason}: le bot doit être administrateur dans ${m.chat} pour supprimer le message.`);
    return false;
  }

  try {
    await sock.sendMessage(m.chat, { delete: m.key });
    logger?.info?.(`Message supprimé dans ${m.chat}: ${reason}`);
    return true;
  } catch (error) {
    logger?.warn?.(`Suppression impossible (${reason}): ${error.message}`);
    return false;
  }
}

module.exports = {
  analyzeGroupMessage,
  enforceGroupGuard,
  canonicalJid,
  sameJid,
  FLOOD_WINDOW_MS,
  FLOOD_LIMIT,
};