/**
 * Plugin 32 — Auto-Vue Statuts & Présence
 * Commandes: .autoview, .autopresence, .autoread, .autotyping
 */
module.exports = {
  commands: ['autoview','autopresence','autoread','autotyping','autoviewstatus'],
  description: 'Automatisations (vue statuts, présence, lecture)',
  execute: async ({ sock, m, args, isOwner, config: cfg, db }) => {
    if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const state = args[0]?.toLowerCase();
    if (!state || !['on','off'].includes(state)) {
      const cur = db.getNote('__global__', `__${cmd}__`) === '1' ? '✅ ON' : '❌ OFF';
      return await m.reply(`⚙️ *${cmd.toUpperCase()}*\nStatut: *${cur}*\n\nUsage:\n• ${cfg.PREFIX}${cmd} on\n• ${cfg.PREFIX}${cmd} off`);
    }
    const val = state === 'on' ? '1' : '0';
    db.saveNote('__global__', `__${cmd}__`, val);

    const desc = {
      autoview:       state==='on' ? '✅ Vue automatique des statuts activée' : '❌ Vue automatique des statuts désactivée',
      autopresence:   state==='on' ? '✅ Présence en ligne automatique activée' : '❌ Présence désactivée',
      autoread:       state==='on' ? '✅ Lecture automatique des messages activée' : '❌ Lecture automatique désactivée',
      autotyping:     state==='on' ? '✅ Indicateur de frappe automatique activé' : '❌ Indicateur de frappe désactivé',
      autoviewstatus: state==='on' ? '✅ Vue statuts activée' : '❌ Vue statuts désactivée',
    };
    await m.reply(`🤖 *Auto-Config*\n\n${desc[cmd] || 'Paramètre mis à jour.'}`);

    // Appliquer immédiatement si on
    if (cmd === 'autopresence' && state === 'on') {
      await sock.sendPresenceUpdate('available').catch(()=>{});
    }
  },
};
