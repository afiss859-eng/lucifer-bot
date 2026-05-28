const { randomInt, formatNumber } = require('../src/utils');

module.exports = {
  commands: ['coins','daily','work','rich','pay','rob','gamble','slots','blackjack','lottery','balance'],
  description: 'Système économie',
  execute: async ({ m, args, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    switch (cmd) {
      case 'coins':
      case 'balance': {
        const coins = db.getCoins(m.sender);
        await m.reply(`💳 *Votre Solde*\n\n💰 ${formatNumber(coins)} coins\n\n📊 Gagnez plus avec:\n• ${cfg.PREFIX}daily — Récompense journalière\n• ${cfg.PREFIX}work — Travailler\n• ${cfg.PREFIX}gamble — Casino`);
        break;
      }
      case 'daily': {
        const last = db.getLastDaily(m.sender);
        const now = Date.now();
        const cooldown = 86400000;
        if (now - last < cooldown) {
          const r = cooldown-(now-last);
          const h=Math.floor(r/3600000), mn=Math.floor((r%3600000)/60000);
          return await m.reply(`⏳ Revenez dans *${h}h ${mn}m* pour votre récompense!`);
        }
        const bonus = randomInt(80, 150);
        db.addCoins(m.sender, bonus);
        db.setLastDaily(m.sender);
        await m.reply(`🎁 *Récompense Journalière*\n\n💰 +${bonus} coins!\n💳 Solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        break;
      }
      case 'work': {
        const last = db.getLastWork(m.sender);
        const now = Date.now();
        const cooldown = 3600000;
        if (now - last < cooldown) {
          const r = cooldown-(now-last);
          const mn=Math.floor(r/60000), s=Math.floor((r%60000)/1000);
          return await m.reply(`⏳ Reposez-vous! Revenez dans *${mn}m ${s}s*`);
        }
        const jobs = ['programmeur','médecin','chauffeur','cuisinier','enseignant','avocat','ingénieur','artiste'];
        const job = jobs[randomInt(0, jobs.length-1)];
        const earned = randomInt(cfg.WORK_MIN, cfg.WORK_MAX);
        db.addCoins(m.sender, earned);
        db.setLastWork(m.sender);
        await m.reply(`💼 *Travail*\n\nVous avez travaillé comme *${job}*\n💰 Gagné: +${earned} coins\n💳 Solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        break;
      }
      case 'rich': {
        const list = db.getRichList();
        if (!list.length) return await m.reply('📊 Aucune donnée encore.');
        const rows = list.map((e,i)=>`${['🥇','🥈','🥉'][i]||`${i+1}.`} ${e.jid.split('@')[0]}: ${formatNumber(e.coins)} 💰`).join('\n');
        await m.reply(`🏆 *Top 10 Classement*\n\n${rows}`);
        break;
      }
      case 'pay': {
        const target = mentions[0];
        const amount = parseInt(args[1]) || parseInt(args[0]);
        if (!target || !amount || amount < 1) return await m.reply(`Usage: ${cfg.PREFIX}pay @user [montant]`);
        if (target === m.sender) return await m.reply("❌ Vous ne pouvez pas vous payer vous-même!");
        const coins = db.getCoins(m.sender);
        if (coins < amount) return await m.reply(`❌ Solde insuffisant! Vous avez ${formatNumber(coins)} coins.`);
        db.removeCoins(m.sender, amount);
        db.addCoins(target, amount);
        await m.reply(`✅ *Transfert réussi!*\n\n💸 Envoyé: ${formatNumber(amount)} coins\n👤 À: @${target.split('@')[0]}\n💳 Votre solde: ${formatNumber(db.getCoins(m.sender))} coins`, { mentions: [target] });
        break;
      }
      case 'rob': {
        const target = mentions[0];
        if (!target) return await m.reply(`Usage: ${cfg.PREFIX}rob @user`);
        if (target === m.sender) return await m.reply("❌ Vous ne pouvez pas vous voler vous-même!");
        const targetCoins = db.getCoins(target);
        if (targetCoins < 50) return await m.reply(`❌ @${target.split('@')[0]} n'a pas assez de coins!`, { mentions: [target] });
        const success = Math.random() > 0.5;
        if (success) {
          const stolen = randomInt(10, Math.min(targetCoins, 200));
          db.removeCoins(target, stolen);
          db.addCoins(m.sender, stolen);
          await m.reply(`🦹 *Vol réussi!*\n\nVous avez volé *${stolen} coins* à @${target.split('@')[0]}!\n💳 Votre solde: ${formatNumber(db.getCoins(m.sender))} coins`, { mentions: [target] });
        } else {
          const fine = randomInt(20, 100);
          db.removeCoins(m.sender, fine);
          await m.reply(`👮 *Pris en flagrant délit!*\n\nVous avez été arrêté et payé ${fine} coins d'amende!\n💳 Votre solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
      case 'gamble': {
        const bet = parseInt(args[0]);
        if (!bet || bet < 1) return await m.reply(`Usage: ${cfg.PREFIX}gamble [montant]\nExemple: ${cfg.PREFIX}gamble 100`);
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant! Vous avez ${formatNumber(coins)} coins.`);
        const rand = Math.random();
        if (rand < 0.45) {
          const gained = bet * 2;
          db.addCoins(m.sender, bet);
          await m.reply(`🎰 *Casino*\n\n🎉 Gagné! ×2\n💰 +${formatNumber(bet)} coins\n💳 Solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        } else if (rand < 0.55) {
          await m.reply(`🎰 *Casino*\n\n🤝 Égalité! Rien perdu, rien gagné.\n💳 Solde: ${formatNumber(coins)} coins`);
        } else {
          db.removeCoins(m.sender, bet);
          await m.reply(`🎰 *Casino*\n\n😢 Perdu!\n💸 -${formatNumber(bet)} coins\n💳 Solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
      case 'slots': {
        const bet = parseInt(args[0]) || 50;
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant! Vous avez ${formatNumber(coins)} coins.`);
        const emojis = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣','🔔'];
        const r = () => emojis[Math.floor(Math.random()*emojis.length)];
        const s = [r(),r(),r()];
        const display = `[ ${s.join(' | ')} ]`;
        const jackpot = s[0]==='7️⃣' && s[1]==='7️⃣' && s[2]==='7️⃣';
        const win3 = s[0]===s[1] && s[1]===s[2];
        const win2 = s[0]===s[1] || s[1]===s[2] || s[0]===s[2];
        if (jackpot) {
          db.addCoins(m.sender, bet*20);
          await m.reply(`🎰 *SLOTS*\n${display}\n\n🎊 *MEGA JACKPOT! ×20!*\n💰 +${formatNumber(bet*20)}\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else if (win3) {
          db.addCoins(m.sender, bet*5);
          await m.reply(`🎰 *SLOTS*\n${display}\n\n🎉 3 identiques! ×5\n💰 +${formatNumber(bet*5)}\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else if (win2) {
          db.addCoins(m.sender, bet);
          await m.reply(`🎰 *SLOTS*\n${display}\n\n✅ 2 identiques! ×2\n💰 +${formatNumber(bet)}\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else {
          db.removeCoins(m.sender, bet);
          await m.reply(`🎰 *SLOTS*\n${display}\n\n😢 Perdu! -${bet}\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
      case 'blackjack': {
        const bet = parseInt(args[0]) || 50;
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant!`);
        const deck = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
        const val = c => typeof c==='number'?c:c==='A'?11:10;
        const draw = () => deck[Math.floor(Math.random()*deck.length)];
        const player = [draw(),draw()];
        const dealer = [draw(),draw()];
        const pSum = player.reduce((a,c)=>a+val(c),0);
        const dSum = dealer.reduce((a,c)=>a+val(c),0);
        const pWin = pSum <= 21 && (pSum > dSum || dSum > 21);
        const tie = pSum === dSum && pSum <= 21;
        if (tie) {
          await m.reply(`🃏 *Blackjack*\n\nVotre main: ${player.join(' ')} = ${pSum}\nDonneur: ${dealer.join(' ')} = ${dSum}\n\n🤝 Égalité!`);
        } else if (pWin) {
          db.addCoins(m.sender, bet);
          await m.reply(`🃏 *Blackjack*\n\nVotre main: ${player.join(' ')} = ${pSum}\nDonneur: ${dealer.join(' ')} = ${dSum}\n\n🎉 Gagné! +${bet} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else {
          db.removeCoins(m.sender, bet);
          await m.reply(`🃏 *Blackjack*\n\nVotre main: ${player.join(' ')} = ${pSum}\nDonneur: ${dealer.join(' ')} = ${dSum}\n\n😢 Perdu! -${bet} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
      case 'lottery': {
        const ticket = parseInt(args[0]) || 20;
        const coins = db.getCoins(m.sender);
        if (coins < ticket) return await m.reply(`❌ Solde insuffisant!`);
        db.removeCoins(m.sender, ticket);
        const num = randomInt(1, 100);
        const jackpot = num === 77;
        const big = num >= 90;
        const small = num >= 70;
        if (jackpot) {
          db.addCoins(m.sender, ticket*100);
          await m.reply(`🎟️ *Loterie*\n\nNuméro tiré: *${num}*\n\n🎊 *JACKPOT ABSOLU!* ×100!\n💰 +${ticket*100} coins!\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else if (big) {
          db.addCoins(m.sender, ticket*10);
          await m.reply(`🎟️ *Loterie*\n\nNuméro: *${num}*\n\n🎉 Gros lot! ×10\n💰 +${ticket*10} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else if (small) {
          db.addCoins(m.sender, ticket*3);
          await m.reply(`🎟️ *Loterie*\n\nNuméro: *${num}*\n\n✅ Petit gain! ×3\n💰 +${ticket*3} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        } else {
          await m.reply(`🎟️ *Loterie*\n\nNuméro: *${num}*\n\n😢 Pas de chance cette fois!\n💸 -${ticket} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
    }
  },
};
