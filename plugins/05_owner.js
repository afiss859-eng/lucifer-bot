module.exports = {
  commands: ['ban','unban','broadcast','clearwarn','addcoins','rmcoins','restart','shutdown','setprefix'],
  description: 'Commandes propriétaire',
  ownerOnly: true,
  execute: async ({ sock, m, args, q, isOwner, config: cfg, db, logger }) => {
    if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'ban': {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const number = String(args[0] || '').replace(/\D/g, '');
        const target = mentioned || (number ? `${number}@s.whatsapp.net` : null);
        const reason = args.slice(1).join(' ') || 'Aucune raison';
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}ban @user [raison]`);
        db.banUser(target, reason);
        await m.reply(`🚫 *@${target.split('@')[0]}* a été banni!\nRaison: ${reason}`);
        break;
      }
      case 'unban': {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const number = String(args[0] || '').replace(/\D/g, '');
        const target = mentioned || (number ? `${number}@s.whatsapp.net` : null);
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}unban @user`);
        db.unbanUser(target);
        await m.reply(`✅ *@${target.split('@')[0]}* a été débanni!`);
        break;
      }
      case 'broadcast': {
        return await m.reply('📢 Envoi massif désactivé pour protéger votre compte WhatsApp. Utilisez uniquement les messages individuels attendus par leurs destinataires.');
      }
      case 'clearwarn': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}clearwarn @user`);
        db.resetWarn(target);
        await m.reply(`✅ Avertissements de *@${target.split('@')[0]}* réinitialisés!`);
        break;
      }
      case 'addcoins': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = Number.parseInt(args[1] || args[0], 10);
        if (!target || !Number.isSafeInteger(amount) || amount <= 0) return await m.reply(`Usage: ${cfg.PREFIX}addcoins @user [montant positif]`);
        db.addCoins(target, amount);
        await m.reply(`✅ +${amount} coins ajoutés à *@${target.split('@')[0]}*\nNouveau solde: ${db.getCoins(target)}`);
        break;
      }
      case 'rmcoins': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = Number.parseInt(args[1] || args[0], 10);
        if (!target || !Number.isSafeInteger(amount) || amount <= 0) return await m.reply(`Usage: ${cfg.PREFIX}rmcoins @user [montant positif]`);
        db.removeCoins(target, amount);
        await m.reply(`✅ -${amount} coins retirés de *@${target.split('@')[0]}*\nNouveau solde: ${db.getCoins(target)}`);
        break;
      }
      case 'restart': {
        await m.reply('🔄 Redémarrage en cours...');
        logger.info('Redémarrage demandé par le propriétaire');
        process.exit(0);
        break;
      }
      case 'shutdown': {
        await m.reply('⛔ Arrêt du bot...');
        process.exit(1);
        break;
      }
      case 'setprefix': {
        const nextPrefix = String(args[0] || '');
        if (!/^[^\sA-Za-z0-9]$/u.test(nextPrefix)) {
          return await m.reply(`Usage: ${cfg.PREFIX}setprefix [un seul caractère spécial]`);
        }
        cfg.PREFIX = nextPrefix;
        db.saveNote('__bot__', 'prefix', nextPrefix);
        await m.reply(`✅ Préfixe changé et sauvegardé : *${nextPrefix}*`);
        break;
      }
    }
  },
};
