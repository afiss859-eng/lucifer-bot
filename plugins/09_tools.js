const { randomInt } = require('../src/utils');
const crypto = require('crypto');

module.exports = {
  commands: [
    'calc','math','age','bmi','password','uuid','base64e','base64d',
    'md5','sha256','binary','hex','reverse','upper','lower','count',
    'repeat','replace','emojify','ascii','morse','pig','leet',
    'palindrome','anagram','wordcount','charcount','number','random',
    'percent','roman','temperature','distance','weight','speed2',
    'area','volume','currency2','timestamp','timer2','countdown2',
  ],
  description: 'Outils utilitaires',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const text = args.join(' ');

    switch (cmd) {
      case 'calc':
      case 'math': {
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}calc [expression]\nEx: ${cfg.PREFIX}calc 5 * (3 + 2)`);
        try {
          const safe = text.replace(/[^0-9+\-*/()%. ]/g,'');
          const result = Function('"use strict"; return ('+safe+')')();
          await m.reply(`🧮 *Calcul*\n\n📝 ${text}\n✅ = *${result}*`);
        } catch { await m.reply('❌ Expression invalide.'); }
        break;
      }
      case 'age': {
        if (!args[0]) return await m.reply(`Usage: ${cfg.PREFIX}age [JJ/MM/AAAA]`);
        const parts = args[0].split('/');
        if (parts.length!==3) return await m.reply('❌ Format: JJ/MM/AAAA');
        const birth = new Date(parseInt(parts[2]),parseInt(parts[1])-1,parseInt(parts[0]));
        const now = new Date();
        const age = now.getFullYear()-birth.getFullYear()-(now<new Date(now.getFullYear(),birth.getMonth(),birth.getDate())?1:0);
        if (age<0||age>150) return await m.reply('❌ Date invalide.');
        const next = new Date(now.getFullYear(),birth.getMonth(),birth.getDate());
        if (next<now) next.setFullYear(now.getFullYear()+1);
        const days = Math.ceil((next-now)/86400000);
        await m.reply(`🎂 *Âge*\n\nDate: *${args[0]}*\nÂge: *${age} ans*\nProchain anniversaire dans: *${days} jours*`);
        break;
      }
      case 'bmi': {
        const weight = parseFloat(args[0]), height = parseFloat(args[1]);
        if (!weight||!height) return await m.reply(`Usage: ${cfg.PREFIX}bmi [poids_kg] [taille_m]\nEx: ${cfg.PREFIX}bmi 70 1.75`);
        const bmi = (weight/(height*height)).toFixed(1);
        const status = bmi<18.5?'Insuffisance pondérale':bmi<25?'Poids normal':bmi<30?'Surpoids':'Obésité';
        await m.reply(`⚖️ *IMC (BMI)*\n\nPoids: ${weight}kg | Taille: ${height}m\nIMC: *${bmi}*\nStatut: *${status}*`);
        break;
      }
      case 'password': {
        const len = parseInt(args[0]) || 16;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const pwd = Array.from({length: Math.min(len, 64)}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
        await m.reply(`🔐 *Mot de passe généré*\n\n\`${pwd}\`\n\n_Longueur: ${pwd.length} caractères_`);
        break;
      }
      case 'uuid':
        await m.reply(`🆔 *UUID généré*\n\n${crypto.randomUUID()}`);
        break;
      case 'base64e':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}base64e [texte]`);
        await m.reply(`🔡 *Base64 Encodé*\n\n${Buffer.from(text).toString('base64')}`);
        break;
      case 'base64d':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}base64d [texte]`);
        try { await m.reply(`🔡 *Base64 Décodé*\n\n${Buffer.from(text,'base64').toString('utf8')}`); }
        catch { await m.reply('❌ Texte base64 invalide.'); }
        break;
      case 'md5':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}md5 [texte]`);
        await m.reply(`🔒 *MD5*\n\n${crypto.createHash('md5').update(text).digest('hex')}`);
        break;
      case 'sha256':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}sha256 [texte]`);
        await m.reply(`🔒 *SHA256*\n\n${crypto.createHash('sha256').update(text).digest('hex')}`);
        break;
      case 'reverse':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}reverse [texte]`);
        await m.reply(`🔄 *Texte inversé*\n\n${text.split('').reverse().join('')}`);
        break;
      case 'upper':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}upper [texte]`);
        await m.reply(`🔠 ${text.toUpperCase()}`);
        break;
      case 'lower':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}lower [texte]`);
        await m.reply(`🔡 ${text.toLowerCase()}`);
        break;
      case 'count':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}count [texte]`);
        await m.reply(`🔢 *Comptage*\n\nCaractères: *${text.length}*\nMots: *${text.split(/\s+/).filter(Boolean).length}*\nLignes: *${text.split('\n').length}*`);
        break;
      case 'repeat': {
        const times = parseInt(args[0]) || 3;
        const msg = args.slice(1).join(' ');
        if (!msg) return await m.reply(`Usage: ${cfg.PREFIX}repeat [fois] [texte]`);
        await m.reply(Array(Math.min(times,10)).fill(msg).join('\n'));
        break;
      }
      case 'binary':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}binary [texte]`);
        await m.reply(`💻 *Binaire*\n\n${text.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ')}`);
        break;
      case 'morse': {
        const morseMap = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'};
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}morse [texte]`);
        const morse = text.toUpperCase().split('').map(c=>morseMap[c]||'?').join(' ');
        await m.reply(`📡 *Morse*\n\n${morse}`);
        break;
      }
      case 'leet':
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}leet [texte]`);
        await m.reply(`💻 *Leet Speak*\n\n${text.replace(/a/gi,'4').replace(/e/gi,'3').replace(/i/gi,'1').replace(/o/gi,'0').replace(/s/gi,'5').replace(/t/gi,'7')}`);
        break;
      case 'palindrome': {
        if (!text) return await m.reply(`Usage: ${cfg.PREFIX}palindrome [mot]`);
        const clean = text.toLowerCase().replace(/[^a-z]/g,'');
        const is = clean === clean.split('').reverse().join('');
        await m.reply(`🔁 *"${text}"* est${is?'':' pas'} un palindrome!`);
        break;
      }
      case 'random': {
        const min = parseInt(args[0]) || 1;
        const max = parseInt(args[1]) || 100;
        await m.reply(`🎲 *Nombre aléatoire*\n\nEntre ${min} et ${max}: *${randomInt(min,max)}*`);
        break;
      }
      case 'temperature': {
        const val = parseFloat(args[0]);
        const unit = args[1]?.toLowerCase();
        if (isNaN(val)||!unit) return await m.reply(`Usage: ${cfg.PREFIX}temperature [valeur] [c/f/k]`);
        let result;
        if (unit==='c') result = `${val}°C = ${(val*9/5+32).toFixed(1)}°F = ${(val+273.15).toFixed(1)}K`;
        else if (unit==='f') result = `${val}°F = ${((val-32)*5/9).toFixed(1)}°C = ${((val-32)*5/9+273.15).toFixed(1)}K`;
        else if (unit==='k') result = `${val}K = ${(val-273.15).toFixed(1)}°C = ${((val-273.15)*9/5+32).toFixed(1)}°F`;
        else return await m.reply('❌ Unité invalide. Utilisez c, f ou k');
        await m.reply(`🌡️ *Conversion Température*\n\n${result}`);
        break;
      }
      case 'percent': {
        const part = parseFloat(args[0]), total = parseFloat(args[1]);
        if (isNaN(part)||isNaN(total)) return await m.reply(`Usage: ${cfg.PREFIX}percent [partie] [total]`);
        await m.reply(`📊 *Pourcentage*\n\n${part} sur ${total} = *${(part/total*100).toFixed(2)}%*`);
        break;
      }
      case 'timestamp': {
        const now = Date.now();
        await m.reply(`⏱️ *Timestamp*\n\nMs: *${now}*\nSecondes: *${Math.floor(now/1000)}*\nDate: *${new Date(now).toLocaleString('fr-FR')}*`);
        break;
      }
    }
  },
};
