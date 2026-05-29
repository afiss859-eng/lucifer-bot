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
║   v${config.VERSION} | 684+ Cmds | IA | Web   ║
╚══════════════════════════════════════╝`;

const channelPromoSent = new Set();

// ── Socket global (partagé avec l'API interne et le web) ─────────────────────
let globalSock = null;
let botConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

// ── API interne (même processus — partagé via module) ─────────────────────────
// Le web/server.js accède au socket via setSocket() — plus besoin de port séparé
// Conservé pour compatibilité avec le panel SaaS externe (port 3500)
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

      if (req.method === 'POST' && req.url === '/paircode') {
        if (!globalSock) {
          res.writeHead(503);
          return res.end(JSON.stringify({ error: 'Bot non démarré.' }));
        }
        if (botConnected) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Bot déjà connecté.' }));
        }
        const phone = (payload.phone || '').replace(/\D/g, '');
        if (!phone || phone.length < 7) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Numéro invalide.' }));
        }
        try {
          const code = await globalSock.requestPairingCode(phone);
          res.writeHead(200);
          return res.end(JSON.stringify({ code, phone, message: 'Code généré.' }));
        } catch (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: err.message }));
        }
      }

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
        if (!globalSock || !botConnected) { res.writeHead(503); return res.end(JSON.stringify({ error: 'Bot non connecté.' })); }
        const { jid, message } = payload;
        if (!jid || !message) { res.writeHead(400); return res.end(JSON.stringify({ error: 'jid et message requis.' })); }
        try {
          await globalSock.sendMessage(jid, { text: message });
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true }));
        } catch (err) { res.writeHead(500); return res.end(JSON.stringify({ error: err.message })); }
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
    logger.info(`🔌 API interne panel — localhost:${PORT}`);
  });
}

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
    printQRInTerminal: false,   // ✅ FIX: désactivé pour utiliser le Pair Code uniquement
    auth: state,
    browser: ['𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯', 'Chrome', '20.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    getMessage: async (key) => {
      const msg = store ? await store.loadMessage(key.remoteJid, key.id) : null;
      return msg?.message || proto.Message.fromObject({});
    },
  });

  // Expose le socket IMMÉDIATEMENT pour que le dashboard puisse générer le pair code
  globalSock = sock;
  store.bind(sock.ev);
  web.setSocket(sock);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Socket prêt pour le pair code — le dashboard peut maintenant appeler /api/paircode
      logger.info(`📲 Prêt pour connexion via Pair Code — Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
      logger.info(`   Entrez votre numéro sur le dashboard pour recevoir le code.`);
    }

    if (connection === 'close') {
      botConnected = false;
      web.setConnected(false);
      globalSock = null;

      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000); // backoff exponentiel
        logger.info(`🔄 Reconnexion ${reconnectAttempts}/${MAX_RECONNECT} dans ${delay/1000}s...`);
        setTimeout(startBot, delay);
      } else if (statusCode === DisconnectReason.loggedOut) {
        logger.error('⛔ Déconnecté (déconnexion manuelle). Supprimez le dossier session et redémarrez.');
        web.setSocket(null);
      } else {
        logger.error('⛔ Impossible de se reconnecter après plusieurs tentatives.');
      }

    } else if (connection === 'open') {
      botConnected = true;
      reconnectAttempts = 0;
      web.setConnected(true);
      const botNum = sock.user?.id?.split(':')[0];
      const botName = sock.user?.name || config.BOT_NAME;
      logger.info(`✅ ${botName} (${botNum}) connecté!`);
      logger.info(`🌐 Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
      logger.info(`📊 Panel SaaS: http://localhost:${process.env.PANEL_PORT || 4000}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Auto-vue des statuts ────────────────────────────────────────────────────
  if (process.env.AUTO_VIEW_STATUS === 'true') {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (msg.key?.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
          try {
            await sock.readMessages([msg.key]);
          } catch {}
        }
      }
    });
  }

  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  let welcomePlugin, channelPlugin;
  try { welcomePlugin = require('../plugins/21_welcome_bye'); } catch {}
  try { channelPlugin  = require('../plugins/31_channel'); } catch {}

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
        if (plugin.vipOnly && !isVip) return await m.reply(`👑 *Commande VIP!*\nContactez: wa.me/${config.OWNER_NUMBER}`);
        if (plugin.ownerOnly && !isOwner) return await m.reply(`🔱 *Commande propriétaire uniquement!*`);
        await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });
      } else {
        await m.reply(`❌ Commande *${config.PREFIX}${command}* inconnue.\nTapez *${config.PREFIX}menu* pour voir toutes les commandes.`);
      }
    } catch (err) { logger.error('Erreur handler:', err.message); }
  });

  return sock;
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
web.startWebServer(parseInt(process.env.WEB_PORT) || 3000);
startInternalApi();
startBot().catch(err => { logger.error('Erreur fatale:', err); process.exit(1); });
