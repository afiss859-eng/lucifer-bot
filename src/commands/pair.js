/**
 * Commande: pair
 * Description: Générer ou afficher ton code de parrainage (simple, comme dans les bots XMD)
 */

const { createReferralForUser, getReferralByUser } = require('../database/firebase');

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'P-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

module.exports = {
  name: 'pair',
  description: "Afficher ou créer ton code de parrainage",
  category: 'utilitaire',
  permissions: [],
  usage: '!pair',

  async execute(sock, message, args) {
    try {
      const sender = message.key.remoteJid.split('@')[0];

      const existing = await getReferralByUser(sender);
      let code = existing?.code;

      if (!code) {
        code = generateCode();
        await createReferralForUser(sender, code);
      }

      const reply = `🤝 Ton code de parrainage: *${code}*\n\nPartage-le avec tes amis. Ils peuvent utiliser:\n!rejoindre ${code}\n\nC'est tout — simple et efficace.`;

      await sock.sendMessage(message.key.remoteJid, { text: reply });
    } catch (error) {
      console.error('Erreur pair:', error);
      await sock.sendMessage(message.key.remoteJid, { text: '❌ Erreur lors de la génération du code.' });
    }
  },
};
