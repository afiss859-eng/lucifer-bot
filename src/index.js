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
const QRCode  = require('qrcode');
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

// ── Socket global (partagé avec l'API interne) ────────────────────────────────
let globalSock = null;
let botConnected = false;

// ── API interne (localhost:3500) — utilisée par le panel SaaS ─────────────────
// Permet de générer des pair codes depuis le dashboard web
function startInternalApi() {
  const PORT = parseInt(process.env.INTERNAL_API_PORT) || 3500;

  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Vérification du token interne
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

      // ── POST /paircode — Générer un code de liaison ────────────────────────
      if (req.method === 'POST' && req.url === '/paircode') {
        if (!globalSock) {
          res.writeHead(503);
          return res.end(JSON.stringify({ error: 'Bot non démarré. Lancez npm start d\'abord.' }));
        }
        if (botConnected) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Bot déjà connecté. Déconnectez d\'abord.' }));
        }
        const phone = (payload.phone || '').replace(/\D/g, '');
        if (!phone || phone.length < 7) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Numéro de téléphone invalide.' }));
        }
        try {
          logger.info(`📲 Génération code pour ${phone}...`);
          const code = await globalSock.requestPairingCode(phone);
          logger.info(`✅ Code généré: ${code}`);
          res.writeHead(200);
          return res.end(JSON.stringify({ code, phone, message: 'Code généré. Entrez-le dans WhatsApp → Appareils liés → Lier avec numéro.' }));
        } catch (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: 'Erreur: ' + err.message + '. Assurez-vous que le bot est démarré sans session existante.' }));
        }
      }

      // ── GET /status — Statut du bot ────────────────────────────────────────
      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200);
        return res.end(JSON.stringify({
          connected: botConnected,
          phone: globalSock?.user?.id?.split(':')[0] || null,
          name:  globalSock?.user?.name || null,
          uptime: Math.floor(process.uptime()),
        }));
      }

      // ── POST /send — Envoyer un message (broadcast admin) ─────────────────
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

      // ── POST /restart ──────────────────────────────────────────────────────
      if (req.method === 'POST' && req.url === '/restart') {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Redémarrage...' }));
        setTimeout(() => process.exit(0), 500); // PM2 redémarre automatiquement
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
    printQRInTerminal: true,
    auth: state,
    browser: ['𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯', 'Chrome', '20.0.0'],
    getMessage: async (key) => {
      const msg = store ? await store.loadMessage(key.remoteJid, key.id) : null;
      return msg?.message || proto.Message.fromObject({});
    },
  });

  // Expose le socket globalement pour l'API interne
  globalSock = sock;
  store.bind(sock.ev);
  web.setSocket(sock);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      logger.info('📲 QR dispo — Dashboard: http://localhost:' + (process.env.WEB_PORT || 3000));
      try { web.setQr(await QRCode.toDataURL(qr)); } catch { web.setQr(null); }
    }
    if (connection === 'close') {
      botConnected = false;
      web.setConnected(false);
      const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) { logger.info('🔄 Reconnexion...'); startBot(); }
      else logger.error('⛔ Déconnecté. Supprimez le dossier session et redémarrez.');
    } else if (connection === 'open') {
      botConnected = true;
      web.setConnected(true);
      logger.info(`✅ ${config.BOT_NAME} connecté ! Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
      logger.info(`📊 Panel SaaS: http://localhost:${process.env.PANEL_PORT || 4000}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

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
