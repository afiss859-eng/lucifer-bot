'use strict';

const { sameJid } = require('./group-guard');

async function getGroupPermissions(sock, chat, actorJid) {
  const metadata = await sock.groupMetadata(chat);
  const participants = metadata?.participants || [];
  const actor = participants.find(p => sameJid(p.id || p.jid, actorJid));
  const botJid = sock.user?.id || sock.user?.jid || '';
  const bot = participants.find(p => sameJid(p.id || p.jid, botJid));
  return {
    metadata,
    actorIsAdmin: !!actor?.admin,
    botIsAdmin: !!bot?.admin,
  };
}

module.exports = { getGroupPermissions };