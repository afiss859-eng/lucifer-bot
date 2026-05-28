const { randomInt } = require('../src/utils');

module.exports = {
  commands: [
    'android','phone','specs','battery','storage','ram',
    'signal','wifi','bluetooth','nfc','camera','flashlight',
    'vibrate','ringtone','volume','brightness','rotate',
    'screenshot2','record','stopwatch','alarm','calculator',
    'calendar','contacts','messages','calls','notifications',
    'appinfo','cleardata','uninstall','install','update',
    'playstore','settings','developer','about','build',
  ],
  description: 'Commandes Android (infos)',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    const androidTips = {
      android: `📱 *Conseils Android*\n\n1. Maintenez le bouton d'alimentation pour accéder aux options rapides\n2. Double-tap sur l'écran pour allumer (si activé)\n3. Glissez vers le bas depuis le haut pour les notifications\n4. Maintenez une app sur l'écran d'accueil pour la déplacer\n5. Allez dans Paramètres → Développeurs pour les options avancées`,
      battery: `🔋 *Conseils batterie Android*\n\n• Activez le mode économie d'énergie\n• Désactivez le Bluetooth et WiFi si non utilisés\n• Réduisez la luminosité de l'écran\n• Désactivez la synchronisation automatique\n• Fermez les apps en arrière-plan\n• Utilisez le mode sombre`,
      storage: `💾 *Libérer de l'espace Android*\n\n• Paramètres → Stockage → Libérer de l'espace\n• Supprimer les apps non utilisées\n• Effacer le cache des applications\n• Utiliser Google Photos pour les photos\n• Déplacer des fichiers vers le cloud`,
      wifi: `📶 *Problèmes WiFi Android*\n\n• Désactivez puis réactivez le WiFi\n• Oubliez le réseau et reconnectez-vous\n• Videz le cache WiFi: Paramètres → Apps → WiFi\n• Réinitialisez les paramètres réseau\n• Vérifiez si d'autres appareils se connectent`,
      camera: `📸 *Conseils Appareil Photo Android*\n\n• Nettoyez l'objectif régulièrement\n• Utilisez le mode HDR pour les photos en extérieur\n• Activez la grille pour un meilleur cadrage\n• Utilisez le minuteur pour éviter le flou\n• Mode pro pour un contrôle total`,
      settings: `⚙️ *Paramètres utiles Android*\n\n• Paramètres → Accessibilité → Options d'affichage\n• Paramètres → Sons → Ne pas déranger\n• Paramètres → Confidentialité → Gestionnaire d'autorisations\n• Paramètres → Batterie → Optimisation batterie\n• Paramètres → Développeurs → Options de débogage`,
      developer: `👨‍💻 *Mode Développeur Android*\n\nPour activer:\n1. Paramètres → À propos du téléphone\n2. Tapez 7 fois sur "Numéro de build"\n3. Retournez dans Paramètres\n4. Développeurs sera visible\n\nOptions utiles:\n• Débogage USB\n• Limites de processus en arrière-plan\n• Animation de fenêtres`,
    };

    const tip = androidTips[cmd] || androidTips.android;
    await m.reply(tip + `\n\n_𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 | Conseils Android_`);
  },
};
