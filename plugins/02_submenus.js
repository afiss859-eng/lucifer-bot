const config = require('../config/config');
const p = () => config.PREFIX;

const menus = {
  menu1: () => `╔══════════════════════╗
║  📋 *GÉNÉRAL*
╠══════════════════════╣
║ ${p()}ping - Test bot
║ ${p()}info - Infos bot
║ ${p()}owner - Contact owner
║ ${p()}heure - Date/Heure
║ ${p()}version - Version
║ ${p()}uptime - Durée en ligne
║ ${p()}runtime - Temps actif
║ ${p()}speed - Vitesse bot
║ ${p()}qr [texte] - Créer QR code
║ ${p()}sticker - Image → Sticker
║ ${p()}toimg - Sticker → Image
║ ${p()}profil - Voir profil
║ ${p()}pp [@user] - Photo profil
║ ${p()}bio [@user] - Biographie
║ ${p()}status - Statut WhatsApp
╚══════════════════════╝`,

  menu2: () => `╔══════════════════════╗
║  🎮 *DIVERTISSEMENT*
╠══════════════════════╣
║ ${p()}joke / blague
║ ${p()}citation
║ ${p()}devinette
║ ${p()}8ball [question]
║ ${p()}ship [@u1] [@u2]
║ ${p()}rate [@user]
║ ${p()}choose [a|b|c]
║ ${p()}coinflip
║ ${p()}dice - Dé aléatoire
║ ${p()}rps [pierre/papier/ciseaux]
║ ${p()}fact - Fait insolite
║ ${p()}truth - Vérité ou défi
║ ${p()}dare - Défi
║ ${p()}compliment [@user]
║ ${p()}insult [@user]
║ ${p()}horoscope [signe]
║ ${p()}zodiac [signe]
║ ${p()}neverhaveiever
║ ${p()}wyr - Préféreriez-vous
║ ${p()}wouldyourather
╚══════════════════════╝`,

  menu3: () => `╔══════════════════════╗
║  🛠️ *OUTILS*
╠══════════════════════╣
║ ${p()}calc [expr]
║ ${p()}météo [ville]
║ ${p()}translate [lang] [txt]
║ ${p()}define [mot]
║ ${p()}wiki [sujet]
║ ${p()}google [recherche]
║ ${p()}yt [recherche]
║ ${p()}tiktok [url]
║ ${p()}news - Actualités
║ ${p()}currency [from] [to] [n]
║ ${p()}bmi [poids] [taille]
║ ${p()}age [date]
║ ${p()}countdown [date]
║ ${p()}timer [secondes]
║ ${p()}password [longueur]
║ ${p()}uuid - Générer UUID
║ ${p()}hex [couleur]
║ ${p()}base64e [texte]
║ ${p()}base64d [texte]
║ ${p()}md5 [texte]
║ ${p()}url [lien] - Raccourcir URL
║ ${p()}ip [adresse]
║ ${p()}font [texte]
╚══════════════════════╝`,

  menu4: () => `╔══════════════════════╗
║  🎵 *MÉDIAS*
╠══════════════════════╣
║ ${p()}play [titre] - MP3
║ ${p()}ytmp3 [url]
║ ${p()}ytmp4 [url]
║ ${p()}lyrics [titre]
║ ${p()}spotify [titre]
║ ${p()}soundcloud [titre]
║ ${p()}tiktokdl [url]
║ ${p()}igdl [url] - Instagram
║ ${p()}fbdl [url] - Facebook
║ ${p()}twitter [url]
║ ${p()}pintdl [url] - Pinterest
║ ${p()}meme - Mème aléatoire
║ ${p()}gif [mot]
║ ${p()}img [recherche]
║ ${p()}anime [nom]
║ ${p()}manga [nom]
║ ${p()}waifu - Image waifu
║ ${p()}neko - Image neko
╚══════════════════════╝`,

  menu5: () => `╔══════════════════════╗
║  👥 *GROUPE*
╠══════════════════════╣
║ ${p()}tagall - Mentionner tous
║ ${p()}kick [@user]
║ ${p()}add [numéro]
║ ${p()}promote [@user]
║ ${p()}demote [@user]
║ ${p()}groupinfo
║ ${p()}linkgroup - Lien groupe
║ ${p()}revoke - Révoquer lien
║ ${p()}open - Ouvrir groupe
║ ${p()}close - Fermer groupe
║ ${p()}desc [texte] - Modifier desc
║ ${p()}setname [nom]
║ ${p()}setwelcome [msg]
║ ${p()}setbye [msg]
║ ${p()}antilink on/off
║ ${p()}antispam on/off
║ ${p()}antibadword on/off
║ ${p()}poll [question|opt1|opt2]
║ ${p()}members - Liste membres
║ ${p()}admins - Liste admins
╚══════════════════════╝`,

  menu6: () => `╔══════════════════════╗
║  💰 *ÉCONOMIE*
╠══════════════════════╣
║ ${p()}coins - Voir solde
║ ${p()}daily - Récompense jour
║ ${p()}work - Travailler
║ ${p()}rich - Classement
║ ${p()}pay [@user] [n]
║ ${p()}rob [@user]
║ ${p()}gamble [n]
║ ${p()}slots [n]
║ ${p()}blackjack [n]
║ ${p()}lottery [n]
╚══════════════════════╝`,

  menu7: () => `╔══════════════════════╗
║  🃏 *JEUX*
╠══════════════════════╣
║ ${p()}tictactoe [@user]
║ ${p()}quiz - Question quiz
║ ${p()}hangman - Pendu
║ ${p()}wordle - Wordle FR
║ ${p()}trivia - Culture générale
║ ${p()}number - Deviner nb
║ ${p()}memory - Jeu mémoire
║ ${p()}chess [@user]
╚══════════════════════╝`,

  menu8: () => `╔══════════════════════╗
║  🔞 *ANIME / RP*
╠══════════════════════╣
║ ${p()}hug [@user]
║ ${p()}kiss [@user]
║ ${p()}slap [@user]
║ ${p()}pat [@user]
║ ${p()}bite [@user]
║ ${p()}poke [@user]
║ ${p()}cuddle [@user]
║ ${p()}highfive [@user]
║ ${p()}punch [@user]
║ ${p()}kill [@user]
║ ${p()}marry [@user]
║ ${p()}divorce [@user]
╚══════════════════════╝`,

  menu9: () => `╔══════════════════════╗
║  🌐 *RECHERCHE*
╠══════════════════════╣
║ ${p()}google [q]
║ ${p()}wiki [sujet]
║ ${p()}define [mot]
║ ${p()}recipe [plat]
║ ${p()}covid [pays]
║ ${p()}country [pays]
║ ${p()}flag [pays]
║ ${p()}capital [pays]
║ ${p()}population [pays]
║ ${p()}crypto [coin]
║ ${p()}stock [ticker]
╚══════════════════════╝`,

  menuvip: () => `╔══════════════════════╗
║  👑 *COMMANDES VIP*
╠══════════════════════╣
║ ${p()}vipsticker - Stickers HD
║ ${p()}vipimg - Images exclusives
║ ${p()}vipplay - Audio HD
║ ${p()}vipvideo - Vidéo HD
║ ${p()}viplevel - Voir niveau VIP
║ ${p()}vipbadge - Badge VIP
║ ${p()}vipdaily - Récompense VIP
║ ${p()}vipgamble - Casino VIP
║ ${p()}vipslots - Slots VIP
║ ${p()}vipquiz - Quiz exclusif
╚══════════════════════╝`,

  menuowner: () => `╔══════════════════════╗
║  🔱 *PROPRIÉTAIRE*
╠══════════════════════╣
║ ${p()}addvip [@user]
║ ${p()}delvip [@user]
║ ${p()}listvip
║ ${p()}ban [@user] [raison]
║ ${p()}unban [@user]
║ ${p()}broadcast [msg]
║ ${p()}clearwarn [@user]
║ ${p()}setprefix [char]
║ ${p()}addcoins [@user] [n]
║ ${p()}rmcoins [@user] [n]
║ ${p()}restart - Redémarrer
║ ${p()}shutdown - Arrêter
╚══════════════════════╝`,
};

module.exports = {
  commands: ['menu1','menu2','menu3','menu4','menu5','menu6','menu7','menu8','menu9','menuvip','menuowner'],
  description: 'Sous-menus',
  execute: async ({ m, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const fn = menus[cmd];
    if (fn) await m.reply(fn());
  },
};
