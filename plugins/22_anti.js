'use strict';

const { getGroupPermissions } = require('../src/group-permissions');

const SUPPORTED = new Set([
  'antilink', 'antiinvite', 'antispam', 'antiflood',
  'antibadword', 'antivulgaire', 'antiinsult', 'antithreat',
  'antiscam', 'antiads', 'antiforward', 'antisticker',
  'antiaudio', 'antivideo', 'antiimage', 'antidoc',
  'antigif', 'antiviewonce', 'antitag',
]);

const emojiMap = {
  antilink: '🔗', antiinvite: '🚷', antispam: '🚫', antiflood: '🌊',
  antibadword: '🤬', antivulgaire: '🤬', antiinsult: '🛡️',
  antithreat: '⚠️', antiscam: '💸', antiads: '📢', antiforward: '↩️',
  antisticker: '🖼️', antiaudio: '🔊', antivideo: '🎬', antiimage: '📸',
  antidoc: '📄', antigif: '🎞️', antiviewonce: '👁️', antitag: '📣',
};

module.exports = {
  commands: [
    'antilink','antispam','antibadword','antibot','antiflood',
    'antivirtual','antiforward','antisticker','antiaudio','antivideo',
    'antiimage','antidoc','antigif','anticontact','antilocation',
    'antinsfw','antitag','antiviewonce','antimenace','antiraids',
    'antichange','antiinvite','antipromotion','antipoll','antireaction',
    'antijoin','antileave','antidelete','antiread','antiblock',
    'antiprofile','antistatus','antibio','antiname','antigroupe',
    'antiemoji','anticals','antivulgaire','antiinsult','antithreat',
    'antiads','antisales','antipromo','antipolitic','antireligion',
    'antiscam','antiporno','antidrug','antiviolence','antiterror',
  ],
  description: 'Protections de groupe prises en charge',
  execute: async ({ sock, m, args, isOwner, config: cfg, db }) => {
    if (!m.isGroup) return m.reply('❌ Cette commande fonctionne uniquement dans un groupe.');

    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    if (!SUPPORTED.has(cmd)) {
      return m.reply(
        `⚠️ *${cmd.toUpperCase()} n’est pas encore opérationnel.*\n\nAucun réglage n’a été enregistré.\nProtections réellement disponibles :\n${[...SUPPORTED].map(x => `• ${cfg.PREFIX}${x} on/off`).join('\n')}`
      );
    }

    let permissions;
    try {
      permissions = await getGroupPermissions(sock, m.chat, m.sender);
    } catch {
      return m.reply('❌ Impossible de vérifier les administrateurs du groupe.');
    }
    if (!isOwner && !permissions.actorIsAdmin) {
      return m.reply('❌ Seuls les administrateurs du groupe peuvent modifier les protections.');
    }

    const state = String(args[0] || '').toLowerCase();
    const key = `__${cmd}__`;
    const current = db.getNote(m.chat, key) === '1';

    if (!['on', 'off'].includes(state)) {
      return m.reply(
        `${emojiMap[cmd]} *${cmd.toUpperCase()}*\n\nStatut : *${current ? 'ACTIVÉ' : 'DÉSACTIVÉ'}*\n\nUsage : ${cfg.PREFIX}${cmd} on/off\n\n_Nécessite que le bot soit administrateur pour supprimer les messages._`
      );
    }

    db.saveNote(m.chat, key, state === 'on' ? '1' : '0');
    const botNotice = permissions.botIsAdmin
      ? ''
      : '\n\n⚠️ Donnez au bot le rôle administrateur pour qu’il puisse supprimer les messages.';
    return m.reply(`${emojiMap[cmd]} *${cmd.toUpperCase()}* ${state === 'on' ? 'activé' : 'désactivé'}.${botNotice}`);
  },
};