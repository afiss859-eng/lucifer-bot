const { getGroupPermissions } = require('../src/group-permissions');

module.exports = {
  commands: [
    'tagall','kick','add','promote','demote','groupinfo','linkgroup',
    'revoke','open','close','setdesc','setname','members','admins',
    'poll','warn','warns','resetwarn','mute','unmute',
  ],
  description: 'Gestion de groupe',
  execute: async ({ sock, m, args, q, isOwner, isVip, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    const requireGroup = async () => {
      if (!m.isGroup) { await m.reply('❌ Groupe uniquement!'); return false; }
      return true;
    };

    const requireAdmin = async (needsBotAdmin = false) => {
      if (!await requireGroup()) return false;
      let permissions;
      try {
        permissions = await getGroupPermissions(sock, m.chat, m.sender);
      } catch {
        await m.reply('❌ Impossible de vérifier les permissions du groupe.');
        return false;
      }
      if (!isOwner && !permissions.actorIsAdmin) {
        await m.reply('❌ Cette action est réservée aux administrateurs du groupe.');
        return false;
      }
      if (needsBotAdmin && !permissions.botIsAdmin) {
        await m.reply('❌ Le bot doit aussi être administrateur pour effectuer cette action.');
        return false;
      }
      return true;
    };

    switch (cmd) {
      case 'tagall': {
        if (!await requireAdmin(false)) break;
        const meta = await sock.groupMetadata(m.chat);
        const mems = meta.participants;
        const text = mems.map(p=>`@${p.id.split('@')[0]}`).join(' ');
        await sock.sendMessage(m.chat, { text: `📢 *Mention générale*\n\n${text}`, mentions: mems.map(p=>p.id) }, { quoted: m });
        break;
      }
      case 'kick': {
        if (!await requireAdmin(true)) break;
        const number = String(args[0] || '').replace(/\D/g, '');
        const target = mentions[0] || (number ? `${number}@s.whatsapp.net` : null);
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}kick @membre`);
        try {
          await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
          await m.reply(`✅ @${target.split('@')[0]} exclu du groupe.`, { mentions: [target] });
        } catch { await m.reply('❌ Impossible d\'exclure. Vérifiez les permissions.'); }
        break;
      }
      case 'add': {
        if (!await requireAdmin(true)) break;
        const num = args[0]?.replace(/[^0-9]/g,'');
        if (!num) return await m.reply(`Usage: ${cfg.PREFIX}add [numéro]`);
        try {
          await sock.groupParticipantsUpdate(m.chat, [num+'@s.whatsapp.net'], 'add');
          await m.reply(`✅ ${num} ajouté au groupe!`);
        } catch { await m.reply('❌ Impossible d\'ajouter ce membre.'); }
        break;
      }
      case 'promote': {
        if (!await requireAdmin(true)) break;
        const target = mentions[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}promote @membre`);
        try {
          await sock.groupParticipantsUpdate(m.chat, [target], 'promote');
          await m.reply(`⬆️ @${target.split('@')[0]} est maintenant admin!`, { mentions: [target] });
        } catch { await m.reply('❌ Erreur lors de la promotion.'); }
        break;
      }
      case 'demote': {
        if (!await requireAdmin(true)) break;
        const target = mentions[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}demote @membre`);
        try {
          await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
          await m.reply(`⬇️ @${target.split('@')[0]} n'est plus admin.`, { mentions: [target] });
        } catch { await m.reply('❌ Erreur lors de la rétrogradation.'); }
        break;
      }
      case 'groupinfo': {
        if (!await requireGroup()) break;
        const meta = await sock.groupMetadata(m.chat);
        await m.reply(`╔══════════════════╗
║  *INFO GROUPE*
╠══════════════════╣
║ 📛 ${meta.subject}
║ 👥 Membres: ${meta.participants.length}
║ 👑 Admins: ${meta.participants.filter(p=>p.admin).length}
║ 📅 ${new Date(meta.creation*1000).toLocaleDateString('fr-FR')}
║ 📝 ${meta.desc?.substring(0,50)||'Aucune description'}
╚══════════════════╝`);
        break;
      }
      case 'linkgroup': {
        if (!await requireAdmin(false)) break;
        try {
          const code = await sock.groupInviteCode(m.chat);
          await m.reply(`🔗 *Lien du groupe*\n\nhttps://chat.whatsapp.com/${code}`);
        } catch { await m.reply('❌ Impossible de récupérer le lien.'); }
        break;
      }
      case 'revoke': {
        if (!await requireAdmin(true)) break;
        try {
          await sock.groupRevokeInvite(m.chat);
          await m.reply('✅ Lien du groupe révoqué! Un nouveau lien a été généré.');
        } catch { await m.reply('❌ Impossible de révoquer le lien.'); }
        break;
      }
      case 'open': {
        if (!await requireAdmin(true)) break;
        await sock.groupSettingUpdate(m.chat, 'not_announcement');
        await m.reply('🔓 Groupe ouvert! Tous les membres peuvent envoyer des messages.');
        break;
      }
      case 'close': {
        if (!await requireAdmin(true)) break;
        await sock.groupSettingUpdate(m.chat, 'announcement');
        await m.reply('🔒 Groupe fermé! Seuls les admins peuvent envoyer des messages.');
        break;
      }
      case 'setdesc': {
        if (!await requireAdmin(true)) break;
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}setdesc [description]`);
        await sock.groupUpdateDescription(m.chat, q);
        await m.reply(`✅ Description mise à jour!\n\n${q}`);
        break;
      }
      case 'setname': {
        if (!await requireAdmin(true)) break;
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}setname [nom]`);
        await sock.groupUpdateSubject(m.chat, q);
        await m.reply(`✅ Nom du groupe changé en: *${q}*`);
        break;
      }
      case 'members': {
        if (!await requireGroup()) break;
        const meta = await sock.groupMetadata(m.chat);
        const list = meta.participants.map((p,i)=>`${i+1}. ${p.id.split('@')[0]}${p.admin?` (${p.admin==='superadmin'?'👑':'⭐'})`:''}` ).join('\n');
        await m.reply(`👥 *Membres (${meta.participants.length})*\n\n${list}`);
        break;
      }
      case 'admins': {
        if (!await requireGroup()) break;
        const meta = await sock.groupMetadata(m.chat);
        const admins = meta.participants.filter(p=>p.admin);
        const list = admins.map((p,i)=>`${i+1}. ${p.id.split('@')[0]} ${p.admin==='superadmin'?'👑':'⭐'}`).join('\n');
        await m.reply(`⭐ *Admins (${admins.length})*\n\n${list}`);
        break;
      }
      case 'warn': {
        if (!await requireAdmin(false)) break;
        const target = mentions[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}warn @membre`);
        const warns = db.addWarn(target);
        await m.reply(`⚠️ *Avertissement*\n\n@${target.split('@')[0]} a reçu un avertissement!\nTotal: ${warns}/${cfg.MAX_WARN}${warns>=cfg.MAX_WARN?'\n\n🚫 Limite atteinte!':''}`, { mentions: [target] });
        break;
      }
      case 'warns': {
        const target = mentions[0] || m.sender;
        const warns = db.getWarns(target);
        await m.reply(`⚠️ *Avertissements*\n\n@${target.split('@')[0]}: ${warns}/${cfg.MAX_WARN}`, { mentions: [target] });
        break;
      }
      case 'resetwarn': {
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        const target = mentions[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}resetwarn @membre`);
        db.resetWarn(target);
        await m.reply(`✅ Avertissements de @${target.split('@')[0]} réinitialisés!`, { mentions: [target] });
        break;
      }
      case 'poll': {
        if (!await requireGroup()) break;
        const parts = q.split('|').map(s=>s.trim());
        if (parts.length < 3) return await m.reply(`Usage: ${cfg.PREFIX}poll Question|Option1|Option2|...\nExemple: ${cfg.PREFIX}poll Couleur préférée?|Rouge|Bleu|Vert`);
        const [question, ...options] = parts;
        await sock.sendMessage(m.chat, { poll: { name: question, values: options, selectableCount: 1 } });
        break;
      }
      case 'mute': {
        if (!await requireAdmin(true)) break;
        await sock.groupSettingUpdate(m.chat, 'announcement');
        await m.reply('🔇 Groupe en mode silencieux!');
        break;
      }
      case 'unmute': {
        if (!await requireAdmin(true)) break;
        await sock.groupSettingUpdate(m.chat, 'not_announcement');
        await m.reply('🔊 Groupe réactivé!');
        break;
      }
    }
  },
};
