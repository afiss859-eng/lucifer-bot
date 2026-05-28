const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  proto,
  getContentType,
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');
const { loadPlugins } = require('./plugins');
const { smsg } = require('./utils');
const db = require('../database/db');

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', ignore: 'pid,hostname' },
  },
});

const BOT_BANNER = `
╔══════════════════════════════════╗
║   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂          ║
║   Version ${config.VERSION} | 500+ Cmds      ║
║   Propriétaire: ${config.OWNER_NUMBER}  ║
╚══════════════════════════════════╝`;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '..', config.SESSION_NAME)
  );
  const { version } = await fetchLatestBaileysVersion();

  console.log(BOT_BANNER);
  logger.info(`📱 WhatsApp v${version.join('.')}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯', 'Chrome', '20.0.0'],
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return proto.Message.fromObject({});
    },
  });

  store.bind(sock.ev);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) logger.info('📲 Scannez le QR code avec WhatsApp');
    if (connection === 'close') {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        logger.info('🔄 Reconnexion...');
        startBot();
      } else {
        logger.error('⛔ Déconnecté. Supprimez le dossier session et redémarrez.');
      }
    } else if (connection === 'open') {
      logger.info(`✅ ${config.BOT_NAME} connecté !`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  const cooldowns = new Map();

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek?.message) return;

      const m = smsg(sock, mek, store);
      const body = m.body || '';
      const isCmd = body.startsWith(config.PREFIX);
      if (!isCmd) return;

      const command = body.slice(config.PREFIX.length).trim().split(' ')[0].toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      const senderJid = m.sender;
      const isOwner =
        senderJid === config.OWNER_NUMBER + '@s.whatsapp.net' ||
        senderJid.startsWith(config.OWNER_NUMBER);
      const isVip = db.isVip(senderJid) || isOwner;
      const isBanned = db.isBanned(senderJid);
      const botJid = sock.user?.id?.replace(/:[0-9]+/, '') + '@s.whatsapp.net';

      if (senderJid === botJid) return;
      if (isBanned && !isOwner) {
        return await m.reply(`🚫 Vous êtes banni du bot.\nContactez: wa.me/${config.OWNER_NUMBER}`);
      }

      // Anti-spam cooldown
      const coolKey = `${senderJid}:${command}`;
      const now = Date.now();
      if (cooldowns.has(coolKey)) {
        const diff = now - cooldowns.get(coolKey);
        if (diff < config.ANTI_SPAM_DELAY) return;
      }
      cooldowns.set(coolKey, now);

      logger.info(`💬 ${config.PREFIX}${command} | ${senderJid}`);

      const plugin = plugins.get(command);
      if (plugin) {
        // Vérification VIP
        if (plugin.vipOnly && !isVip) {
          return await m.reply(
            `👑 *Commande VIP uniquement!*\n\nCette commande est réservée aux membres VIP.\n\nContactez le propriétaire: wa.me/${config.OWNER_NUMBER}`
          );
        }
        // Vérification propriétaire
        if (plugin.ownerOnly && !isOwner) {
          return await m.reply(`🔱 *Commande propriétaire uniquement!*`);
        }
        await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });
      } else {
        await m.reply(`❌ Commande *${config.PREFIX}${command}* inconnue.\nTapez *${config.PREFIX}menu* pour voir toutes les commandes.`);
      }
    } catch (err) {
      logger.error('Erreur:', err.message);
    }
  });

  return sock;
}

startBot().catch((err) => {
  logger.error('Erreur fatale:', err);
  process.exit(1);
});
