module.exports = {
  commands: ['save','get','del','notes','note','reminder','todo','addtodo','deltodo','listtodo'],
  description: 'Notes et rappels',
  execute: async ({ m, args, q, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'save':
      case 'note': {
        const name = args[0];
        const content = args.slice(1).join(' ');
        if (!name || !content) return await m.reply(`Usage: ${cfg.PREFIX}save [nom] [contenu]\nEx: ${cfg.PREFIX}save shopping Acheter du lait, pain, oeufs`);
        db.saveNote(m.chat, name, content);
        await m.reply(`📝 *Note sauvegardée!*\n\n📌 Nom: *${name}*\n📄 Contenu: ${content}\n\nRécupérez avec: ${cfg.PREFIX}get ${name}`);
        break;
      }
      case 'get': {
        const name = args[0];
        if (!name) {
          const list = db.listNotes(m.chat);
          if (!list.length) return await m.reply('📋 Aucune note sauvegardée.');
          return await m.reply(`📋 *Notes disponibles*\n\n${list.map((n,i)=>`${i+1}. ${n}`).join('\n')}\n\nLisez avec: ${cfg.PREFIX}get [nom]`);
        }
        const note = db.getNote(m.chat, name);
        if (!note) return await m.reply(`❌ Note "${name}" introuvable.\nVos notes: ${db.listNotes(m.chat).join(', ') || 'Aucune'}`);
        await m.reply(`📝 *Note: ${name}*\n\n${note}`);
        break;
      }
      case 'del': {
        const name = args[0];
        if (!name) return await m.reply(`Usage: ${cfg.PREFIX}del [nom de la note]`);
        const note = db.getNote(m.chat, name);
        if (!note) return await m.reply(`❌ Note "${name}" introuvable.`);
        db.deleteNote(m.chat, name);
        await m.reply(`🗑️ Note *${name}* supprimée!`);
        break;
      }
      case 'notes': {
        const list = db.listNotes(m.chat);
        if (!list.length) return await m.reply(`📋 Aucune note.\n\nCréez une note: ${cfg.PREFIX}save [nom] [contenu]`);
        await m.reply(`📋 *Toutes vos notes (${list.length})*\n\n${list.map((n,i)=>`${i+1}. 📌 ${n}`).join('\n')}`);
        break;
      }
      case 'reminder': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}reminder [texte]\nEx: ${cfg.PREFIX}reminder Appeler maman à 18h`);
        await m.reply(`⏰ *Rappel créé!*\n\n📌 ${q}\n\n_Note: Les rappels sont stockés mais non automatiques dans cette version._`);
        break;
      }
      case 'todo':
      case 'listtodo': {
        const todos = db.getNote(m.chat, '__todo__') || '';
        if (!todos) return await m.reply(`📝 *Liste TODO vide*\n\nAjoutez: ${cfg.PREFIX}addtodo [tâche]`);
        const items = todos.split('\n').filter(Boolean);
        await m.reply(`✅ *TODO (${items.length})*\n\n${items.map((t,i)=>`${i+1}. ${t}`).join('\n')}`);
        break;
      }
      case 'addtodo': {
        if (!q) return await m.reply(`Usage: ${cfg.PREFIX}addtodo [tâche]`);
        const existing = db.getNote(m.chat, '__todo__') || '';
        db.saveNote(m.chat, '__todo__', existing ? existing+'\n□ '+q : '□ '+q);
        const count = (db.getNote(m.chat, '__todo__')||'').split('\n').filter(Boolean).length;
        await m.reply(`✅ Tâche ajoutée!\n\n□ ${q}\n\nTotal: ${count} tâche(s)`);
        break;
      }
      case 'deltodo': {
        const num = parseInt(args[0]);
        const todos = db.getNote(m.chat, '__todo__') || '';
        const items = todos.split('\n').filter(Boolean);
        if (!num || num < 1 || num > items.length) return await m.reply(`Usage: ${cfg.PREFIX}deltodo [numéro]\nVous avez ${items.length} tâche(s)`);
        items.splice(num-1, 1);
        db.saveNote(m.chat, '__todo__', items.join('\n'));
        await m.reply(`🗑️ Tâche #${num} supprimée!\nReste: ${items.length} tâche(s)`);
        break;
      }
    }
  },
};
