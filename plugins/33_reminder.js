'use strict';

/**
 * Plugin 33 — Rappels & minuteries persistants.
 * Les échéances sont stockées dans database/reminders.json et restaurées
 * automatiquement après un redémarrage ou une reconnexion du bot.
 */

const crypto = require('crypto');

const timers = new Map();
let activeSocket = null;
let activeDb = null;
let activeLogger = null;

const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 0x7fffffff;
const RETRY_DELAY_MS = 60 * 1000;
const MAX_SEND_RETRIES = 3;

function timerKey(entry) {
  return `${entry.ownerJid}:${entry.id}`;
}

function parseDuration(value) {
  const match = String(value || '').trim().match(/^(\d+(?:\.\d+)?)(s|sec|m|min|h|hr|hrs)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let multiplier;
  if (unit === 's' || unit === 'sec') multiplier = 1000;
  else if (unit === 'm' || unit === 'min') multiplier = 60 * 1000;
  else multiplier = 60 * 60 * 1000;

  const ms = amount * multiplier;
  return Number.isSafeInteger(Math.round(ms)) ? Math.round(ms) : null;
}

function formatMs(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function clearTimer(entry) {
  const key = timerKey(entry);
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.delete(key);
}

function scheduleDelivery(entry, retryCount = 0, explicitDelay = null) {
  if (!activeSocket || !activeDb) return;
  clearTimer(entry);

  const delay = explicitDelay === null
    ? Math.min(Math.max(0, Number(entry.dueAt) - Date.now()), MAX_TIMEOUT_MS)
    : Math.min(Math.max(0, explicitDelay), MAX_TIMEOUT_MS);

  const timer = setTimeout(() => {
    deliverReminder(entry, retryCount).catch(error => {
      activeLogger?.error?.(`Rappel ${entry.id}: ${error.message}`);
    });
  }, delay);

  timers.set(timerKey(entry), timer);
  timer.unref?.();
}

async function deliverReminder(entry, retryCount = 0) {
  const key = timerKey(entry);
  timers.delete(key);
  if (!activeSocket || !activeDb) return;

  const isTimer = entry.type === 'timer';
  const message = isTimer
    ? `⏱️ *MINUTERIE TERMINÉE !*\n\n${entry.text}\n\n✅ Votre minuterie de *${entry.durationLabel}* est écoulée.`
    : `⏰ *RAPPEL !*\n\n📝 ${entry.text}\n\n_Échéance : ${new Date(entry.dueAt).toLocaleString('fr-FR')}_`;

  try {
    await activeSocket.sendMessage(entry.chat, { text: message });
    activeDb.removeReminder(entry.ownerJid, entry.id);
    activeLogger?.info?.(`Rappel ${entry.id} envoyé à ${entry.ownerJid}`);
  } catch (error) {
    activeLogger?.warn?.(`Envoi du rappel ${entry.id} impossible : ${error.message}`);
    if (retryCount < MAX_SEND_RETRIES) {
      scheduleDelivery(entry, retryCount + 1, RETRY_DELAY_MS);
    } else {
      activeLogger?.error?.(`Rappel ${entry.id} conservé en base. Il sera restauré à la prochaine reconnexion.`);
    }
  }
}

function initialize(sock, db, logger = null) {
  if (!sock || !db?.getAllReminders || !db?.removeReminder) {
    throw new TypeError('Socket WhatsApp et stockage de rappels requis.');
  }

  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();

  activeSocket = sock;
  activeDb = db;
  activeLogger = logger;

  const stored = db.getAllReminders();
  for (const entry of stored) scheduleDelivery(entry);

  logger?.info?.(`${stored.length} rappel(s) restauré(s)`);
  return stored.length;
}

module.exports = {
  commands: ['rappel','minuterie','rappels','annuler','timer','reminder'],
  description: 'Rappels et minuteries persistants',
  initialize,
  parseDuration,
  formatMs,

  execute: async ({ sock, m, args, config: cfg, db, logger }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    const ownerJid = m.sender;
    const chat = m.chat;

    if (!ownerJid || !chat) {
      return m.reply('❌ Impossible d’identifier le propriétaire ou la discussion du rappel.');
    }

    switch (cmd) {
      case 'rappel':
      case 'reminder':
      case 'minuterie':
      case 'timer': {
        const isTimer = cmd === 'minuterie' || cmd === 'timer';
        const durationLabel = String(args[0] || '').trim().toLowerCase();
        const text = isTimer
          ? (args.slice(1).join(' ').trim() || 'Votre minuterie est terminée.')
          : (args.slice(1).join(' ').trim() || 'Rappel !');

        if (!durationLabel) {
          return m.reply(
            `${isTimer ? '⏱️ Minuterie' : '⏰ Rappel'}\n\nUsage : ${cfg.PREFIX}${cmd} [durée] [message]\n\nExemples :\n• ${cfg.PREFIX}${cmd} 10m Boire de l’eau\n• ${cfg.PREFIX}${cmd} 1h Réunion importante\n• ${cfg.PREFIX}${cmd} 30s Test rapide\n\nDurées : s = secondes, m = minutes, h = heures.`
          );
        }

        const ms = parseDuration(durationLabel);
        if (!ms || ms < (isTimer ? 3000 : 5000)) {
          return m.reply(`❌ Durée invalide. Minimum : ${isTimer ? '3' : '5'} secondes. Exemples : 30s, 10m, 1h.`);
        }
        if (ms > MAX_DURATION_MS) {
          return m.reply('❌ Durée maximale : 24 heures.');
        }
        if (typeof db.addReminder !== 'function') {
          return m.reply('❌ Le stockage persistant des rappels n’est pas disponible sur cette version.');
        }

        const now = Date.now();
        const entry = {
          id: crypto.randomBytes(4).toString('hex'),
          ownerJid,
          chat,
          text,
          createdAt: now,
          dueAt: now + ms,
          durationLabel,
          type: isTimer ? 'timer' : 'reminder',
        };

        try {
          db.addReminder(entry);
          if (activeSocket !== sock || activeDb !== db) initialize(sock, db, logger);
          scheduleDelivery(entry);
        } catch (error) {
          return m.reply(`❌ Impossible d’enregistrer le rappel : ${error.message}`);
        }

        return m.reply(
          `${isTimer ? '⏱️ Minuterie démarrée' : '⏰ Rappel programmé'} !\n\n📝 ${text}\n⏳ Dans : *${durationLabel}*\n🆔 Identifiant : *#${entry.id}*\n\nLe rappel est conservé après un redémarrage du bot.`
        );
      }

      case 'rappels': {
        const entries = db.getReminders(ownerJid);
        if (!entries.length) {
          return m.reply('📋 *Aucun rappel actif.*\n\nUtilisez .rappel 10m votre message pour en créer un.');
        }

        const list = entries.map(entry => {
          const type = entry.type === 'timer' ? '⏱️' : '⏰';
          return `${type} #${entry.id} — ${entry.text} (dans *${formatMs(Number(entry.dueAt) - Date.now())}*)`;
        }).join('\n');

        return m.reply(`📋 *Vos rappels actifs (${entries.length})*\n\n${list}\n\nAnnuler : ${cfg.PREFIX}annuler [identifiant]`);
      }

      case 'annuler': {
        const id = String(args[0] || '').replace(/^#/, '').trim();
        if (!id) return m.reply(`Usage : ${cfg.PREFIX}annuler [identifiant]\nVoir : ${cfg.PREFIX}rappels`);

        const exists = db.getReminders(ownerJid).some(entry => entry.id === id);
        if (!exists) return m.reply('❌ Rappel introuvable ou ne vous appartenant pas.');

        if (!db.removeReminder(ownerJid, id)) {
          return m.reply('❌ Le rappel n’a pas pu être annulé.');
        }

        const entry = { ownerJid, id };
        clearTimer(entry);
        return m.reply(`✅ Rappel #${id} annulé.`);
      }
    }
  },
};
