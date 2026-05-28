/**
 * 𓅂 DOMA LUCIFERO — Plugin VIP Avancé (30) — Style VansBot / XMD
 * Commandes VIP premium: effets spéciaux, casino avancé, profil VIP,
 * clan, défis, récompenses, objets, boss fight, mariage avancé
 */

const { randomInt } = require('../src/utils');

// ─── Niveaux VIP ──────────────────────────────────────────────────────────────
const VIP_TIERS = {
  bronze:   { label: '🥉 Bronze',  minCoins: 0,     maxDaily: 500,   color: '#cd7f32' },
  silver:   { label: '🥈 Silver',  minCoins: 5000,  maxDaily: 1000,  color: '#c0c0c0' },
  gold:     { label: '🥇 Gold',    minCoins: 20000, maxDaily: 2500,  color: '#ffd700' },
  platinum: { label: '💎 Platinum',minCoins: 75000, maxDaily: 5000,  color: '#e5e4e2' },
  diamond:  { label: '💠 Diamond', minCoins: 200000,maxDaily: 10000, color: '#b9f2ff' },
};

function getVipTier(coins) {
  if (coins >= 200000) return VIP_TIERS.diamond;
  if (coins >= 75000)  return VIP_TIERS.platinum;
  if (coins >= 20000)  return VIP_TIERS.gold;
  if (coins >= 5000)   return VIP_TIERS.silver;
  return VIP_TIERS.bronze;
}

// ─── Items boutique ───────────────────────────────────────────────────────────
const SHOP_ITEMS = {
  shield:    { name: '🛡️ Bouclier',      price: 500,   desc: 'Protège contre le vol pendant 24h' },
  sword:     { name: '⚔️ Épée',          price: 750,   desc: '+20% de gains au travail pendant 24h' },
  ring:      { name: '💍 Bague',         price: 1200,  desc: 'Bonus +10% sur tous les gains' },
  crown:     { name: '👑 Couronne',      price: 5000,  desc: 'Statut royal — +50% daily' },
  dragon:    { name: '🐉 Dragon',        price: 10000, desc: 'Attaque les autres joueurs' },
  inviscloak:{ name: '🧥 Cape invisible',price: 2000,  desc: 'Impossible d\'être volé 48h' },
  lucky:     { name: '🍀 Trèfle lucky',  price: 800,   desc: '+30% chance au casino' },
  bomb:      { name: '💣 Bombe',         price: 1500,  desc: 'Vole 20% des coins d\'un joueur' },
  time:      { name: '⏰ Cristal temps', price: 3000,  desc: 'Réinitialise le cooldown daily' },
  potion:    { name: '🧪 Potion x2',     price: 2500,  desc: 'Double les gains pendant 2h' },
};

// ─── Missions quotidiennes ─────────────────────────────────────────────────────
const MISSIONS = [
  { id: 'chat10',     desc: 'Envoyer 10 commandes',      reward: 200 },
  { id: 'slots5',     desc: 'Jouer 5 fois aux slots',    reward: 300 },
  { id: 'work3',      desc: 'Travailler 3 fois',         reward: 400 },
  { id: 'quiz3',      desc: 'Répondre à 3 quiz',         reward: 500 },
  { id: 'daily',      desc: 'Récupérer son daily',       reward: 100 },
  { id: 'invite',     desc: 'Inviter quelqu\'un (honor)', reward: 600 },
];

// ─── Boss monsters ───────────────────────────────────────────────────────────
const BOSSES = [
  { name: '🦹 Sombre Seigneur Malphas',  hp: 1000, reward: 3000, xp: 500 },
  { name: '🐉 Dragon des Abysses Zarak', hp: 2000, reward: 7500, xp: 1200 },
  { name: '💀 Liche Éternelle Morgoth',  hp: 3500, reward: 15000,xp: 2500 },
  { name: '🌑 Démon Ancien Bael',        hp: 5000, reward: 30000,xp: 5000 },
];

// ─── Module ───────────────────────────────────────────────────────────────────
module.exports = {
  commands: [
    'vprofile','vtier','vdaily','vslots3','vcasino','vwork',
    'vshop','vbuy','vinv','vuse',
    'vmission','vmissions',
    'vclan','vclanCreate','vclanJoin','vclanLeave','vclanInfo','vclanWar',
    'vboss','vattack','vleaderboard','vgift','vduel',
    'vrank2','vbadges2','vcoins',
  ],
  description: 'Commandes VIP Avancées',
  vipOnly: false, // Accessible à tous, mais certaines sous-commandes sont VIP

  execute: async ({ sock, m, args, q, isOwner, isVip, config: cfg, logger, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const jid = m.sender;
    const pushName = m.pushName || jid.split('@')[0];

    // Économie de base
    const eco = db.getEco(jid);
    const coins = eco.coins || 0;
    const tier = getVipTier(coins);

    // VIP check pour commandes avancées
    const vipRequired = ['vclan','vclanCreate','vclanWar','vboss','vduel','vuse'];
    if (vipRequired.includes(cmd) && !isVip) {
      return await m.reply(`👑 *Commande VIP Requise*\n\n*${cmd}* nécessite le statut VIP.\n\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
    }

    switch (cmd) {

      // ─── Profil VIP ─────────────────────────────────────────────────────────
      case 'vprofile': {
        const xp = eco.xp || 0;
        const level = Math.floor(xp / 1000) + 1;
        const nextLvl = level * 1000;
        const progress = Math.floor((xp % 1000) / 10);
        const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        const items = Object.keys(eco.inventory || {});
        const clan = eco.clan || 'Aucun';

        await m.reply(`${isVip ? '👑' : '👤'} *Profil — ${pushName}*
        
🎖️ Rang: *${tier.label}*
⭐ Niveau: *${level}* (${xp} XP)
📊 Progression: [${bar}] ${progress}%

💰 Coins: *${coins.toLocaleString()}*
🏆 Prochain tier: *${getNextTierInfo(coins)}*

🗡️ Items: ${items.length > 0 ? items.map(k => SHOP_ITEMS[k]?.name || k).join(', ') : 'Aucun'}
🏰 Clan: *${clan}*
${isVip ? '\n👑 *Membre VIP — Accès complet*' : '\n💡 Devenez VIP pour accéder à toutes les fonctionnalités!'}`);
        break;
      }

      // ─── Tier / Rang ─────────────────────────────────────────────────────────
      case 'vtier':
      case 'vrank2': {
        await m.reply(`🏆 *Système de Tiers*\n\n${Object.entries(VIP_TIERS).map(([k,v]) => `${v.label}: ${v.minCoins.toLocaleString()} coins — Daily max: ${v.maxDaily}`).join('\n')}\n\n💰 Vos coins: *${coins.toLocaleString()}*\n🎖️ Votre tier: *${tier.label}*\n🎯 Prochain: *${getNextTierInfo(coins)}*`);
        break;
      }

      // ─── Daily VIP ────────────────────────────────────────────────────────────
      case 'vdaily': {
        const lastDaily = eco.lastVipDaily || 0;
        const now = Date.now();
        const cooldown = 20 * 60 * 60 * 1000; // 20h

        if (now - lastDaily < cooldown) {
          const remaining = cooldown - (now - lastDaily);
          const h = Math.floor(remaining / 3600000);
          const min = Math.floor((remaining % 3600000) / 60000);
          return await m.reply(`⏳ *Daily VIP*\n\nProchaine collecte dans: *${h}h ${min}min*\n\n💰 Coins actuels: ${coins.toLocaleString()}`);
        }

        const hasPotion = eco.inventory?.potion;
        let reward = randomInt(tier.maxDaily * 0.7, tier.maxDaily);
        if (hasPotion) { reward *= 2; }
        if (eco.inventory?.crown) reward = Math.floor(reward * 1.5);

        db.addCoins(jid, reward);
        db.setEco(jid, { ...eco, lastVipDaily: now, xp: (eco.xp || 0) + 50 });

        await m.reply(`💰 *Daily VIP — ${tier.label}*\n\n✅ Vous avez récupéré: *+${reward.toLocaleString()} coins*\n${hasPotion ? '🧪 Potion x2 appliquée!\n' : ''}${eco.inventory?.crown ? '👑 Bonus Couronne +50%!\n' : ''}\n💳 Solde: *${(coins + reward).toLocaleString()} coins*\n\nRevenez dans 20 heures!`);
        break;
      }

      // ─── Slots VIP ────────────────────────────────────────────────────────────
      case 'vslots3': {
        const bet = parseInt(args[0]) || 100;
        if (bet < 50) return await m.reply('❌ Mise minimale: 50 coins.');
        if (bet > coins) return await m.reply(`❌ Vous n'avez que ${coins} coins.`);

        const symbols = ['🍒','🍋','🍊','🍇','⭐','💎','🔔','7️⃣','🃏','💀'];
        const weights =  [25,  20,  18,  15,  10,  5,   4,   2,   0.5, 0.5];

        function spin() {
          const total = weights.reduce((a,b)=>a+b,0);
          let r = Math.random() * total;
          for (let i = 0; i < symbols.length; i++) { r -= weights[i]; if (r <= 0) return symbols[i]; }
          return symbols[0];
        }

        const hasLucky = eco.inventory?.lucky;
        const reels = [spin(), spin(), spin()];

        const board = `╔═══════════╗\n║ ${reels.join(' │ ')} ║\n╚═══════════╝`;

        let mult = 0;
        if (reels[0] === '💀' && reels[1] === '💀' && reels[2] === '💀') mult = -1; // Perdre tout
        else if (reels.every(r => r === reels[0])) {
          if (reels[0] === '7️⃣') mult = 20;
          else if (reels[0] === '💎') mult = 15;
          else if (reels[0] === '⭐') mult = 10;
          else if (reels[0] === '🔔') mult = 7;
          else mult = 5;
        } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
          mult = hasLucky ? 2.5 : 2;
        } else if (reels.includes('⭐')) {
          mult = hasLucky ? 1.5 : 0; // Lucky trèfle = consolation
        }

        let gain = 0, msg = '';
        if (mult === -1) {
          gain = -coins;
          db.addCoins(jid, gain);
          msg = `💀 TOUT PERDU! Symboles de mort!\nVous avez tout perdu! (${coins} coins)`;
        } else if (mult === 0) {
          gain = -bet;
          db.addCoins(jid, -bet);
          msg = `😞 Pas de chance...\nPerte: -${bet} coins`;
        } else {
          gain = Math.floor(bet * mult);
          db.addCoins(jid, gain - bet);
          msg = `🎉 *${mult >= 10 ? 'JACKPOT!!!' : mult >= 5 ? 'SUPER WIN!' : 'Victoire!'}*\nGain: +${(gain - bet).toLocaleString()} coins (×${mult})`;
        }

        const newCoins = Math.max(0, coins + gain - (mult > 0 ? bet : 0));
        await m.reply(`🎰 *VIP Slots 3D*\n\n${board}\n\n${msg}\n💰 Solde: ${(mult === -1 ? 0 : newCoins).toLocaleString()} coins${hasLucky ? '\n🍀 Lucky actif!' : ''}`);
        break;
      }

      // ─── Boutique ────────────────────────────────────────────────────────────
      case 'vshop': {
        const itemList = Object.entries(SHOP_ITEMS)
          .map(([k,v]) => `• *${v.name}* — ${v.price.toLocaleString()} coins\n  └ ${v.desc}`)
          .join('\n');
        await m.reply(`🏪 *Boutique VIP*\n\n${itemList}\n\n💰 Vos coins: *${coins.toLocaleString()}*\n\n🛒 Achetez: ${cfg.PREFIX}vbuy [item]\n📦 Utilisez: ${cfg.PREFIX}vuse [item]`);
        break;
      }

      case 'vbuy': {
        const itemKey = args[0]?.toLowerCase();
        if (!itemKey || !SHOP_ITEMS[itemKey]) {
          return await m.reply(`❌ Item invalide.\n\nItems: ${Object.keys(SHOP_ITEMS).join(', ')}\n\nVoir la boutique: ${cfg.PREFIX}vshop`);
        }
        const item = SHOP_ITEMS[itemKey];
        if (coins < item.price) return await m.reply(`❌ Pas assez de coins!\n\nPrix: ${item.price.toLocaleString()}\nVos coins: ${coins.toLocaleString()}`);

        db.addCoins(jid, -item.price);
        const inv = eco.inventory || {};
        inv[itemKey] = { bought: Date.now() };
        db.setEco(jid, { ...eco, inventory: inv });

        await m.reply(`✅ *Achat réussi!*\n\n${item.name} acheté pour *${item.price.toLocaleString()} coins*\n\n${item.desc}\n\n💰 Solde restant: ${(coins - item.price).toLocaleString()} coins`);
        break;
      }

      case 'vinv': {
        const inv = eco.inventory || {};
        const items = Object.entries(inv);
        if (!items.length) return await m.reply(`📦 *Inventaire vide*\n\nAchetez des items: ${cfg.PREFIX}vshop`);
        await m.reply(`📦 *Votre Inventaire*\n\n${items.map(([k]) => `• ${SHOP_ITEMS[k]?.name || k}`).join('\n')}\n\n🛒 Utilisez: ${cfg.PREFIX}vuse [item]`);
        break;
      }

      case 'vuse': {
        const itemKey = args[0]?.toLowerCase();
        const inv = eco.inventory || {};
        if (!itemKey || !inv[itemKey]) return await m.reply(`❌ Item non possédé. Voir: ${cfg.PREFIX}vinv`);
        const item = SHOP_ITEMS[itemKey];
        delete inv[itemKey];
        db.setEco(jid, { ...eco, inventory: inv });
        await m.reply(`✅ *${item?.name}* utilisé!\n\n${item?.desc}`);
        break;
      }

      // ─── Missions ────────────────────────────────────────────────────────────
      case 'vmissions':
      case 'vmission': {
        const today = new Date().toDateString();
        const userMissions = eco.missions?.[today] || {};
        const missionList = MISSIONS.map(ms => {
          const done = userMissions[ms.id];
          return `${done ? '✅' : '⬜'} ${ms.desc} — +${ms.reward} coins`;
        }).join('\n');
        const totalEarned = MISSIONS.filter(ms => userMissions[ms.id]).reduce((a,ms) => a+ms.reward, 0);
        await m.reply(`📋 *Missions du Jour*\n\n${missionList}\n\n💰 Gains aujourd'hui: *${totalEarned} coins*`);
        break;
      }

      // ─── Boss Fight ──────────────────────────────────────────────────────────
      case 'vboss': {
        const boss = BOSSES[randomInt(0, BOSSES.length - 1)];
        await m.reply(`⚔️ *Boss Apparu!*\n\n${boss.name}\n❤️ HP: ${boss.hp}\n💰 Récompense: ${boss.reward.toLocaleString()} coins\n⭐ XP: ${boss.xp}\n\nAttaquez: ${cfg.PREFIX}vattack\n\n_Soyez rapide, d'autres joueurs peuvent aussi l'attaquer!_`);
        db.setNote('__boss__', 'current', JSON.stringify({ ...boss, spawnedAt: Date.now(), spawnedBy: jid }));
        break;
      }

      case 'vattack': {
        const bossData = db.getNote('__boss__', 'current');
        if (!bossData) return await m.reply(`❌ Aucun boss actif!\n\nInvoquez un boss: ${cfg.PREFIX}vboss`);
        const boss = JSON.parse(bossData);
        if (Date.now() - boss.spawnedAt > 60000) {
          db.setNote('__boss__', 'current', null);
          return await m.reply(`💀 Le boss *${boss.name}* a disparu! (timeout 1 min)`);
        }
        const dmg = randomInt(50, 200) + (eco.inventory?.sword ? 50 : 0);
        const remaining = boss.hp - dmg;
        if (remaining <= 0) {
          db.setNote('__boss__', 'current', null);
          db.addCoins(jid, boss.reward);
          db.setEco(jid, { ...eco, xp: (eco.xp || 0) + boss.xp });
          await m.reply(`🏆 *Boss Vaincu!*\n\n${boss.name} a été éliminé!\n\n⚔️ Dégâts infligés: *${dmg}*\n💰 Récompense: *+${boss.reward.toLocaleString()} coins*\n⭐ XP: *+${boss.xp}*`);
        } else {
          boss.hp = remaining;
          db.setNote('__boss__', 'current', JSON.stringify(boss));
          await m.reply(`⚔️ *Attaque!*\n\n${boss.name}\n💥 Dégâts: *${dmg}*\n❤️ HP restant: *${remaining}*\n\nContinuez d'attaquer: ${cfg.PREFIX}vattack`);
        }
        break;
      }

      // ─── Duel ────────────────────────────────────────────────────────────────
      case 'vduel': {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return await m.reply(`⚔️ *Duel*\n\nMentionnez un adversaire: ${cfg.PREFIX}vduel @joueur [mise]\n\nEx: ${cfg.PREFIX}vduel @adversaire 500`);
        const bet = parseInt(args[1]) || 200;
        if (bet > coins) return await m.reply(`❌ Pas assez de coins. Vous avez: ${coins}`);

        const enemyEco = db.getEco(mentioned);
        const enemyCoins = enemyEco.coins || 0;

        const yourPow = randomInt(1, 100) + (eco.inventory?.sword ? 20 : 0);
        const enemyPow = randomInt(1, 100) + (enemyEco.inventory?.sword ? 20 : 0);

        if (yourPow > enemyPow) {
          db.addCoins(jid, bet);
          db.addCoins(mentioned, -bet);
          await m.reply(`⚔️ *Duel — Victoire!*\n\n🏆 ${pushName} gagne!\n\nVotre puissance: ${yourPow} vs ${enemyPow}\n\n💰 Vous gagnez: *+${bet} coins*`);
        } else {
          db.addCoins(jid, -bet);
          db.addCoins(mentioned, bet);
          await m.reply(`⚔️ *Duel — Défaite!*\n\n💀 ${pushName} perd...\n\nVotre puissance: ${yourPow} vs ${enemyPow}\n\n💸 Vous perdez: *-${bet} coins*`);
        }
        break;
      }

      // ─── Leaderboard ─────────────────────────────────────────────────────────
      case 'vleaderboard': {
        const data = db.getData();
        const economy = data.economy || {};
        const sorted = Object.entries(economy)
          .filter(([,v]) => v.coins > 0)
          .sort(([,a],[,b]) => (b.coins||0) - (a.coins||0))
          .slice(0, 10);

        if (!sorted.length) return await m.reply('❌ Aucun joueur trouvé.');
        const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        const list = sorted.map(([j,v],i) => `${medals[i]} ${j.split('@')[0]} — *${(v.coins||0).toLocaleString()} coins*`).join('\n');
        await m.reply(`🏆 *Leaderboard Global*\n\n${list}\n\n💰 Votre position: ${sorted.findIndex(([j])=>j===jid)+1 || '—'}`);
        break;
      }

      // ─── Gift ────────────────────────────────────────────────────────────────
      case 'vgift': {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = parseInt(args[1]) || parseInt(args[0]) || 100;
        if (!mentioned) return await m.reply(`🎁 Usage: ${cfg.PREFIX}vgift @utilisateur [montant]`);
        if (amount > coins) return await m.reply(`❌ Vous n'avez que ${coins} coins.`);
        if (amount < 10) return await m.reply('❌ Minimum 10 coins.');
        db.addCoins(jid, -amount);
        db.addCoins(mentioned, amount);
        await m.reply(`🎁 *Cadeau envoyé!*\n\nVous avez offert *${amount.toLocaleString()} coins* à @${mentioned.split('@')[0]}\n\n💰 Votre solde: ${(coins - amount).toLocaleString()} coins`, [mentioned]);
        break;
      }

      // ─── Badges ──────────────────────────────────────────────────────────────
      case 'vbadges2': {
        const badges = [];
        if (coins >= 1000)   badges.push('💰 Millionnaire débutant');
        if (coins >= 10000)  badges.push('💎 Riche');
        if (coins >= 50000)  badges.push('👑 Élite');
        if (coins >= 100000) badges.push('🌟 Légende');
        if (isVip)           badges.push('✨ VIP Officiel');
        if (isOwner)         badges.push('🔱 Propriétaire');
        if ((eco.xp||0) >= 5000) badges.push('⭐ Expérimenté');
        if (Object.keys(eco.inventory||{}).length >= 3) badges.push('🏪 Collectionneur');
        await m.reply(`🏅 *Vos Badges*\n\n${badges.length ? badges.join('\n') : 'Aucun badge encore — Gagnez des coins!'}`);
        break;
      }

      case 'vcoins': {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const targetJid = mentioned || jid;
        const targetEco = db.getEco(targetJid);
        const targetCoins = targetEco.coins || 0;
        const targetTier = getVipTier(targetCoins);
        await m.reply(`💰 *Solde — ${targetJid.split('@')[0]}*\n\n💰 Coins: *${targetCoins.toLocaleString()}*\n🎖️ Tier: *${targetTier.label}*\n⭐ XP: *${targetEco.xp || 0}*`);
        break;
      }

      case 'vcasino': {
        if (!isVip) return await m.reply(`👑 *Casino VIP*\n\nRéservé aux membres VIP.\nContactez: wa.me/${cfg.OWNER_NUMBER}`);
        const bet = parseInt(args[0]) || 200;
        if (bet > coins) return await m.reply(`❌ Mise trop élevée. Coins: ${coins}`);
        const games = ['🎰 Slots', '🃏 Blackjack', '🎲 Dés', '🎡 Roulette'];
        const outcomes = [0.5, 0, 2, 3, 0, 1.5, 0, 5];
        const mult = outcomes[randomInt(0, outcomes.length - 1)];
        const gain = Math.floor(bet * mult) - bet;
        db.addCoins(jid, gain);
        const game = games[randomInt(0, games.length - 1)];
        await m.reply(`🎰 *Casino VIP*\n\nJeu: ${game}\nMise: ${bet} coins\n\n${mult === 0 ? '😞 Perdu...' : mult >= 3 ? '🎉 JACKPOT!' : '✅ Victoire!'}\nMultiplicateur: ×${mult}\n\n${gain >= 0 ? '💰 Gain' : '💸 Perte'}: *${gain >= 0 ? '+' : ''}${gain} coins*\nSolde: ${(coins + gain).toLocaleString()} coins`);
        break;
      }

      case 'vwork': {
        const lastWork = eco.lastVipWork || 0;
        const now = Date.now();
        if (now - lastWork < 3600000) {
          const wait = Math.ceil((3600000 - (now - lastWork)) / 60000);
          return await m.reply(`⏳ Revenez dans *${wait} minutes*.\n\n💰 Coins: ${coins.toLocaleString()}`);
        }
        const hasSword = eco.inventory?.sword;
        const base = randomInt(200, 600);
        const earned = hasSword ? Math.floor(base * 1.2) : base;
        db.addCoins(jid, earned);
        db.setEco(jid, { ...eco, lastVipWork: now, xp: (eco.xp || 0) + 20 });
        const jobs = ['🔧 Technicien', '💻 Développeur', '🎤 Artiste', '📦 Livreur', '🔮 Mage noir', '⚔️ Mercenaire'];
        await m.reply(`💼 *VIP Work*\n\n${jobs[randomInt(0, jobs.length-1)]} — Travail accompli!\n\n💰 Gain: *+${earned} coins*${hasSword ? ' (⚔️ +20%)' : ''}\n⭐ XP: +20\n\nSolde: ${(coins + earned).toLocaleString()} coins`);
        break;
      }

      default:
        await m.reply(`👑 *Commandes VIP Avancées*\n\n🏆 Profil & Stats:\n• ${cfg.PREFIX}vprofile — Profil complet\n• ${cfg.PREFIX}vtier — Système de tiers\n• ${cfg.PREFIX}vbadges2 — Vos badges\n• ${cfg.PREFIX}vcoins — Voir coins\n\n💰 Économie:\n• ${cfg.PREFIX}vdaily — Daily VIP (20h)\n• ${cfg.PREFIX}vwork — Travailler (1h)\n• ${cfg.PREFIX}vgift @u [n] — Offrir coins\n\n🎰 Casino:\n• ${cfg.PREFIX}vslots3 [mise] — Slots avancés\n• ${cfg.PREFIX}vcasino [mise] — Casino\n• ${cfg.PREFIX}vduel @u [mise] — Duel\n\n🏪 Boutique:\n• ${cfg.PREFIX}vshop — Voir items\n• ${cfg.PREFIX}vbuy [item] — Acheter\n• ${cfg.PREFIX}vinv — Inventaire\n\n⚔️ Combat:\n• ${cfg.PREFIX}vboss — Invoquer boss\n• ${cfg.PREFIX}vattack — Attaquer boss\n\n📋 Missions:\n• ${cfg.PREFIX}vmissions — Voir missions\n• ${cfg.PREFIX}vleaderboard — Top joueurs`);
    }
  },
};

function getNextTierInfo(coins) {
  const tiers = Object.values(VIP_TIERS);
  for (let i = 0; i < tiers.length; i++) {
    if (coins < tiers[i].minCoins) {
      return `${tiers[i].label} (${(tiers[i].minCoins - coins).toLocaleString()} coins restants)`;
    }
  }
  return '💠 Diamond — Maximum atteint!';
}
