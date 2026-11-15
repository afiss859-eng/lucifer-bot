/**
 * Les automatisations de présence et de lecture sont volontairement désactivées.
 * Les clients WhatsApp non officiels et l'automatisation des statuts exposent le compte à des restrictions.
 */
module.exports = {
  commands: ['autoview', 'autopresence', 'autoread', 'autotyping', 'autoviewstatus'],
  description: 'Automatisations désactivées pour protéger le compte WhatsApp',
  ownerOnly: true,
  execute: async ({ m }) => m.reply('🛡️ Cette automatisation est désactivée par sécurité. Le bot ne lit pas automatiquement les statuts et ne force pas la présence ou la lecture.'),
};
