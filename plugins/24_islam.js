const { fetchJson } = require('../src/utils');

const dhikrs = [
  { arabic: 'سُبْحَانَ اللَّهِ', fr: 'Gloire à Allah', count: '100x' },
  { arabic: 'الْحَمْدُ لِلَّهِ', fr: 'Louange à Allah', count: '100x' },
  { arabic: 'اللَّهُ أَكْبَرُ', fr: 'Allah est le plus grand', count: '100x' },
  { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', fr: 'Il n\'y a de dieu qu\'Allah', count: '100x' },
  { arabic: 'أَسْتَغْفِرُ اللَّهَ', fr: 'Je demande pardon à Allah', count: '100x' },
  { arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', fr: 'Que la paix et les bénédictions d\'Allah soient sur lui', count: '10x' },
];

const duas = [
  { titre: 'Dua du matin', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ', fr: 'Au nom d\'Allah, avec Son nom rien ne peut causer de tort' },
  { titre: 'Dua avant de manger', arabic: 'بِسْمِ اللَّهِ', fr: 'Au nom d\'Allah' },
  { titre: 'Dua après manger', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا', fr: 'Louange à Allah qui nous a nourri' },
  { titre: 'Dua avant de dormir', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', fr: 'En Ton nom, ô Allah, je meurs et je vis' },
  { titre: 'Dua pour les parents', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', fr: 'Seigneur, sois miséricordieux envers eux comme ils l\'ont été envers moi dans mon enfance' },
  { titre: 'Dua pour la guidance', arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', fr: 'Notre Seigneur, ne laisse pas nos cœurs dévier après que Tu nous as guidés' },
];

const surahs = [
  { num: 1, name: 'Al-Fatiha', fr: 'L\'Ouverture', versets: 7 },
  { num: 36, name: 'Ya-Sin', fr: 'Ya-Sin (cœur du Coran)', versets: 83 },
  { num: 112, name: 'Al-Ikhlas', fr: 'La Pureté/Sincérité', versets: 4 },
  { num: 113, name: 'Al-Falaq', fr: 'L\'Aube Naissante', versets: 5 },
  { num: 114, name: 'An-Nas', fr: 'Les Hommes', versets: 6 },
  { num: 2, name: 'Al-Baqara', fr: 'La Vache', versets: 286 },
  { num: 55, name: 'Ar-Rahman', fr: 'Le Tout-Miséricordieux', versets: 78 },
  { num: 18, name: 'Al-Kahf', fr: 'La Caverne', versets: 110 },
];

module.exports = {
  commands: [
    'quran','hadith','dhikr','dua','prayer','salat','azkar',
    'surah','bismillah','alhamdulillah','subhanallah','inshallah',
    'islamfact','hijri',
  ],
  description: 'Islam & Spiritualité',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'quran': {
        const surah = parseInt(args[0]) || Math.floor(Math.random() * 114) + 1;
        const verse = parseInt(args[1]) || 1;
        try {
          const data = await fetchJson(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/fr.hamidullah`);
          const ar = await fetchJson(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}`);
          await m.reply(`📖 *Coran — Sourate ${surah}, Verset ${verse}*\n\n🕌 Arabe:\n${ar.data?.text}\n\n🇫🇷 Français:\n${data.data?.text}\n\n_${data.data?.surah?.englishNameTranslation || ''}_`);
        } catch {
          await m.reply(`📖 *Coran — Al-Fatiha 1:1*\n\n🕌 بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ\n\n🇫🇷 Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux`);
        }
        break;
      }
      case 'surah': {
        const info = surahs.find(s => s.num === parseInt(args[0])) || surahs[Math.floor(Math.random() * surahs.length)];
        await m.reply(`📖 *Sourate ${info.num}: ${info.name}*\n\n🇫🇷 ${info.fr}\n📝 ${info.versets} versets\n\n🔗 Lisez: https://quran.com/${info.num}`);
        break;
      }
      case 'hadith': {
        const hadiths = [
          '"Les actions ne valent que par leurs intentions." — Bukhari & Muslim',
          '"Le meilleur parmi vous est celui qui apprend le Coran et l\'enseigne." — Bukhari',
          '"Un sourire à ton frère est une aumône." — Tirmidhi',
          '"Facilitez et ne rendez pas difficile." — Bukhari',
          '"Celui qui croit en Allah et au Jour Dernier doit dire du bien ou se taire." — Bukhari',
          '"La pudeur fait partie de la foi." — Bukhari',
        ];
        const h = hadiths[Math.floor(Math.random() * hadiths.length)];
        await m.reply(`📚 *Hadith*\n\n_${h}_`);
        break;
      }
      case 'dhikr':
      case 'azkar': {
        const d = dhikrs[Math.floor(Math.random() * dhikrs.length)];
        await m.reply(`📿 *Dhikr*\n\n🕌 ${d.arabic}\n\n🇫🇷 _${d.fr}_\n\n🔢 ${d.count}`);
        break;
      }
      case 'dua': {
        const d = duas[Math.floor(Math.random() * duas.length)];
        await m.reply(`🤲 *${d.titre}*\n\n🕌 ${d.arabic}\n\n🇫🇷 _${d.fr}_`);
        break;
      }
      case 'prayer':
      case 'salat': {
        const city = q || 'Paris';
        await m.reply(`🕌 *Horaires de Prière*\n\nVille: *${city}*\n\n🔗 Consultez: https://www.muslimpro.com\n\nPrières du jour:\n🌅 Fajr (Aube)\n☀️ Dhuhr (Midi)\n🌤️ Asr (Après-midi)\n🌇 Maghrib (Coucher)\n🌙 Isha (Nuit)\n\n_Utilisez Muslim Pro pour les horaires exacts de votre ville_`);
        break;
      }
      case 'bismillah':
        await m.reply(`✨ *بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ*\n\n_Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux_`);
        break;
      case 'alhamdulillah':
        await m.reply(`✨ *الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ*\n\n_Louange à Allah, Seigneur des mondes_`);
        break;
      case 'subhanallah':
        await m.reply(`✨ *سُبْحَانَ اللَّهِ وَبِحَمْدِهِ*\n\n_Gloire à Allah et louange à Lui_`);
        break;
      case 'inshallah':
        await m.reply(`✨ *إِنْ شَاءَ اللَّهُ*\n\n_Si Allah le veut_`);
        break;
      case 'islamfact': {
        const facts = [
          '🕌 L\'islam est la 2e religion du monde avec 1.8 milliard de musulmans.',
          '📖 Le Coran a été révélé sur une période de 23 ans.',
          '🕋 La Mecque est la ville la plus sainte de l\'islam.',
          '🌙 Le Ramadan est le 9e mois du calendrier islamique.',
          '📿 Il y a 99 noms d\'Allah dans l\'islam.',
          '🕌 La prière (Salat) est l\'un des 5 piliers de l\'islam.',
        ];
        await m.reply(`☪️ *Fait Islamique*\n\n${facts[Math.floor(Math.random() * facts.length)]}`);
        break;
      }
      case 'hijri': {
        const now = new Date();
        await m.reply(`📅 *Calendrier Hégirien*\n\nDate grégorienne: ${now.toLocaleDateString('fr-FR')}\n\n🔗 Convertisseur: https://www.islamicfinder.org/islamic-date-converter/`);
        break;
      }
    }
  },
};
