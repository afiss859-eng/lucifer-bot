module.exports = {
  commands: ['addvip','delvip','listvip','viplevel','vipbadge','vipdaily','vipgamble','vipslots','vipquiz'],
  description: 'Système VIP',
  ownerOnly: false,
  execute: async ({ sock, m, args, isOwner, isVip, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'addvip': {
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || (args[0] ? args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null);
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}addvip @membre`);
        db.addVip(target);
        await m.reply(`👑 *@${target.split('@')[0]}* est maintenant VIP !`, { mentions: [target] });
        break;
      }
      case 'delvip': {
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || (args[0] ? args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null);
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}delvip @membre`);
        db.removeVip(target);
        await m.reply(`✅ *@${target.split('@')[0]}* n'est plus VIP.`);
        break;
      }
      case 'listvip': {
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        const vips = db.listVip();
        if (!vips.length) return await m.reply('📋 Aucun membre VIP.');
        const list = vips.map((j,i) => `${i+1}. ${j.split('@')[0]}`).join('\n');
        await m.reply(`👑 *Liste VIP (${vips.length})*\n\n${list}`);
        break;
      }
      case 'viplevel': {
        if (!isVip) return await m.reply(`👑 Cette commande est VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        await m.reply(`👑 *Votre Statut VIP*\n\n✅ Vous êtes membre VIP!\n🔓 Accès à toutes les commandes VIP\n\nTapez *${cfg.PREFIX}menuvip* pour voir vos commandes exclusives.`);
        break;
      }
      case 'vipbadge': {
        if (!isVip) return await m.reply(`👑 Cette commande est VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        await m.reply(`👑 *Votre Badge VIP*\n\n╔══════════════╗\n║  👑 V I P 👑  ║\n║  ${m.sender.split('@')[0]}  ║\n╚══════════════╝`);
        break;
      }
      case 'vipdaily': {
        if (!isVip) return await m.reply(`👑 Commande VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        const last = db.getLastDaily(m.sender);
        const now = Date.now();
        const cooldown = 86400000;
        if (now - last < cooldown) {
          const reste = cooldown - (now - last);
          const h = Math.floor(reste/3600000), mn = Math.floor((reste%3600000)/60000);
          return await m.reply(`⏳ Revenez dans *${h}h ${mn}m* pour votre récompense VIP!`);
        }
        const bonus = 500;
        db.addCoins(m.sender, bonus);
        db.setLastDaily(m.sender);
        await m.reply(`👑 *Récompense VIP Journalière*\n\n💰 +${bonus} coins VIP!\n💳 Solde: ${db.getCoins(m.sender)} coins`);
        break;
      }
      case 'vipgamble': {
        if (!isVip) return await m.reply(`👑 Commande VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return await m.reply(`Usage: ${cfg.PREFIX}vipgamble [montant]`);
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant! Vous avez ${coins} coins.`);
        const win = Math.random() > 0.4;
        const multi = win ? (Math.random() > 0.7 ? 3 : 2) : 0;
        if (win) {
          db.addCoins(m.sender, bet * multi - bet);
          await m.reply(`🎰 *VIP Gamble*\n\n🎉 Gagné! ×${multi}\n💰 +${bet*(multi-1)} coins\n💳 Solde: ${db.getCoins(m.sender)}`);
        } else {
          db.removeCoins(m.sender, bet);
          await m.reply(`🎰 *VIP Gamble*\n\n😢 Perdu!\n💸 -${bet} coins\n💳 Solde: ${db.getCoins(m.sender)}`);
        }
        break;
      }
      case 'vipslots': {
        if (!isVip) return await m.reply(`👑 Commande VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        const bet = parseInt(args[0]) || 100;
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant!`);
        const emojis = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣'];
        const r = () => emojis[Math.floor(Math.random()*emojis.length)];
        const s = [r(),r(),r()];
        const win = s[0]===s[1]&&s[1]===s[2];
        const jackpot = win && s[0]==='7️⃣';
        const res = `[ ${s.join(' | ')} ]`;
        if (jackpot) {
          db.addCoins(m.sender, bet*10);
          await m.reply(`🎰 *VIP SLOTS*\n\n${res}\n\n🎊 *JACKPOT! ×10!*\n💰 +${bet*10} coins\n💳 ${db.getCoins(m.sender)} coins`);
        } else if (win) {
          db.addCoins(m.sender, bet*3);
          await m.reply(`🎰 *VIP SLOTS*\n\n${res}\n\n🎉 Gagné! ×3\n💰 +${bet*3} coins\n💳 ${db.getCoins(m.sender)} coins`);
        } else {
          db.removeCoins(m.sender, bet);
          await m.reply(`🎰 *VIP SLOTS*\n\n${res}\n\n😢 Perdu! -${bet}\n💳 ${db.getCoins(m.sender)} coins`);
        }
        break;
      }
      case 'vipquiz': {
        if (!isVip) return await m.reply(`👑 Commande VIP!\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        const qs = [
          {q:'Quelle est la capitale de la France?',a:'paris',r:'Paris'},
          {q:'Combien font 15 × 15?',a:'225',r:'225'},
          {q:'Quel est le plus grand océan du monde?',a:'pacifique',r:'Pacifique'},
          {q:'En quelle année a débuté la Première Guerre mondiale?',a:'1914',r:'1914'},
          {q:'Quel est le symbole chimique de l\'or?',a:'au',r:'Au'},
        ];
        const quiz = qs[Math.floor(Math.random()*qs.length)];
        await m.reply(`👑 *VIP Quiz*\n\n❓ ${quiz.q}\n\nRépondez avec: ${cfg.PREFIX}reponse [votre réponse]\n\n💰 Récompense: 200 coins`);
        break;
      }
    }
  },
};
