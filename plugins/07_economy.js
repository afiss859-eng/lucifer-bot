const { randomInt, formatNumber } = require('../src/utils');

module.exports = {
  commands: ['coins','daily','work','rich','pay','rob','gamble','slots','blackjack','lottery','balance'],
  description: 'Système économie',
  execute: async ({ m, args, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const numericArg = (index = 0) => Number.parseInt(args[index], 10);
    const validPositiveAmount = value => Number.isSafeInteger(value) && value > 0;

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
          const r = cooldown - (now - last);
          const h = Math.floor(r / 3600000), mn = Math.floor((r % 3600000) / 60000);
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
          const r = cooldown - (now - last);
          const mn = Math.floor(r / 60000), s = Math.floor((r % 60000) / 1000);
          return await m.reply(`⏳ Reposez-vous! Revenez dans *${mn}m ${s}s*`);
        }
        const jobs = ['programmeur','médecin','chauffeur','cuisinier','enseignant','avocat','ingénieur','artiste'];
        const job = jobs[randomInt(0, jobs.length - 1)];
        const earned = randomInt(cfg.WORK_MIN, cfg.WORK_MAX);
        db.addCoins(m.sender, earned);
        db.setLastWork(m.sender);
        await m.reply(`💼 *Travail*\n\nVous avez travaillé comme *${job}*\n💰 Gagné: +${earned} coins\n💳 Solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        break;
      }
      case 'rich': {
        const list = db.getRichList();
        if (!list.length) return await m.reply('📊 Aucune donnée encore.');
        const rows = list.map((e, i) => `${['🥇','🥈','🥉'][i] || `${i + 1}.`} ${e.jid.split('@')[0]}: ${formatNumber(e.coins)} 💰`).join('\n');
        await m.reply(`🏆 *Top 10 Classement*\n\n${rows}`);
        break;
      }
      case 'pay': {
        const target = mentions[0];
        const amount = validPositiveAmount(numericArg(1)) ? numericArg(1) : numericArg(0);
        if (!target || !validPositiveAmount(amount)) return await m.reply(`Usage: ${cfg.PREFIX}pay @user [montant]`);
        if (target === m.sender) return await m.reply('❌ Vous ne pouvez pas vous payer vous-même!');
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
        if (target === m.sender) return await m.reply('❌ Vous ne pouvez pas vous voler vous-même!');
        const targetCoins = db.getCoins(target);
        if (targetCoins < 50) return await m.reply(`❌ @${target.split('@')[0]} n'a pas assez de coins!`, { mentions: [target] });
        const success = Math.random() > 0.5;
        if (success) {
          const stolen = randomInt(10, Math.min(targetCoins, 200));
          db.removeCoins(target, stolen);
          db.addCoins(m.sender, stolen);
          await m.reply(`🦹 *Vol réussi!*\n\nVous avez volé *${stolen} coins* à @${target.split('@')[0]}!\n💳 Votre solde: ${formatNumber(db.getCoins(m.sender))} coins`, { mentions: [target] });
        } else {
          const fine = Math.min(randomInt(20, 100), db.getCoins(m.sender));
          db.removeCoins(m.sender, fine);
          await m.reply(`👮 *Pris en flagrant délit!*\n\nVous avez été arrêté et payé ${fine} coins d'amende!\n💳 Votre solde: ${formatNumber(db.getCoins(m.sender))} coins`);
        }
        break;
      }
      case 'gamble': {
        const bet = numericArg(0);
        if (!validPositiveAmount(bet)) return await m.reply(`Usage: ${cfg.PREFIX}gamble [montant]\nExemple: ${cfg.PREFIX}gamble 100`);
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant! Vous avez ${formatNumber(coins)} coins.`);
        const rand = Math.random();
        if (rand < 0.45) {
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
        const bet = numericArg(0) || 50;
        if (!validPositiveAmount(bet)) return await m.reply(`Usage: ${cfg.PREFIX}slots [montant]`);
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant! Vous avez ${formatNumber(coins)} coins.`);
        const emojis = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣','🔔'];
        const r = () => emojis[Math.floor(Math.random() * emojis.length)];
        const s = [r(), r(), r()];
        const display = `[ ${s.join(' | ')} ]`;
        const jackpot = s[0] === '7️⃣' && s[1] === '7️⃣' && s[2] === '7️⃣';
        const win3 = s[0] === s[1] && s[1] === s[2];
        const win2 = s[0] === s[1] || s[1] === s[2] || s[0] === s[2];
        db.removeCoins(m.sender, bet);
        let payout = 0, label;
        if (jackpot) { payout = bet * 20; label = `🎊 *MEGA JACKPOT! ×20!*`; }
        else if (win3) { payout = bet * 5; label = `🎉 3 identiques! ×5`; }
        else if (win2) { payout = bet * 2; label = `✅ 2 identiques! ×2`; }
        else { label = '😢 Perdu!'; }
        if (payout) db.addCoins(m.sender, payout);
        const delta = payout - bet;
        await m.reply(`🎰 *SLOTS*\n${display}\n\n${label}\n${delta >= 0 ? `💰 +${formatNumber(delta)}` : `💸 ${formatNumber(delta)}`} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        break;
      }
      case 'blackjack': {
        const bet = numericArg(0) || 50;
        if (!validPositiveAmount(bet)) return await m.reply(`Usage: ${cfg.PREFIX}blackjack [montant]`);
        const coins = db.getCoins(m.sender);
        if (coins < bet) return await m.reply(`❌ Solde insuffisant!`);
        const deck = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
        const val = c => typeof c === 'number' ? c : c === 'A' ? 11 : 10;
        const handValue = hand => {
          let total = hand.reduce((a, c) => a + val(c), 0);
          let aces = hand.filter(c => c === 'A').length;
          while (total > 21 && aces-- > 0) total -= 10;
          return total;
        };
        const draw = () => deck[Math.floor(Math.random() * deck.length)];
        const player = [draw(), draw()];
        const dealer = [draw(), draw()];
        const pSum = handValue(player), dSum = handValue(dealer);
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
        const ticket = numericArg(0) || 20;
        if (!validPositiveAmount(ticket)) return await m.reply(`Usage: ${cfg.PREFIX}lottery [montant]`);
        const coins = db.getCoins(m.sender);
        if (coins < ticket) return await m.reply(`❌ Solde insuffisant!`);
        db.removeCoins(m.sender, ticket);
        const num = randomInt(1, 100);
        const jackpot = num === 77;
        const big = num >= 90;
        const small = num >= 70;
        let payout = 0, label = '😢 Pas de chance cette fois!';
        if (jackpot) { payout = ticket * 100; label = '🎊 *JACKPOT ABSOLU!* ×100!'; }
        else if (big) { payout = ticket * 10; label = '🎉 Gros lot! ×10'; }
        else if (small) { payout = ticket * 3; label = '✅ Petit gain! ×3'; }
        if (payout) db.addCoins(m.sender, payout);
        const delta = payout - ticket;
        await m.reply(`🎟️ *Loterie*\n\nNuméro tiré: *${num}*\n\n${label}\n${delta >= 0 ? `💰 +${formatNumber(delta)}` : `💸 ${formatNumber(delta)}`} coins\n💳 ${formatNumber(db.getCoins(m.sender))} coins`);
        break;
      }
    }
  },
};
