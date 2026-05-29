/**
 * Plugin 33 — Rappels & Minuterie
 * Commandes: .rappel, .minuterie, .rappels, .annuler
 */

const reminders = new Map(); // jid → [{id, text, time, timeout}]
let reminderId = 1;

module.exports = {
  commands: ['rappel','minuterie','rappels','annuler','timer','reminder'],
  description: 'Rappels et minuteries',
  execute: async ({ sock, m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const jid  = m.sender;
    const chat = m.chat;

    switch(cmd) {
      case 'rappel':
      case 'reminder': {
        // Usage: .rappel 10m Boire de l'eau
        if (!args[0]) return await m.reply(
          `⏰ *Rappel*\n\nUsage: ${cfg.PREFIX}rappel [durée] [message]\n\nExemples:\n` +
          `• ${cfg.PREFIX}rappel 10m Boire de l'eau\n` +
          `• ${cfg.PREFIX}rappel 1h Réunion importante\n` +
          `• ${cfg.PREFIX}rappel 30s Test rapide\n\n` +
          `Durées: *s* = secondes, *m* = minutes, *h* = heures`
        );
        const durationStr = args[0].toLowerCase();
        const text = args.slice(1).join(' ') || 'Rappel!';
        const ms = parseDuration(durationStr);
        if (!ms || ms < 5000) return await m.reply('❌ Durée invalide. Minimum 5 secondes.\nEx: 10m, 1h, 30s');
        if (ms > 24 * 3600 * 1000) return await m.reply('❌ Maximum 24 heures.');

        const id = reminderId++;
        const timeoutId = setTimeout(async () => {
          try {
            await sock.sendMessage(chat, {
              text: `⏰ *RAPPEL!*\n\n📝 ${text}\n\n_Rappel programmé il y a ${durationStr}_`
            });
          } catch {}
          // Nettoyer
          const arr = reminders.get(jid) || [];
          reminders.set(jid, arr.filter(r => r.id !== id));
        }, ms);

        const arr = reminders.get(jid) || [];
        arr.push({ id, text, durationStr, timeout: timeoutId, scheduledAt: Date.now(), msLeft: ms });
        reminders.set(jid, arr);

        await m.reply(`⏰ *Rappel programmé!*\n\n📝 *Message:* ${text}\n⏱️ *Dans:* ${durationStr}\n🆔 *ID:* #${id}\n\n_Tapez ${cfg.PREFIX}rappels pour voir vos rappels_`);
        break;
      }

      case 'minuterie':
      case 'timer': {
        if (!args[0]) return await m.reply(`⏱️ *Minuterie*\n\nUsage: ${cfg.PREFIX}minuterie [durée]\nEx: ${cfg.PREFIX}minuterie 5m`);
        const ms = parseDuration(args[0]);
        if (!ms || ms < 3000) return await m.reply('❌ Durée invalide. Minimum 3 secondes.');
        const id = reminderId++;
        setTimeout(async () => {
          try { await sock.sendMessage(chat, { text: `⏱️ *MINUTERIE TERMINÉE!*\n\nVotre minuterie de *${args[0]}* est écoulée! ✅` }); } catch {}
        }, ms);
        await m.reply(`⏱️ Minuterie démarrée: *${args[0]}*\nID: #${id}`);
        break;
      }

      case 'rappels': {
        const arr = reminders.get(jid) || [];
        if (!arr.length) return await m.reply('📋 *Aucun rappel actif*\n\nUtilisez .rappel pour programmer un rappel.');
        const list = arr.map(r => {
          const elapsed = Date.now() - r.scheduledAt;
          const remaining = Math.max(0, r.msLeft - elapsed);
          return `#${r.id} — "${r.text}" dans *${formatMs(remaining)}*`;
        }).join('\n');
        await m.reply(`📋 *Vos rappels actifs:*\n\n${list}\n\nAnnuler: ${cfg.PREFIX}annuler [ID]`);
        break;
      }

      case 'annuler': {
        const id = parseInt(args[0]);
        if (!id) return await m.reply(`Usage: ${cfg.PREFIX}annuler [ID]\nVoir vos rappels: ${cfg.PREFIX}rappels`);
        const arr = reminders.get(jid) || [];
        const idx = arr.findIndex(r => r.id === id);
        if (idx === -1) return await m.reply(`❌ Rappel #${id} introuvable.`);
        clearTimeout(arr[idx].timeout);
        arr.splice(idx, 1);
        reminders.set(jid, arr);
        await m.reply(`✅ Rappel #${id} annulé.`);
        break;
      }
    }
  },
};

function parseDuration(str) {
  const match = str.match(/^(\d+(?:\.\d+)?)(s|m|h|min|sec|hrs?)$/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('s')) return val * 1000;
  if (unit.startsWith('m')) return val * 60 * 1000;
  if (unit.startsWith('h')) return val * 3600 * 1000;
  return null;
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
