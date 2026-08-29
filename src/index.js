/**
 * 𓅂 DOMA LUCIFERO — Bot WhatsApp
 * Connexion : variable PHONE_NUMBER sur Render → pair code auto au démarrage
 */
'use strict';
require('dotenv').config();

const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, proto } = baileys;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || null;
const Browsers = baileys.Browsers || null;
const makeInMemoryStore = baileys.makeInMemoryStore || null;
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');
const web = require('../web/server');
const db = require('../database/db');

const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } },
});
const silent = pino({ level: 'silent' });
const store = makeInMemoryStore ? makeInMemoryStore({ logger: silent }) : null;
const SESSION_DIR = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');
const OWNER = config.OWNER_NUMBER || '';
let globalSock = null;
let botConnected = false;
let reconnects = 0;
const MAX_RECONNECT = 15;
let sharedCode = null;
let handlersLoaded = false;

function isOwnerNumber(sender) {
  if (!OWNER || !sender) return false;
  const senderNumber = String(sender).split('@')[0].replace(/\D/g, '');
  return senderNumber === OWNER;
}

function setCode(c) {
  sharedCode = c;
  web.setPendingCode(c);
}

function printCode(formatted, phone) {
  console.log(`\n🔑 CODE WHATSAPP — +${phone} — ${formatted}\n`);
}

async function loadPluginsAndHandlers(sock) {
  if (handlersLoaded) return;
  handlersLoaded = true;

  let loadPlugins, smsg;
  try { ({ loadPlugins } = require('./plugins')); } catch (e) { handlersLoaded = false; throw e; }
  try { ({ smsg } = require('./utils')); } catch (e) { handlersLoaded = false; throw e; }

  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);
  const cooldowns = new Map();
  const PREFIX = config.PREFIX || '.';

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const mek = messages?.[0];
      if (!mek?.message || mek.key?.fromMe) return;

      const m = smsg(sock, mek);
      const body = String(m.body || m.text || '').trim();
      const sender = m.sender || mek.key?.remoteJid;
      if (!sender || !body.startsWith(PREFIX)) return;

      if (db.touchUser) db.touchUser(sender);
      const isOwner = isOwnerNumber(sender);
      if (!isOwner && db.isBanned?.(sender)) return;

      const tokens = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmd = tokens.shift()?.toLowerCase();
      if (!cmd) return;
      const plugin = plugins.get(cmd);
      if (!plugin) {
        return m.reply(`❌ *${PREFIX}${cmd}* inconnue.\nTapez *${PREFIX}menu*`);
      }

      const coolKey = `${sender}:${cmd}`;
      const now = Date.now();
      if (cooldowns.has(coolKey) && now - cooldowns.get(coolKey) < 2500) return;
      cooldowns.set(coolKey, now);

      const isVip = isOwner || !!db.isVip?.(sender);
      if (plugin.ownerOnly && !isOwner) return m.reply('🔱 Réservé au propriétaire.');
      if (plugin.vipOnly && !isVip) return m.reply('👑 Commande VIP.');
      if (plugin.groupOnly && !m.isGroup) return m.reply('❌ Cette commande est réservée aux groupes.');

      await plugin.execute({
        sock,
        m,
        args: tokens,
        q: tokens.join(' '),
        isOwner,
        isVip,
        config,
        logger,
        db,
      });
    } catch (e) {
      logger.error(`Handler: ${e?.stack || e}`);
    }
  });

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action !== 'add') return;
    try {
      const meta = await sock.groupMetadata(id);
      for (const p of participants || []) {
        await sock.sendMessage(id, {
          text: `👋 Bienvenue *@${p.split('@')[0]}* dans *${meta.subject}*! 🎉`,
          mentions: [p],
        });
      }
    } catch (e) {
      logger.warn(`Welcome: ${e.message}`);
    }
  });
}

async function startBot() {
  fs.ensureDirSync(SESSION_DIR);
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`🟡 Baileys v${version.join('.')} | registered=${state.creds.registered}`);
  const authKeys = makeCacheableSignalKeyStore
    ? makeCacheableSignalKeyStore(state.keys, silent)
    : state.keys;
  const browser = Browsers ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '120.0.6099.71'];

  const currentSock = makeWASocket({
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

  globalSock = currentSock;
  if (store) store.bind(currentSock.ev);
  web.setSocket(currentSock);

  if (!state.creds.registered) {
    const phone = String(process.env.PHONE_NUMBER || process.env.BOT_PHONE || '').replace(/\D/g, '');
    if (phone.length >= 7) {
      setTimeout(async () => {
        try {
          const code = await currentSock.requestPairingCode(phone);
          const formatted = code.match(/.{1,4}/g)?.join('-') || code;
          setCode({ code, formatted, phone, time: Date.now() });
          printCode(formatted, phone);
        } catch (e) {
          logger.error(`❌ requestPairingCode: ${e.message}`);
        }
      }, 3000);
    } else {
      logger.warn('⚠️ PHONE_NUMBER/BOT_PHONE absent: utilisez le dashboard ou configurez la variable.');
    }
  }

  currentSock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) logger.warn('⚠️ QR reçu mais le mode pair-code est utilisé.');

    if (connection === 'open') {
      botConnected = true;
      reconnects = 0;
      setCode(null);
      web.setConnected(true);
      logger.info(`🟢 ${config.BOT_NAME} connecté`);
      try { await loadPluginsAndHandlers(currentSock); }
      catch (e) { logger.error(`Plugins: ${e?.stack || e}`); }
      return;
    }

    if (connection !== 'close') return;

    botConnected = false;
    if (globalSock === currentSock) globalSock = null;
    web.setConnected(false);
    web.setSocket(null);

    const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
    const cleanLogout = statusCode === DisconnectReason.loggedOut;
    const badSession = statusCode === DisconnectReason.badSession || [401, 403, 405].includes(statusCode);

    if (badSession && !cleanLogout) {
      try { await fs.emptyDir(SESSION_DIR); } catch {}
      handlersLoaded = false;
      reconnects = 0;
      return setTimeout(startBot, 3000);
    }
    if (cleanLogout) {
      logger.error('⛔ WhatsApp a fermé la session. Une nouvelle liaison est nécessaire.');
      handlersLoaded = false;
      return;
    }
    if (++reconnects <= MAX_RECONNECT) {
      handlersLoaded = false;
      return setTimeout(startBot, Math.min(2000 * reconnects, 30000));
    }
    logger.error('⛔ Trop de reconnexions consécutives.');
    process.exit(1);
  });

  currentSock.ev.on('creds.update', saveCreds);

  if (process.env.AUTO_VIEW_STATUS === 'true') {
    currentSock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages || []) {
        if (message.key?.remoteJid === 'status@broadcast' && !message.key.fromMe) {
          try { await currentSock.readMessages([message.key]); } catch {}
        }
      }
    });
  }
}

async function triggerPairCode(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length < 7) throw new Error('Numéro invalide.');
  if (botConnected) throw new Error('Bot déjà connecté.');
  if (!globalSock) throw new Error('Bot en démarrage, réessayez dans quelques secondes.');
  const code = await globalSock.requestPairingCode(clean);
  const formatted = code.match(/.{1,4}/g)?.join('-') || code;
  setCode({ code, formatted, phone: clean, time: Date.now() });
  printCode(formatted, clean);
  return code;
}

function getCode() { return sharedCode; }

const WEB_PORT = Number.parseInt(process.env.WEB_PORT, 10) || 3000;
web.startWebServer(WEB_PORT);
web.setPairCodeFn(triggerPairCode);
web.setGetLastCodeFn(getCode);
startBot().catch(e => {
  logger.error(`Fatal: ${e?.stack || e}`);
  process.exit(1);
});
