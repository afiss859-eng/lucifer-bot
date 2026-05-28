const { randomInt } = require('../src/utils');

module.exports = {
  commands: [
    'calories','imc','hydration','sleep','steps','heartrate','bloodpressure',
    'workout','stretching','cardio','musculation','yoga2','running','cycling2',
    'swimming2','nutrition','protein','carbs','fat','vitamin',
    'mentalhealth','stress','anxiety','meditation2',
  ],
  description: 'Santé & Sport',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const workouts = {
      workout: `💪 *Programme du jour*\n\n🔥 Échauffement (5 min)\n• 30 jumping jacks\n• 20 genoux hauts\n• 10 rotations des bras\n\n💪 Entraînement (20 min)\n• 3×15 pompes\n• 3×20 squats\n• 3×12 dips\n• 3×30s planche\n\n🧘 Récupération (5 min)\n• Étirements doux`,
      cardio: `🏃 *Cardio du jour*\n\n🔥 Option 1 — Débutant:\n• 20 min marche rapide\n• 5 min jogging léger\n\n💪 Option 2 — Intermédiaire:\n• 30 min jogging\n• Intervalles: 1 min sprint / 2 min marche ×5\n\n🔥 Option 3 — Avancé:\n• 45 min course continue\n• Pace: 5-6 min/km`,
      musculation: `🏋️ *Musculation*\n\n📅 Programme Push/Pull/Legs:\n\n🔴 Jour 1 — Poitrine/Épaules:\n• Développé couché: 4×10\n• Développé militaire: 3×12\n• Écarté: 3×15\n\n🔵 Jour 2 — Dos/Biceps:\n• Tractions: 4×8\n• Rowing: 3×12\n• Curl biceps: 3×15\n\n🟢 Jour 3 — Jambes:\n• Squats: 4×10\n• Presse: 3×12\n• Fentes: 3×15 chaque jambe`,
      yoga2: `🧘 *Yoga du matin*\n\n🌅 Salutation au soleil (×5):\n1. Tadasana (posture montagne)\n2. Uttanasana (flexion avant)\n3. Chaturanga (pompe yoga)\n4. Urdhva Mukha (chien tête en haut)\n5. Adho Mukha (chien tête en bas)\n\n🌿 Postures de relaxation:\n• Balasana (enfant) — 2 min\n• Savasana (corps mort) — 5 min`,
      stretching: `🤸 *Étirements complets*\n\n⏱️ 30 sec par étirement:\n• Étirement cou (4 directions)\n• Étirement épaules croisées\n• Flexion lombaire\n• Fente avant (hanches)\n• Ischio-jambiers assis\n• Mollets contre le mur\n• Quadriceps debout\n• Rotation thoracique`,
      running: `🏃 *Guide Running*\n\n🎯 Pour débutants (Semaine 1):\nLun: 20 min marche + jogging\nMer: Repos\nVen: 25 min marche + jogging\nDim: 30 min marche active\n\n📊 Zones de fréquence cardiaque:\n• Zone 1 (50-60%): Récupération\n• Zone 2 (60-70%): Endurance\n• Zone 3 (70-80%): Aérobie\n• Zone 4 (80-90%): Anaérobie`,
    };

    const nutritionInfo = {
      protein: `🥩 *Protéines*\n\n📊 Besoin quotidien: 0.8-2g/kg de poids\n\n✅ Meilleures sources:\n• Poulet (31g/100g)\n• Thon (29g/100g)\n• Œufs (13g/100g)\n• Lentilles (9g/100g)\n• Tofu (8g/100g)\n• Fromage blanc (11g/100g)`,
      carbs: `🍞 *Glucides*\n\n📊 45-65% des calories totales\n\n✅ Bons glucides:\n• Riz brun, quinoa\n• Patate douce\n• Avoine\n• Fruits\n• Légumineuses\n\n❌ À limiter:\n• Sucre raffiné\n• Pain blanc\n• Sodas`,
      fat: `🥑 *Lipides (Graisses)*\n\n📊 20-35% des calories totales\n\n✅ Bonnes graisses:\n• Avocat 🥑\n• Huile d'olive 🫒\n• Noix et amandes 🥜\n• Saumon 🐟\n• Graines de chia\n\n❌ À éviter:\n• Graisses trans\n• Huiles hydrogénées`,
      vitamin: `💊 *Vitamines essentielles*\n\n☀️ Vit D: Soleil, poissons gras, champignons\n🍊 Vit C: Agrumes, kiwi, poivron rouge\n🥩 Vit B12: Viande, œufs, produits laitiers\n🥬 Vit K: Légumes verts, brocoli, épinards\n🥕 Vit A: Carottes, patate douce, foie`,
      nutrition: `🥗 *Guide Nutrition*\n\n🍽️ Assiette équilibrée:\n• 1/2 légumes 🥦\n• 1/4 protéines 🍗\n• 1/4 glucides complexes 🍚\n• Bonnes graisses 🫒\n\n💧 Hydratation:\n• 2-3L d'eau/jour\n• +500ml par heure de sport\n\n⏰ Timing des repas:\n• Petit-déj: Roi 👑\n• Déjeuner: Prince\n• Dîner: Mendiant`,
    };

    const healthTips = {
      calories: `🔥 *Calculateur Calories*\n\nFormule approximative (Mifflin-St Jeor):\n\n👨 Homme: (10 × poids) + (6.25 × taille) - (5 × âge) + 5\n👩 Femme: (10 × poids) + (6.25 × taille) - (5 × âge) - 161\n\nEx: Homme 25 ans, 70kg, 175cm:\n(700) + (1093.75) - (125) + 5 = *1673 kcal/jour*\n\nAjoutez:\n• Sédentaire: ×1.2\n• Léger: ×1.375\n• Modéré: ×1.55\n• Actif: ×1.725`,
      hydration: `💧 *Hydratation*\n\n🎯 Objectif: 30-35ml/kg de poids\n\n✅ Signes bonne hydratation:\n• Urine claire ou jaune pâle\n• Pas de maux de tête\n• Énergie stable\n• Peau souple\n\n⚠️ Signes déshydratation:\n• Urine foncée\n• Fatigue\n• Maux de tête\n• Bouche sèche\n\n💡 Astuce: Buvez un grand verre dès le réveil!`,
      sleep: `😴 *Guide Sommeil*\n\n📊 Besoins par âge:\n• Ados: 8-10 heures\n• Adultes: 7-9 heures\n• Seniors: 7-8 heures\n\n✅ Conseils pour mieux dormir:\n• Couchez-vous à la même heure\n• Évitez les écrans 1h avant\n• Chambre fraîche (16-19°C)\n• Pas de caféine après 14h\n• Routine de relaxation\n\n🔄 Cycles: 90 min par cycle, 5-6 cycles`,
      steps: `👟 *Objectif Pas*\n\n🎯 Objectif: 10 000 pas/jour\n\n📊 Bénéfices selon le nombre:\n• 5 000 pas: Sédentaire\n• 7 500 pas: Peu actif\n• 10 000 pas: Actif ✅\n• 12 500 pas: Très actif\n\n💡 Astuces pour plus marcher:\n• Prenez les escaliers\n• Descendez 1 arrêt plus tôt\n• Marchez pendant les appels\n• Promenade après les repas`,
      stress: `🧘 *Gestion du Stress*\n\n🌬️ Technique 4-7-8:\n1. Inspirez pendant 4 sec\n2. Retenez 7 sec\n3. Expirez 8 sec\n4. Répétez 4 fois\n\n✅ Autres techniques:\n• Méditation 10 min/jour\n• Sport régulier\n• Journaling\n• Limiter réseaux sociaux\n• Sortir dans la nature\n• Parler à un ami`,
      mentalhealth: `🧠 *Santé Mentale*\n\n💚 Prendre soin de soi:\n• Dormez suffisamment 😴\n• Mangez équilibré 🥗\n• Bougez régulièrement 🏃\n• Connectez-vous aux autres 👥\n• Pratiquez la gratitude 🙏\n• Limitez les nouvelles négatives 📰\n\n📞 Si vous souffrez:\n• Parlez à quelqu'un de confiance\n• Consultez un professionnel de santé`,
    };

    if (workouts[cmd]) return await m.reply(workouts[cmd]);
    if (nutritionInfo[cmd]) return await m.reply(nutritionInfo[cmd]);
    if (healthTips[cmd]) return await m.reply(healthTips[cmd]);

    switch (cmd) {
      case 'imc': {
        const w = parseFloat(args[0]), h = parseFloat(args[1]);
        if (!w || !h) return await m.reply(`Usage: ${cfg.PREFIX}imc [poids_kg] [taille_m]\nEx: ${cfg.PREFIX}imc 70 1.75`);
        const imc = (w / (h * h)).toFixed(1);
        const status = imc < 18.5 ? '🔵 Insuffisance pondérale' : imc < 25 ? '🟢 Poids normal' : imc < 30 ? '🟡 Surpoids' : '🔴 Obésité';
        await m.reply(`⚖️ *IMC*\n\n📊 Résultat: *${imc}*\n📋 Statut: ${status}\n\n_IMC normal: 18.5 - 24.9_`);
        break;
      }
      case 'heartrate': {
        const age = parseInt(args[0]) || 25;
        const max = 220 - age;
        await m.reply(`❤️ *Fréquence Cardiaque*\n\nÂge: ${age} ans\n\n📊 FC max théorique: *${max} bpm*\n\n🎯 Zones d'entraînement:\n• Récup: ${Math.round(max * 0.5)}-${Math.round(max * 0.6)} bpm\n• Cardio léger: ${Math.round(max * 0.6)}-${Math.round(max * 0.7)} bpm\n• Cardio modéré: ${Math.round(max * 0.7)}-${Math.round(max * 0.8)} bpm\n• Intense: ${Math.round(max * 0.8)}-${Math.round(max * 0.9)} bpm`);
        break;
      }
      case 'meditation2': {
        const sessions = ['🧘 *5 min — Pleine conscience*\n\nFermez les yeux. Respirez naturellement.\nObservez vos pensées sans les juger.\nRevenez à votre souffle dès que l\'esprit s\'égare.', '🌊 *10 min — Respiration océanique*\n\nInspiration (4 sec) → ventre qui gonfle\nRétention (2 sec)\nExpiration (6 sec) → ventre qui rentre\n\nVisualisez une vague apaisante.'];
        await m.reply(sessions[randomInt(0, sessions.length - 1)]);
        break;
      }
      case 'anxiety': {
        await m.reply(`💙 *Gérer l'anxiété*\n\n🌬️ Technique 5-4-3-2-1:\n• 5 choses que vous VOYEZ\n• 4 choses que vous TOUCHEZ\n• 3 choses que vous ENTENDEZ\n• 2 choses que vous SENTEZ\n• 1 chose que vous GOÛTEZ\n\nCette technique ancre dans le présent et calme l'anxiété.`);
        break;
      }
      default:
        await m.reply(`❤️ *Santé & Sport*\n\nCommandes: ${cfg.PREFIX}workout, ${cfg.PREFIX}cardio, ${cfg.PREFIX}imc, ${cfg.PREFIX}calories, ${cfg.PREFIX}sleep, ${cfg.PREFIX}nutrition`);
    }
  },
};
