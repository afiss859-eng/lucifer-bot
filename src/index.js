require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  proto,
} = require('@whiskeysockets/baileys');

const pino    = require('pino');
const { Boom } = require('@hapi/boom');
const http    = require('http');
const path    = require('path');
const fs      = require('fs-extra');
const config  = require('../config/config');
const { loadPlugins } = require('./plugins');
const { smsg }        = require('./utils');
const db              = require('../database/db');
const web             = require('../web/server');

const store  = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', ignore: 'pid,hostname' } },
});

const BOT_BANNER = `
╔══════════════════════════════════════╗
║   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂               ║
║   v${config.VERSION} | 700+ Cmds | IA | Web   ║
╚══════════════════════════════════════╝`;

const channelPromoSent = new Set();

// ── État global du bot ────────────────────────────────────────────────────────
let globalSock        = null;
let botConnected      = false;
let reconnectAttempts = 0;
const MAX_RECONNECT   = 10;

// ── Pair Code: demande asynchrone via dashboard ───────────────────────────────
// Le socket DOIT avoir reçu l'événement QR avant qu'on puisse demander le code.
// pendingPairPhone est stocké ici; quand QR arrive, on appelle requestPairingCode.
let pendingPairPhone   = null;
let pairCodeResolve    = null;
let pairCodeReject     = null;
let socketReadyForPair = false;  // true dès le 1er événement QR reçu

/**
 * Demande le pair code WhatsApp.
 * Appelé depuis web/server.js via web.setPairCodeFn().
 * Attend que le socket soit prêt (événement QR) si nécessaire.
 */
async function requestPairCode(phone) {
  if (botConnected) {
    throw new Error('Bot déjà connecté à WhatsApp.');
  }
  if (!globalSock) {
    throw new Error('Bot en démarrage, patientez 15-20 secondes puis réessayez.');
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 7) {
    throw new Error('Numéro invalide. Format: indicatif + numéro (ex: 584265781353)');
  }

  // Si le socket est déjà en état "attente d'authentification" → appel direct
  if (socketReadyForPair) {
    logger.info(`📲 Pair code demandé pour: ${cleanPhone}`);
    const code = await globalSock.requestPairingCode(cleanPhone);
    logger.info(`✅ Pair code généré: ${code}`);
    return code;
  }

  // Sinon: stocker et attendre l'événement QR (max 45s)
  logger.info(`⏳ En attente que le socket soit prêt pour: ${cleanPhone}`);
  return new Promise((resolve, reject) => {
    pendingPairPhone = cleanPhone;
    pairCodeResolve  = resolve;
    pairCodeReject   = reject;

    const timeout = setTimeout(() => {
      if (pairCodeResolve) {
        pairCodeReject(new Error(
          'Timeout: le socket n\'est pas encore prêt. ' +
          'Attendez que le bot soit complètement démarré (20-30s) puis réessayez.'
        ));
        pendingPairPhone = pairCodeResolve = pairCodeReject = null;
      }
    }, 45000);

    // Cleanup si résolu avant timeout
    const origResolve = resolve;
    pairCodeResolve = (val) => { clearTimeout(timeout); origResolve(val); };
  });
}

// ── API interne SaaS (port 3500) ──────────────────────────────────────────────
function startInternalApi() {
  const PORT = parseInt(process.env.INTERNAL_API_PORT) || 3500;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const authHeader = req.headers['x-internal-token'] || '';
    const validToken = process.env.INTERNAL_TOKEN || 'lucifer-internal-2024';
    if (authHeader !== validToken) {
      res.writeHead(401);
      return res.end(JSON.stringify({ error: 'Token interne invalide.' }));
    }

    let body = '';
    req.on('data', d => (body += d));
    req.on('end', async () => {
      let payload = {};
      try { payload = body ? JSON.parse(body) : {}; } catch {}

      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200);
        return res.end(JSON.stringify({
          connected: botConnected,
          phone: globalSock?.user?.id?.split(':')[0] || null,
          name:  globalSock?.user?.name || null,
          uptime: Math.floor(process.uptime()),
        }));
      }

      if (req.method === 'POST' && req.url === '/send') {
        if (!globalSock || !botConnected) {
          res.writeHead(503);
          return res.end(JSON.stringify({ error: 'Bot non connecté.' }));
        }
        const { jid, message } = payload;
        if (!jid || !message) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'jid et message requis.' }));
        }
        try {
          await globalSock.sendMessage(jid, { text: message });
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: err.message }));
        }
      }

      if (req.method === 'POST' && req.url === '/restart') {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Redémarrage...' }));
        setTimeout(() => process.exit(0), 500);
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Route inconnue.' }));
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    logger.info(`🔌 API interne — localhost:${PORT}`);
  });
}

async function startBot() {
  const sessionDir = path.join(__dirname, '..', config.SESSION_NAME);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();
  console.log(BOT_BANNER);
  logger.info(`📱 WhatsApp v${version.join('.')} | Session: ${sessionDir}`);

  // Réinitialiser l'état pair code à chaque démarrage
  socketReadyForPair = false;

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    getMessage: async (key) => {
      const msg = store ? await store.loadMessage(key.remoteJid, key.id) : null;
      return msg?.message || proto.Message.fromObject({});
    },
  });

  globalSock = sock;
  store.bind(sock.ev);

  // ── Partager le socket ET la fonction pair code avec le web server ──────────
  web.setSocket(sock);
  web.setPairCodeFn(requestPairCode);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

    // ── QR reçu = socket prêt pour l'authentification ──────────────────────
    if (qr) {
      socketReadyForPair = true;
      logger.info(`📲 Socket prêt — En attente de connexion via Pair Code`);
      logger.info(`   Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);

      // Si une demande de pair code est en attente → traiter maintenant
      if (pendingPairPhone && pairCodeResolve) {
        logger.info(`🔑 Génération du pair code pour: ${pendingPairPhone}`);
        try {
          const code = await sock.requestPairingCode(pendingPairPhone);
          logger.info(`✅ Code généré: ${code}`);
          const resolve = pairCodeResolve;
          pendingPairPhone = pairCodeResolve = pairCodeReject = null;
          resolve(code);
        } catch (err) {
          logger.error(`❌ Erreur pair code: ${err.message}`);
          const reject = pairCodeReject;
          pendingPairPhone = pairCodeResolve = pairCodeReject = null;
          reject(err);
        }
      }
    }

    // ── Déconnexion ────────────────────────────────────────────────────────
    if (connection === 'close') {
      botConnected      = false;
      socketReadyForPair = false;
      web.setConnected(false);
      globalSock = null;

      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        logger.info(`🔄 Reconnexion ${reconnectAttempts}/${MAX_RECONNECT} dans ${delay/1000}s...`);
        setTimeout(startBot, delay);
      } else if (statusCode === DisconnectReason.loggedOut) {
        logger.error('⛔ Déconnecté. Nettoyez la session et redémarrez.');
        web.setSocket(null);
        web.setConnected(false);
      } else {
        logger.error('⛔ Impossible de se reconnecter.');
      }

    // ── Connecté ───────────────────────────────────────────────────────────
    } else if (connection === 'open') {
      botConnected      = true;
      socketReadyForPair = false;
      reconnectAttempts = 0;
      web.setConnected(true);
      const botNum  = sock.user?.id?.split(':')[0];
      const botName = sock.user?.name || config.BOT_NAME;
      logger.info(`✅ ${botName} (${botNum}) connecté!`);
      logger.info(`🌐 Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Auto-vue statuts ────────────────────────────────────────────────────────
  if (process.env.AUTO_VIEW_STATUS === 'true') {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (msg.key?.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
          try { await sock.readMessages([msg.key]); } catch {}
        }
      }
    });
  }

  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  let welcomePlugin, channelPlugin;
  try { welcomePlugin = require('../plugins/21_welcome_bye'); } catch {}
  try { channelPlugin  = require('../plugins/31_channel'); }   catch {}

  sock.ev.on('group-participants.update', async ({ id: groupId, participants, action }) => {
    try {
      if (!['add','remove','leave'].includes(action)) return;
      const meta = await sock.groupMetadata(groupId);
      const { subject: groupName, participants: allPart } = meta;
      for (const participant of participants) {
        const userNum = participant.split('@')[0];
        if (action === 'add' && welcomePlugin && db.getNote(groupId, '__welcome_on__') === '1') {
          const idx = parseInt(db.getNote(groupId, '__welcome_style__') || '0') % welcomePlugin.welcomeMessages.length;
          const text = welcomePlugin.formatMsg(welcomePlugin.welcomeMessages[idx], '@'+userNum, groupName, allPart.length);
          await sock.sendMessage(groupId, { text, mentions: [participant] });
        }
        if ((action === 'remove' || action === 'leave') && welcomePlugin && db.getNote(groupId, '__bye_on__') === '1') {
          const idx = Math.floor(Math.random() * welcomePlugin.goodbyeMessages.length);
          await sock.sendMessage(groupId, { text: welcomePlugin.formatMsg(welcomePlugin.goodbyeMessages[idx], userNum, groupName, allPart.length) });
        }
      }
    } catch (err) { logger.error('Erreur welcome/bye:', err.message); }
  });

  const cooldowns = new Map();

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek?.message) return;
      const m = smsg(sock, mek, store);
      m.pushName = mek.pushName || '';
      const body = m.body || '';
      const isCmd = body.startsWith(config.PREFIX);
      const senderJid = m.sender;
      const isOwner = senderJid === config.OWNER_NUMBER + '@s.whatsapp.net' || senderJid.startsWith(config.OWNER_NUMBER);
      const isVip   = db.isVip(senderJid) || isOwner;
      const isBanned = db.isBanned(senderJid);
      const botJid  = sock.user?.id?.replace(/:[0-9]+/, '') + '@s.whatsapp.net';

      if (senderJid === botJid) return;
      if (isBanned && !isOwner) return await m.reply(`🚫 Vous êtes banni.\nContactez: wa.me/${config.OWNER_NUMBER}`);

      if (!m.isGroup && !channelPromoSent.has(senderJid)) {
        const data = db.getData();
        if (!data.users?.[senderJid] && channelPlugin) channelPlugin.sendChannelPromo(sock, senderJid, m.pushName).catch(() => {});
        channelPromoSent.add(senderJid);
      }
      db.touchUser(senderJid);

      if (!isCmd) return;
      const command = body.slice(config.PREFIX.length).trim().split(' ')[0].toLowerCase();
      const args    = body.trim().split(/ +/).slice(1);
      const q       = args.join(' ');

      const coolKey = `${senderJid}:${command}`;
      const now = Date.now();
      if (cooldowns.has(coolKey) && now - cooldowns.get(coolKey) < config.ANTI_SPAM_DELAY) return;
      cooldowns.set(coolKey, now);

      logger.info(`💬 ${config.PREFIX}${command} | ${senderJid}`);
      const plugin = plugins.get(command);
      if (plugin) {
        if (plugin.vipOnly  && !isVip)   return await m.reply(`👑 *Commande VIP!*\nContactez: wa.me/${config.OWNER_NUMBER}`);
        if (plugin.ownerOnly && !isOwner) return await m.reply(`🔱 *Commande propriétaire uniquement!*`);
        await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });
      } else {
        await m.reply(`❌ Commande *${config.PREFIX}${command}* inconnue.\nTapez *${config.PREFIX}menu* pour la liste.`);
      }
    } catch (err) { logger.error('Erreur handler:', err.message); }
  });

  return sock;
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
web.startWebServer(parseInt(process.env.WEB_PORT) || 3000);
startInternalApi();
startBot().catch(err => { logger.error('Erreur fatale:', err); process.exit(1); });
