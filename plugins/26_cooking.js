const { randomInt } = require('../src/utils');

const recipes = [
  { name: '🍕 Pizza Margherita', time: '30 min', diff: '⭐⭐', ingredients: ['250g farine', '7g levure', '150ml eau tiède', 'Sauce tomate', 'Mozzarella', 'Basilic frais', 'Huile d\'olive', 'Sel'], steps: ['Mélangez farine, levure, eau, sel. Pétrissez 10 min.', 'Laissez lever 1h à température ambiante.', 'Étalez la pâte, ajoutez sauce tomate.', 'Ajoutez mozzarella et enfournez 220°C pendant 12-15 min.', 'Sortez du four, ajoutez le basilic frais et un filet d\'huile.'] },
  { name: '🍜 Ramen Maison', time: '45 min', diff: '⭐⭐⭐', ingredients: ['Nouilles ramen', '1L bouillon poulet', '2 œufs', 'Sauce soja 3 cs', 'Gingembre frais', 'Ail 3 gousses', 'Bok choy', 'Nori', 'Oignons verts'], steps: ['Faites cuire les œufs 6 min dans l\'eau bouillante. Refroidissez et pelez.', 'Faites suer ail et gingembre dans un peu d\'huile.', 'Ajoutez bouillon et sauce soja. Laissez mijoter 20 min.', 'Cuisez les nouilles séparément selon paquet.', 'Assemblez: nouilles + bouillon + œuf coupé + légumes + nori.'] },
  { name: '🥘 Poulet Yassa', time: '1h', diff: '⭐⭐', ingredients: ['1 poulet découpé', '4 gros oignons', 'Citron (jus)', '3 cs huile', 'Moutarde 1 cs', 'Ail', 'Sel, poivre, laurier'], steps: ['Marinez le poulet: oignons, citron, moutarde, ail, sel, poivre. 2h minimum.', 'Grillez le poulet au four ou à la poêle.', 'Faites revenir les oignons de la marinade dans l\'huile 20 min.', 'Ajoutez le poulet grillé dans les oignons.', 'Laissez mijoter 15 min. Servez avec du riz.'] },
  { name: '🫕 Couscous Marocain', time: '1h30', diff: '⭐⭐⭐', ingredients: ['500g couscous', '500g mouton ou poulet', 'Pois chiches', 'Navets, courgettes, carottes', 'Tomates pelées', 'Ras el-hanout', 'Cumin, coriandre', 'Bouillon'], steps: ['Faites revenir la viande avec les épices.', 'Ajoutez les légumes durs (carottes, navets) et le bouillon.', 'Laissez mijoter 30 min, ajoutez les courgettes et pois chiches.', 'Préparez le couscous: versez l\'eau bouillante salée, laissez gonfler.', 'Servez couscous avec la viande et les légumes par-dessus.'] },
  { name: '🍰 Tiramisu', time: '30 min + 4h repos', diff: '⭐⭐', ingredients: ['250g mascarpone', '3 œufs', '100g sucre', '200ml café fort', '24 biscuits à la cuiller', 'Cacao en poudre', 'Amaretto (optionnel)'], steps: ['Séparez les blancs des jaunes. Battez les jaunes avec le sucre jusqu\'à blanchir.', 'Incorporez le mascarpone aux jaunes sucrés.', 'Montez les blancs en neige ferme et incorporez délicatement.', 'Trempez rapidement les biscuits dans le café refroidi.', 'Alternez: biscuits / crème / biscuits / crème. Réfrigérez 4h. Saupoudrez de cacao.'] },
];

const cocktails = [
  { name: '🍹 Mojito', ingredients: ['50ml rhum blanc', '30ml jus citron vert', '2 cs sucre de canne', '10 feuilles de menthe', 'Eau gazeuse', 'Glace pilée'], steps: ['Écrasez doucement la menthe avec le sucre et le citron.', 'Ajoutez la glace pilée et le rhum.', 'Complétez avec l\'eau gazeuse. Remuez délicatement.', 'Décorez avec de la menthe et une tranche de citron.'] },
  { name: '🍸 Margarita', ingredients: ['50ml tequila', '25ml triple sec (Cointreau)', '25ml jus citron vert', 'Sel pour le bord', 'Glace'], steps: ['Passez le bord du verre dans du sel.', 'Mélangez tous les ingrédients avec de la glace dans un shaker.', 'Filtrez dans le verre avec sel.', 'Décorez d\'une tranche de citron vert.'] },
];

const tips = [
  '🔪 Maintenez vos couteaux bien aiguisés pour plus de sécurité et de précision.',
  '🧂 Salez toujours l\'eau des pâtes généreusement (eau de mer).',
  '🥩 Laissez reposer la viande 5 min après cuisson pour conserver les jus.',
  '🧅 Réfrigérez les oignons avant de les couper pour éviter les larmes.',
  '🍋 Roulez les agrumes avant de les presser pour avoir plus de jus.',
  '🥚 Les œufs à température ambiante montent mieux en neige.',
  '🧄 Écrasez l\'ail avant de l\'émincer pour libérer plus d\'arômes.',
  '🍳 Préchauffez toujours votre poêle avant d\'ajouter l\'huile.',
];

module.exports = {
  commands: [
    'recipe','recette','cook','ingredient','cocktail2','drink2','food2',
    'cooktip','breakfast','lunch','dinner','dessert','vegan','vegetarian',
    'snack','appetizer','soup','salad2','grill','baking',
  ],
  description: 'Cuisine & Recettes',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'recipe':
      case 'recette':
      case 'cook': {
        const r = recipes[randomInt(0, recipes.length - 1)];
        const ingList = r.ingredients.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
        const stepList = r.steps.map((s, idx) => `*${idx + 1}.* ${s}`).join('\n');
        await m.reply(`👨‍🍳 *${r.name}*\n\n⏱️ Temps: ${r.time} | Difficulté: ${r.diff}\n\n🛒 *Ingrédients:*\n${ingList}\n\n📝 *Étapes:*\n${stepList}`);
        break;
      }
      case 'cocktail2':
      case 'drink2': {
        const c = cocktails[randomInt(0, cocktails.length - 1)];
        const ingList = c.ingredients.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
        const stepList = c.steps.map((s, idx) => `*${idx + 1}.* ${s}`).join('\n');
        await m.reply(`🍹 *${c.name}*\n\n🛒 *Ingrédients:*\n${ingList}\n\n📝 *Préparation:*\n${stepList}`);
        break;
      }
      case 'cooktip':
        await m.reply(`💡 *Astuce Cuisine*\n\n${tips[randomInt(0, tips.length - 1)]}`);
        break;
      case 'breakfast':
        await m.reply(`🌅 *Petit-déjeuner sain*\n\n🥣 Option 1: Porridge\n• Flocons d'avoine + lait\n• Banane tranchée + miel\n• Graines de chia\n\n🍳 Option 2: Œufs brouillés\n• 2 œufs brouillés\n• Toast complet\n• Avocat 🥑\n• Tomates cerises\n\n🥤 Boisson: Café noir ou thé vert`);
        break;
      case 'lunch':
        await m.reply(`☀️ *Déjeuner équilibré*\n\n🥗 Salade César:\n• Laitue romaine\n• Poulet grillé\n• Parmesan\n• Croûtons\n• Sauce César\n\n🥘 Ou plat chaud:\n• Riz complet + légumes sautés\n• Protéine au choix\n• Légumes de saison`);
        break;
      case 'dinner':
        await m.reply(`🌙 *Dîner léger*\n\n🐟 Saumon grillé:\n• Saumon au four 180°C (15 min)\n• Légumes vapeur (brocoli, carottes)\n• Quinoa cuit\n• Sauce yaourt-citron\n\n🍲 Ou soupe + pain:\n• Soupe de légumes maison\n• 1-2 tranches pain complet\n• Fromage blanc en dessert`);
        break;
      case 'dessert':
        await m.reply(`🍰 *Dessert rapide*\n\n⏱️ Mousse au chocolat (15 min):\n• 200g chocolat noir\n• 4 œufs\n• 1 pincée de sel\n\n1. Faites fondre le chocolat\n2. Séparez œufs, mélangez jaunes + chocolat tiédi\n3. Montez blancs en neige avec sel\n4. Incorporez délicatement\n5. Réfrigérez 2h minimum 🍫`);
        break;
      case 'vegan':
        await m.reply(`🌱 *Recette Vegan*\n\n🍛 Curry de pois chiches:\n\n🛒 Ingrédients:\n• 2 boîtes pois chiches\n• 1 boîte lait de coco\n• 2 tomates\n• 1 oignon\n• Curry, cumin, coriandre\n• Ail, gingembre\n\n📝 Étapes:\n1. Faites revenir oignon + ail + gingembre\n2. Ajoutez épices et tomates\n3. Pois chiches + lait de coco\n4. Mijotez 20 min. Servez avec riz basmati.`);
        break;
      case 'soup':
        await m.reply(`🥣 *Soupe Maison*\n\n🍅 Soupe de tomates:\n• 800g tomates pelées\n• 1 oignon\n• 2 gousses ail\n• Basilic frais\n• Bouillon légumes\n• Crème fraîche\n\n📝 Faites revenir oignon et ail, ajoutez tomates et bouillon. Mixez. Ajoutez basilic et crème.`);
        break;
      default:
        await m.reply(`👨‍🍳 *Cuisine*\n\nCommandes:\n• ${cfg.PREFIX}recette — Recette aléatoire\n• ${cfg.PREFIX}cocktail2 — Cocktail\n• ${cfg.PREFIX}cooktip — Astuce cuisine\n• ${cfg.PREFIX}breakfast — Petit-déjeuner\n• ${cfg.PREFIX}lunch — Déjeuner\n• ${cfg.PREFIX}dinner — Dîner\n• ${cfg.PREFIX}dessert — Dessert\n• ${cfg.PREFIX}vegan — Recette vegan`);
    }
  },
};
