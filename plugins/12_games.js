const { randomInt } = require('../src/utils');

const activeGames = new Map();

module.exports = {
  commands: ['ttt','quiz','hangman','number','trivia','memory','riddle','akinator','wordgame','scramble'],
  description: 'Jeux interactifs',
  execute: async ({ sock, m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'quiz': {
        const questions = [
          {q:'Quelle est la planète la plus proche du soleil?', opts:['Mercure','Vénus','Terre','Mars'], a:0},
          {q:'Combien de côtés a un hexagone?', opts:['5','6','7','8'], a:1},
          {q:'Qui a peint la Joconde?', opts:['Picasso','Van Gogh','Léonard de Vinci','Monet'], a:2},
          {q:'Quelle est la capitale du Japon?', opts:['Séoul','Pékin','Tokyo','Bangkok'], a:2},
          {q:'Combien font 7 × 8?', opts:['54','56','58','64'], a:1},
          {q:'Quel est l\'animal le plus rapide du monde?', opts:['Lion','Guépard','Faucon','Antilope'], a:1},
          {q:'En quelle année l\'homme a-t-il marché sur la Lune?', opts:['1965','1969','1971','1973'], a:1},
          {q:'Combien d\'os y a-t-il dans le corps humain?', opts:['186','196','206','216'], a:2},
        ];
        const quiz = questions[randomInt(0, questions.length-1)];
        const letters = ['A','B','C','D'];
        const opts = quiz.opts.map((o,i)=>`${letters[i]}. ${o}`).join('\n');
        activeGames.set(m.chat+'_quiz', {answer: letters[quiz.a], reward: 50});
        await m.reply(`🎓 *Quiz*\n\n❓ ${quiz.q}\n\n${opts}\n\nRépondez: ${cfg.PREFIX}rep [A/B/C/D]\n💰 Récompense: 50 coins`);
        break;
      }
      case 'rep': {
        const game = activeGames.get(m.chat+'_quiz');
        if (!game) return await m.reply(`❌ Aucun quiz actif. Lancez ${cfg.PREFIX}quiz`);
        const ans = args[0]?.toUpperCase();
        if (!ans) return await m.reply(`Usage: ${cfg.PREFIX}rep [A/B/C/D]`);
        if (ans === game.answer) {
          activeGames.delete(m.chat+'_quiz');
          await m.reply(`✅ *Bonne réponse!*\n\nRéponse: *${game.answer}*\n💰 +${game.reward} coins gagnés!`);
        } else {
          await m.reply(`❌ *Mauvaise réponse!*\nLa bonne réponse était: *${game.answer}*`);
          activeGames.delete(m.chat+'_quiz');
        }
        break;
      }
      case 'hangman': {
        const words = ['elephant','ordinateur','voiture','maison','jardin','papillon','telephone','musique','cuisine','football'];
        const word = words[randomInt(0, words.length-1)];
        const hidden = word.split('').map(()=>'_').join(' ');
        activeGames.set(m.chat+'_hangman', {word, guessed: [], tries: 6});
        await m.reply(`🎯 *Jeu du Pendu*\n\n${hidden}\n\n❤️ Vies: 6\n\nDevinez une lettre: ${cfg.PREFIX}lettre [a-z]`);
        break;
      }
      case 'lettre': {
        const game = activeGames.get(m.chat+'_hangman');
        if (!game) return await m.reply(`❌ Lancez ${cfg.PREFIX}hangman d'abord!`);
        const letter = args[0]?.toLowerCase();
        if (!letter || !/^[a-z]$/.test(letter)) return await m.reply('❌ Entrez une seule lettre a-z');
        if (game.guessed.includes(letter)) return await m.reply(`❌ Lettre "${letter}" déjà jouée!`);
        game.guessed.push(letter);
        const correct = game.word.includes(letter);
        if (!correct) game.tries--;
        const display = game.word.split('').map(c=>game.guessed.includes(c)?c:'_').join(' ');
        const won = !display.includes('_');
        const lost = game.tries <= 0;
        if (won) {
          activeGames.delete(m.chat+'_hangman');
          return await m.reply(`🎉 *Gagné!*\n\nLe mot était: *${game.word}*\n💰 +100 coins!`);
        }
        if (lost) {
          activeGames.delete(m.chat+'_hangman');
          return await m.reply(`💀 *Perdu!*\n\nLe mot était: *${game.word}*`);
        }
        await m.reply(`🎯 *Pendu*\n\n${display}\n\n${correct?'✅ Bonne lettre!':'❌ Mauvaise lettre!'}\n❤️ Vies: ${game.tries}\n🔤 Lettres jouées: ${game.guessed.join(', ')}`);
        break;
      }
      case 'number': {
        const n = randomInt(1, 100);
        activeGames.set(m.chat+'_number', {number: n, tries: 7});
        await m.reply(`🔢 *Devinez le Nombre*\n\nJ'ai choisi un nombre entre 1 et 100.\nVous avez *7 essais*!\n\nDevinez: ${cfg.PREFIX}guess [nombre]`);
        break;
      }
      case 'guess': {
        const game = activeGames.get(m.chat+'_number');
        if (!game) return await m.reply(`❌ Lancez ${cfg.PREFIX}number d'abord!`);
        const guess = parseInt(args[0]);
        if (isNaN(guess)) return await m.reply('❌ Entrez un nombre valide!');
        game.tries--;
        if (guess === game.number) {
          activeGames.delete(m.chat+'_number');
          return await m.reply(`🎉 *Bravo!* C'était bien *${game.number}*!\n💰 +75 coins!`);
        }
        if (game.tries <= 0) {
          activeGames.delete(m.chat+'_number');
          return await m.reply(`💀 *Perdu!* C'était *${game.number}*!`);
        }
        const hint = guess < game.number ? '⬆️ Plus grand!' : '⬇️ Plus petit!';
        await m.reply(`${hint}\n❤️ Essais restants: ${game.tries}`);
        break;
      }
      case 'riddle': {
        const riddles = [
          {q:"Plus je grandis, moins je pèse. Qu'est-ce que je suis?", a:"Un trou"},
          {q:"J'ai des villes mais pas de maisons, des forêts mais pas d'arbres. Qu'est-ce que je suis?", a:"Une carte"},
          {q:"Je parle sans bouche et j'entends sans oreilles. Qu'est-ce que je suis?", a:"Un écho"},
          {q:"On me jette quand on veut m'utiliser et on me reprend quand on ne veut plus m'utiliser. Qu'est-ce que je suis?", a:"Une ancre"},
        ];
        const r = riddles[randomInt(0, riddles.length-1)];
        await m.reply(`🧩 *Devinette*\n\n❓ ${r.q}\n\n||💡 Réponse: ${r.a}||`);
        break;
      }
      case 'scramble': {
        const words = ['bonjour','maison','voiture','musique','soleil','jardin','oiseau','riviere'];
        const word = words[randomInt(0, words.length-1)];
        const scrambled = word.split('').sort(()=>Math.random()-0.5).join('');
        activeGames.set(m.chat+'_scramble', {word});
        await m.reply(`🔀 *Mot Mélangé*\n\nRetrouvez le mot original:\n*${scrambled.toUpperCase()}*\n\nRépondez: ${cfg.PREFIX}unscramble [mot]\n💰 Récompense: 60 coins`);
        break;
      }
      case 'unscramble': {
        const game = activeGames.get(m.chat+'_scramble');
        if (!game) return await m.reply(`❌ Lancez ${cfg.PREFIX}scramble d'abord!`);
        const ans = args[0]?.toLowerCase();
        if (ans === game.word) {
          activeGames.delete(m.chat+'_scramble');
          await m.reply(`✅ *Bravo!* C'était bien *${game.word}*!\n💰 +60 coins!`);
        } else {
          await m.reply(`❌ Mauvaise réponse! Réessayez.`);
        }
        break;
      }
      case 'ttt': {
        await m.reply(`🎮 *Tic-Tac-Toe*\n\n❌⬜⭕\n⬜❌⬜\n⭕⬜❌\n\n_Commande bientôt disponible en mode interactif!_`);
        break;
      }
      case 'memory': {
        const pairs = ['🍎🍎','🍌🍌','🍇🍇','🍓🍓'];
        const board = [...pairs].sort(()=>Math.random()-0.5);
        await m.reply(`🃏 *Jeu de Mémoire*\n\n${board.join(' ')}\n\n_Mémorisez les paires!_`);
        break;
      }
    }
  },
};
