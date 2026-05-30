/**
 * 𓅂 DOMA LUCIFERO — Bot WhatsApp
 * Connexion : variable PHONE_NUMBER sur Render → pair code auto au démarrage
 * Méthode identique aux bots XMD publics (BERA-XMD, XSTRO-MD)
 */
'use strict';
require('dotenv').config();

// ── Imports Baileys (safe — toutes versions 6.x) ──────────────────────────────
const baileys = require('@whiskeysockets/baileys');
const makeWASocket              = baileys.default;
const { useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        proto }                 = baileys;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || null;
const Browsers                    = baileys.Browsers || null;
const makeInMemoryStore           = baileys.makeInMemoryStore || null;

const pino     = require('pino');
const { Boom } = require('@hapi/boom');
const path     = require('path');
const fs       = require('fs-extra');
const config   = require('../config/config');
const web      = require('../web/server');

// ── Loggers ───────────────────────────────────────────────────────────────────
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
  },
});
const silent = pino({ level: 'silent' });

// ── Store (optionnel) ─────────────────────────────────────────────────────────
const store = makeInMemoryStore
  ? makeInMemoryStore({ logger: silent })
  : null;

// ── Chemins ───────────────────────────────────────────────────────────────────
const SESSION_DIR = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');

// ── État global ───────────────────────────────────────────────────────────────
let globalSock    = null;
let botConnected  = false;
let reconnects    = 0;
const MAX_RECONNECT = 15;
let sharedCode    = null;   // { code, formatted, phone, time }

function setCode(c) {
  sharedCode = c;
  web.setPendingCode(c);
}

// ── Affiche le code proprement dans les logs Render ───────────────────────────
function printCode(formatted, phone) {
  const line = '═'.repeat(46);
  console.log(`\n╔${line}╗`);
  console.log(`║   🔑  CODE DE LIAISON WHATSAPP               ║`);
  console.log(`╠${line}╣`);
  console.log(`║                                              ║`);
  console.log(`║   Numéro : +${phone.padEnd(32)}║`);
  console.log(`║   Code   :  👉  ${formatted}  👈           ║`);
  console.log(`║                                              ║`);
  console.log(`╠${line}╣`);
  console.log(`║  WhatsApp ⚙️ → Appareils liés                ║`);
  console.log(`║  → Lier un appareil → Lier avec numéro      ║`);
  console.log(`║  → Entrez le code ci-dessus                  ║`);
  console.log(`╚${line}╝\n`);
}

// ── DÉMARRAGE PRINCIPAL ───────────────────────────────────────────────────────
async function startBot() {
  fs.ensureDirSync(SESSION_DIR);

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version }          = await fetchLatestBaileysVersion();

  logger.info(`🟡 Baileys v${version.join('.')} | registered=${state.creds.registered}`);

  // Auth keys
  const authKeys = makeCacheableSignalKeyStore
    ? makeCacheableSignalKeyStore(state.keys, silent)
    : state.keys;

  // Browser — Ubuntu Chrome, le plus stable
  const browser = Browsers ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '120.0.6099.71'];

  // Créer socket
  const sock = makeWASocket({
    version,
    logger: silent,
    printQRInTerminal: false,
    browser,
    auth: { creds: state.creds, keys: authKeys },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 3,
    getMessage: async () => proto.Message.fromObject({}),
  });

  globalSock = sock;
  if (store) store.bind(sock.ev);
  web.setSocket(sock);

  // ─────────────────────────────────────────────────────────────────────────
  // 🔑 PAIR CODE — Méthode des bots XMD publics
  //
  // Règle absolue : requestPairingCode() doit être appelé
  //   1. Après création du socket (pas avant)
  //   2. Dans les 60 premières secondes
  //   3. SEULEMENT si state.creds.registered === false
  //   4. Avec un délai de 3-5s pour laisser le socket se connecter
  //
  // PHONE_NUMBER : défini dans Render → Environment Variables
  // Format : indicatif + numéro SANS + ni espaces (ex: 33612345678)
  // ─────────────────────────────────────────────────────────────────────────
  if (!state.creds.registered) {
    const phone = (
      process.env.PHONE_NUMBER ||
      process.env.BOT_PHONE    ||
      ''
    ).replace(/\D/g, '');

    if (phone && phone.length >= 7) {
      logger.info(`📲 PHONE_NUMBER=${phone} → code dans 3s...`);

      setTimeout(async () => {
        try {
          const code      = await sock.requestPairingCode(phone);
          const formatted = code.match(/.{1,4}/g)?.join('-') || code;

          setCode({ code, formatted, phone, time: Date.now() });
          printCode(formatted, phone);

        } catch (e) {
          logger.error(`❌ requestPairingCode: ${e.message}`);

          if (
            e.message?.includes('not-authorized') ||
            e.message?.includes('conflict')       ||
            e.message?.includes('bad-session')
          ) {
            logger.warn('🧹 Session corrompue → nettoyage + relance...');
            try { await fs.emptyDir(SESSION_DIR); } catch {}
            setTimeout(startBot, 4000);
          }
        }
      }, 3000);

    } else {
      // Pas de PHONE_NUMBER → le dashboard servira de backup
      logger.warn('⚠️  Variable PHONE_NUMBER absente ou trop courte.');
      logger.warn('   ➜ Ajoutez-la dans Render : Environment Variables');
      logger.warn('   ➜ Ex: PHONE_NUMBER=33612345678');
      logger.warn('   ➜ Ou entrez votre numéro dans le Dashboard web.');
    }
  } else {
    logger.info('♻️  Session valide détectée → reconnexion...');
  }

  // ── Événements connexion ───────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // QR ignoré volontairement — on n'utilise que pair code
    if (qr) {
      logger.warn('⚠️  QR ignoré. Si persistant → videz la session.');
      return;
    }

    if (connection === 'close') {
      botConnected = false;
      globalSock   = null;
      web.setConnected(false);
      web.setSocket(null);

      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn(`🔌 Connexion fermée — code: ${statusCode}`);

      const restartClean = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        401, 403, 405,
      ].includes(statusCode);

      if (restartClean) {
        logger.warn('🧹 Session invalide → nettoyage et redémarrage...');
        try { await fs.emptyDir(SESSION_DIR); } catch {}
        setTimeout(startBot, 3000);
        return;
      }

      if (reconnects < MAX_RECONNECT) {
        reconnects++;
        const delay = Math.min(2000 * reconnects, 30000);
        logger.info(`🔄 Reconnexion ${reconnects}/${MAX_RECONNECT} dans ${delay / 1000}s...`);
        setTimeout(startBot, delay);
      } else {
        logger.error('⛔ Trop d\'échecs consécutifs → nettoyage final...');
        try { await fs.emptyDir(SESSION_DIR); } catch {}
        setTimeout(() => process.exit(1), 1000);
      }

    } else if (connection === 'open') {
      botConnected = true;
      reconnects   = 0;
      setCode(null);

      const num  = sock.user?.id?.split(':')[0] || '?';
      const name = sock.user?.name || config.BOT_NAME || 'LUCIFERO';

      web.setConnected(true);

      console.log(`\n✅ ${name} (+${num}) CONNECTÉ AVEC SUCCÈS !\n`);
      logger.info(`🟢 Bot opérationnel — Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);

      // Charger les plugins une fois connecté
      loadPluginsAndHandlers(sock).catch(e => logger.error('Plugins: ' + e.message));
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Auto-vue statuts
  if (process.env.AUTO_VIEW_STATUS === 'true') {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages) {
        if (m.key?.remoteJid === 'status@broadcast' && !m.key.fromMe) {
          try { await sock.readMessages([m.key]); } catch {}
        }
      }
    });
  }
}

// ── Plugins + message handler ─────────────────────────────────────────────────
async function loadPluginsAndHandlers(sock) {
  let loadPlugins, smsg, db;
  try { ({ loadPlugins } = require('./plugins')); }   catch {}
  try { ({ smsg }        = require('./utils'));   }   catch {}
  try {  db              = require('../database/db'); } catch {}

  const plugins = loadPlugins ? await loadPlugins() : new Map();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  const cooldowns = new Map();
  const PREFIX    = config.PREFIX || '.';
  const OWNER     = config.OWNER_NUMBER;

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const mek = messages[0];
      if (!mek?.message) return;

      const m      = smsg ? smsg(sock, mek) : mek;
      m.pushName   = mek.pushName || '';
      const body   = m.body || m.text || '';
      const sender = m.sender || mek.key?.remoteJid;

      const isOwner  = !!sender && (sender.startsWith(OWNER) || sender === OWNER + '@s.whatsapp.net');
      const isVip    = !!(db?.isVip?.(sender)) || isOwner;
      const isBanned = !!(db?.isBanned?.(sender)) && !isOwner;

      if (db?.touchUser) db.touchUser(sender);
      if (!body.startsWith(PREFIX)) return;
      if (isBanned) {
        try { await sock.sendMessage(sender, { text: `🚫 Vous êtes banni.\nContactez: wa.me/${OWNER}` }); } catch {}
        return;
      }

      const cmd  = body.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
      const args = body.trim().split(/\s+/).slice(1);
      const q    = args.join(' ');

      // Anti-spam
      const coolKey = `${sender}:${cmd}`;
      const now     = Date.now();
      if (cooldowns.has(coolKey) && now - cooldowns.get(coolKey) < 2500) return;
      cooldowns.set(coolKey, now);

      logger.info(`💬 ${PREFIX}${cmd} — ${(sender || '?').split('@')[0]}`);

      const plugin = plugins.get(cmd);
      if (!plugin) {
        try { await sock.sendMessage(sender, { text: `❌ *${PREFIX}${cmd}* inconnue.\nTapez *${PREFIX}menu*` }); } catch {}
        return;
      }
      if (plugin.ownerOnly && !isOwner) {
        try { await sock.sendMessage(sender, { text: `🔱 Réservé au propriétaire.` }); } catch {}
        return;
      }
      if (plugin.vipOnly && !isVip) {
        try { await sock.sendMessage(sender, { text: `👑 Commande VIP. Contact: wa.me/${OWNER}` }); } catch {}
        return;
      }

      await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });

    } catch (e) {
      logger.error(`Handler: ${e.message}`);
    }
  });

  // Bienvenue groupes
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      if (action !== 'add') return;
      const meta = await sock.groupMetadata(id);
      for (const p of participants) {
        await sock.sendMessage(id, {
          text: `👋 Bienvenue *@${p.split('@')[0]}* dans *${meta.subject}*! 🎉`,
          mentions: [p],
        });
      }
    } catch {}
  });
}

// ── triggerPairCode — backup dashboard (si pas de PHONE_NUMBER) ───────────────
async function triggerPairCode(phone) {
  const clean = phone.replace(/\D/g, '');
  if (!clean || clean.length < 7)
    throw new Error('Numéro invalide. Format: indicatif+numéro (ex: 33612345678)');
  if (botConnected)
    throw new Error('Bot déjà connecté! Aucune action nécessaire.');
  if (!globalSock)
    throw new Error('Bot en démarrage... Attendez 15-20s et réessayez.');

  if (globalSock.authState?.creds?.registered)
    throw new Error('Session existante. Videz la session puis redémarrez.');

  logger.info(`🔑 Pair code dashboard → ${clean}`);
  const code      = await globalSock.requestPairingCode(clean);
  const formatted = code.match(/.{1,4}/g)?.join('-') || code;
  setCode({ code, formatted, phone: clean, time: Date.now() });
  printCode(formatted, clean);
  return code;
}

function getCode() { return sharedCode; }

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const WEB_PORT = parseInt(process.env.WEB_PORT) || 3000;
web.startWebServer(WEB_PORT);
web.setPairCodeFn(triggerPairCode);
web.setGetLastCodeFn(getCode);

console.log(`
╔════════════════════════════════════════════════╗
║  𓅂 DOMA LUCIFERO 𓅂  — Démarrage               ║
║  Dashboard : http://localhost:${String(WEB_PORT).padEnd(17)}║
║  Connexion : PHONE_NUMBER env var              ║
╚════════════════════════════════════════════════╝
`);

startBot().catch(e => {
  logger.error(`Fatal: ${e.message}`);
  process.exit(1);
});
