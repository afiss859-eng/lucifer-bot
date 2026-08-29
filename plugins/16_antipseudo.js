const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;

// Normalise les pseudos pour reconnaître les variantes stylisées :
// accents, espaces, ponctuation, emoji et quelques caractères homoglyphes courants.
function normalizePseudo(value) {
  const homoglyphs = {
    'А':'A','В':'B','С':'C','Е':'E','Н':'H','І':'I','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','У':'Y',
    'а':'a','в':'b','с':'c','е':'e','н':'h','і':'i','к':'k','м':'m','о':'o','р':'p','т':'t','х':'x','у':'y',
    'Α':'A','Β':'B','Ε':'E','Η':'H','Ι':'I','Κ':'K','Μ':'M','Ν':'N','Ο':'O','Ρ':'P','Τ':'T','Χ':'X','Υ':'Y',
    'α':'a','β':'b','ε':'e','η':'h','ι':'i','κ':'k','μ':'m','ν':'n','ο':'o','ρ':'p','τ':'t','χ':'x','υ':'y',
  };
  return String(value || '')
    .replace(ZERO_WIDTH_RE, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('').map(c => homoglyphs[c] || c).join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function participantName(participant) {
  return participant?.notify || participant?.name || participant?.displayName || '';
}

module.exports = {
  commands: ['antipseudo', 'anti-pseudo'],
  description: 'Exclut les membres dont le pseudo correspond, même stylisé',
  execute: async ({ sock, m, args, q, isOwner, config: cfg }) => {
    if (!m.isGroup) return await m.reply('❌ Cette commande fonctionne uniquement dans un groupe.');

    const meta = await sock.groupMetadata(m.chat);
    const me = meta.participants.find(p => p.id === sock.user?.id || p.id?.split(':')[0] === sock.user?.id?.split(':')[0]);
    const caller = meta.participants.find(p => p.id === m.sender || p.id?.split(':')[0] === m.sender?.split(':')[0]);
    const callerIsAdmin = !!caller?.admin;
    const botIsAdmin = !!me?.admin;

    if (!isOwner && !callerIsAdmin) return await m.reply('❌ Seuls le propriétaire ou un administrateur peuvent utiliser cette commande.');
    if (!botIsAdmin) return await m.reply('❌ Je dois être administrateur du groupe pour exclure les membres.');

    const targetPseudo = String(q || args.join(' ')).trim();
    const normalizedTarget = normalizePseudo(targetPseudo);
    if (!normalizedTarget || normalizedTarget.length < 2) {
      return await m.reply(`Usage: ${cfg.PREFIX}antipseudo [pseudo]\nExemple: ${cfg.PREFIX}antipseudo Lucifer`);
    }

    const protectedIds = new Set([
      sock.user?.id,
      m.sender,
      ...meta.participants.filter(p => p.admin).map(p => p.id),
    ].filter(Boolean).map(id => id.split(':')[0]));

    const matches = meta.participants.filter(p => {
      if (!p.id || protectedIds.has(p.id.split(':')[0])) return false;
      return normalizePseudo(participantName(p)) === normalizedTarget;
    });

    if (!matches.length) {
      return await m.reply(`🔎 Aucun membre trouvé pour le pseudo *${targetPseudo}*.\n\nLa recherche ignore les accents, espaces, emoji, ponctuation et plusieurs caractères spéciaux.`);
    }

    const removed = [];
    const failed = [];
    // Petits lots pour éviter de surcharger les requêtes WhatsApp dans les gros groupes.
    for (let i = 0; i < matches.length; i += 5) {
      const batch = matches.slice(i, i + 5).map(p => p.id);
      try {
        const result = await sock.groupParticipantsUpdate(m.chat, batch, 'remove');
        const resultMap = new Map((result || []).map(r => [r.jid, r.status]));
        for (const jid of batch) {
          if (!resultMap.has(jid) || String(resultMap.get(jid)) === '200') removed.push(jid);
          else failed.push(jid);
        }
      } catch {
        failed.push(...batch);
      }
    }

    const removedText = removed.map(j => `@${j.split('@')[0]}`).join(', ') || 'Aucun';
    const failedText = failed.map(j => `@${j.split('@')[0]}`).join(', ');
    let text = `🛡️ *ANTI-PSEUDO*\n\n🎯 Pseudo ciblé: *${targetPseudo}*\n👥 Correspondances: *${matches.length}*\n🚫 Exclus: *${removed.length}*\n\n${removedText}`;
    if (failed.length) text += `\n\n⚠️ Non exclus: *${failed.length}*\n${failedText}`;
    await m.reply(text, { mentions: [...removed, ...failed] });
  },
};
