const groupSettings = new Map();

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
  description: 'Système ANTI (protection)',
  execute: async ({ sock, m, args, isOwner, isVip, config: cfg, db }) => {
    if (!m.isGroup) return await m.reply('❌ Groupe uniquement!');
    if (!isOwner && !isVip) return await m.reply('❌ Admin/Owner uniquement!');

    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const state = args[0]?.toLowerCase();

    const settingKey = `__${cmd}__`;
    const current = db.getNote(m.chat, settingKey);

    if (!state || (state !== 'on' && state !== 'off')) {
      const status = current === '1' ? '✅ ON' : '❌ OFF';
      return await m.reply(`⚙️ *${cmd.toUpperCase()}*\n\nStatut actuel: *${status}*\n\nUsage:\n• ${cfg.PREFIX}${cmd} on\n• ${cfg.PREFIX}${cmd} off`);
    }

    const value = state === 'on' ? '1' : '0';
    db.saveNote(m.chat, settingKey, value);

    const emojiMap = {
      antilink: '🔗', antispam: '🚫', antibadword: '🤬', antibot: '🤖', antiflood: '🌊',
      antivirtual: '📱', antiforward: '↩️', antisticker: '🖼️', antiaudio: '🔊', antivideo: '🎬',
      antiimage: '📸', antidoc: '📄', antigif: '🎠', anticontact: '📞', antilocation: '📍',
      antinsfw: '🔞', antitag: '📢', antiviewonce: '👁️', antimenace: '⚠️', antiraids: '🛡️',
      antiscam: '💸', antiporno: '🔞', antidrug: '💊', antiviolence: '🔪', antiterror: '💣',
    };

    const emoji = emojiMap[cmd] || '🛡️';
    await m.reply(`${emoji} *${cmd.toUpperCase()}*\n\n${state === 'on' ? '✅ *ACTIVÉ*' : '❌ *DÉSACTIVÉ*'}\n\n_Paramètre mis à jour dans *${(await sock.groupMetadata(m.chat)).subject}*_`);
  },
};
