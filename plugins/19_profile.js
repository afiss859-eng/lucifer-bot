const { formatNumber } = require('../src/utils');

module.exports = {
  commands: ['profil','profile','card','rank','level','xp','stats','achievements','badges','inventory'],
  description: 'Profil utilisateur',
  execute: async ({ sock, m, args, isOwner, isVip, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || m.sender;

    switch (cmd) {
      case 'profil':
      case 'profile':
      case 'card': {
        const coins = db.getCoins(target);
        const warns = db.getWarns(target);
        const targetIsVip = db.isVip(target) || target === cfg.OWNER_NUMBER+'@s.whatsapp.net';
        const targetIsOwner = target.startsWith(cfg.OWNER_NUMBER);
        const role = targetIsOwner ? '🔱 OWNER' : targetIsVip ? '👑 VIP' : '👤 Membre';
        const banned = db.isBanned(target) ? '🚫 OUI' : '✅ NON';

        await m.reply(`╔══════════════════════╗
║  📋 *PROFIL*
╠══════════════════════╣
║ 👤 ${target.split('@')[0]}
║ 🎭 Rôle: *${role}*
║ 💰 Coins: *${formatNumber(coins)}*
║ ⚠️ Avertis: *${warns}/${cfg.MAX_WARN}*
║ 🚫 Banni: *${banned}*
╠══════════════════════╣
║ 💡 Tapez ${cfg.PREFIX}coins pour votre solde
║ 💡 Tapez ${cfg.PREFIX}daily pour gagner
╚══════════════════════╝`);
        break;
      }
      case 'stats': {
        const coins = db.getCoins(m.sender);
        const warns = db.getWarns(m.sender);
        await m.reply(`📊 *Vos Statistiques*\n\n💰 Coins: *${formatNumber(coins)}*\n⚠️ Avertissements: *${warns}/${cfg.MAX_WARN}*\n👑 VIP: *${isVip?'Oui ✅':'Non ❌'}*\n🔱 Owner: *${isOwner?'Oui ✅':'Non ❌'}*`);
        break;
      }
      case 'rank': {
        const list = db.getRichList();
        const myRank = list.findIndex(e=>e.jid===m.sender);
        const coins = db.getCoins(m.sender);
        await m.reply(`🏆 *Votre Rang*\n\n💰 Coins: ${formatNumber(coins)}\n📊 Rang: ${myRank>=0?`#${myRank+1}`:'Non classé'}\n\nVoyez le classement: ${cfg.PREFIX}rich`);
        break;
      }
      case 'achievements':
      case 'badges': {
        const coins = db.getCoins(m.sender);
        const badges = [];
        if (coins >= 100) badges.push('🥉 Bronze (100+ coins)');
        if (coins >= 500) badges.push('🥈 Argent (500+ coins)');
        if (coins >= 1000) badges.push('🥇 Or (1000+ coins)');
        if (isVip) badges.push('👑 VIP');
        if (isOwner) badges.push('🔱 Propriétaire');
        if (!badges.length) badges.push('🔰 Débutant');
        await m.reply(`🏅 *Vos Badges*\n\n${badges.join('\n')}\n\nGagnez plus de coins pour débloquer des badges!`);
        break;
      }
      case 'inventory': {
        const coins = db.getCoins(m.sender);
        await m.reply(`🎒 *Inventaire*\n\n💰 Coins: ${formatNumber(coins)}\n\n_L'inventaire complet sera disponible dans une mise à jour future._`);
        break;
      }
    }
  },
};
