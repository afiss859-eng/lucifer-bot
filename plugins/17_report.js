module.exports = {
  commands: ['report'],
  description: 'Signaler un membre aux administrateurs du groupe',
  groupOnly: true,
  execute: async ({ sock, m, args, config }) => {
    const jid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!jid) return m.reply(`Usage: ${config.PREFIX}report @membre spam`);

    const reason = args.slice(1).join(' ').trim();
    if (!reason) return m.reply(`Usage: ${config.PREFIX}report @membre spam`);
    if (jid === m.sender) return m.reply('❌ Vous ne pouvez pas vous signaler vous-même.');

    const groupJid = m.chat;
    const meta = await sock.groupMetadata(groupJid);
    const admins = (meta.participants || [])
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id)
      .filter(Boolean);

    if (!admins.length) return m.reply('❌ Aucun administrateur disponible pour recevoir le signalement.');

    const reporter = m.sender?.split('@')[0] || 'inconnu';
    const target = jid.split('@')[0];
    const text = [
      '🚨 *NOUVEAU SIGNALEMENT*',
      '',
      `👤 Signalé : @${target}`,
      `📝 Motif : ${reason.slice(0, 500)}`,
      `👮 Signalé par : @${reporter}`,
      `👥 Groupe : ${meta.subject || groupJid}`,
      '',
      '⚠️ Ce signalement est transmis aux administrateurs du groupe. Pour un signalement officiel à WhatsApp, utilisez également la fonction « Signaler » de WhatsApp.'
    ].join('\n');

    for (const admin of admins) {
      try {
        await sock.sendMessage(admin, { text, mentions: [jid, m.sender].filter(Boolean) });
      } catch (_) {}
    }

    await m.reply(`✅ Signalement envoyé aux ${admins.length} administrateur(s).\n👤 @${target}\n📝 ${reason.slice(0, 200)}`, { mentions: [jid] });
  },
};
