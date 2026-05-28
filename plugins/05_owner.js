module.exports = {
  commands: ['ban','unban','broadcast','clearwarn','addcoins','rmcoins','restart','shutdown','setprefix'],
  description: 'Commandes propriétaire',
  ownerOnly: true,
  execute: async ({ sock, m, args, q, isOwner, config: cfg, db, logger }) => {
    if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'ban': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || (args[0]?.replace(/[^0-9]/g,'')+'@s.whatsapp.net');
        const reason = args.slice(1).join(' ') || 'Aucune raison';
        if (!target || target === '@s.whatsapp.net') return await m.reply(`Usage: ${cfg.PREFIX}ban @user [raison]`);
        db.banUser(target, reason);
        await m.reply(`🚫 *@${target.split('@')[0]}* a été banni!\nRaison: ${reason}`);
        break;
      }
      case 'unban': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || (args[0]?.replace(/[^0-9]/g,'')+'@s.whatsapp.net');
        if (!target || target === '@s.whatsapp.net') return await m.reply(`Usage: ${cfg.PREFIX}unban @user`);
        db.unbanUser(target);
        await m.reply(`✅ *@${target.split('@')[0]}* a été débanni!`);
        break;
      }
      case 'broadcast': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}broadcast [message]`);
        await m.reply(`📢 Diffusion envoyée!\nMessage: ${q}`);
        break;
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
        const amount = parseInt(args[1]) || parseInt(args[0]);
        if (!target || !amount) return await m.reply(`Usage: ${cfg.PREFIX}addcoins @user [montant]`);
        db.addCoins(target, amount);
        await m.reply(`✅ +${amount} coins ajoutés à *@${target.split('@')[0]}*\nNouveau solde: ${db.getCoins(target)}`);
        break;
      }
      case 'rmcoins': {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = parseInt(args[1]) || parseInt(args[0]);
        if (!target || !amount) return await m.reply(`Usage: ${cfg.PREFIX}rmcoins @user [montant]`);
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
        if (!args[0]) return await m.reply(`Usage: ${cfg.PREFIX}setprefix [caractère]`);
        cfg.PREFIX = args[0];
        await m.reply(`✅ Préfixe changé en: *${args[0]}*`);
        break;
      }
    }
  },
};
