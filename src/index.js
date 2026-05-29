require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers,
  proto,
} = require('@whiskeysockets/baileys');

const pino     = require('pino');
const { Boom } = require('@hapi/boom');
const http     = require('http');
const path     = require('path');
const fs       = require('fs-extra');
const config   = require('../config/config');
const { loadPlugins } = require('./plugins');
const { smsg }        = require('./utils');
const db              = require('../database/db');
const web             = require('../web/server');

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', ignore: 'pid,hostname' } },
});

const SESSION_DIR = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');
const PHONE_FILE  = path.join(SESSION_DIR, 'pending_phone.txt');
const CODE_FILE   = path.join(SESSION_DIR, 'last_code.txt');

const BOT_BANNER = `
╔══════════════════════════════════════╗
║   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂               ║
║   v${config.VERSION} | 700+ Cmds | IA | Web  ║
╚══════════════════════════════════════╝`;

const channelPromoSent = new Set();
let globalSock        = null;
let botConnected      = false;
let reconnectAttempts = 0;
const MAX_RECONNECT   = 10;

// Dernier code généré (partagé avec le dashboard via polling)
let pendingCodeForDashboard = null;

function getPendingPhone()  { try { return fs.readFileSync(PHONE_FILE, 'utf-8').trim(); } catch { return null; } }
function setPendingPhone(p) { fs.ensureDirSync(SESSION_DIR); fs.writeFileSync(PHONE_FILE, p); }
function clearPendingPhone(){ try { fs.removeSync(PHONE_FILE); } catch {} }

// ── triggerPairCode : appelé depuis le dashboard ──────────────────────────────
// Stocke le numéro et génère le code immédiatement si le socket est prêt,
// sinon le stocke pour génération automatique au prochain démarrage.
async function triggerPairCode(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean || clean.length < 7) throw new Error('Numéro invalide. Format: indicatif + numéro (ex: 2250102030405)');
  if (botConnected) throw new Error('Bot déjà connecté à WhatsApp.');

  // Toujours sauvegarder le numéro (sécurité si socket pas encore prêt)
  setPendingPhone(clean);

  if (!globalSock) {
    throw new Error('Bot en cours de démarrage. Le code sera généré automatiquement dans 15-20s. Rafraîchissez le dashboard.');
  }
  if (globalSock.authState?.creds?.registered) {
    throw new Error('Session existante. Videz la session et redémarrez pour reconnecter.');
  }

  // Délai de 1.5s pour laisser le socket s'établir, puis demande directe
  await new Promise(r => setTimeout(r, 1500));
  logger.info(`🔑 Demande pair code pour: ${clean}`);

  const code = await globalSock.requestPairingCode(clean);
  logger.info(`✅ Code généré: ${code}`);

  pendingCodeForDashboard = { code, formatted: code.match(/.{1,4}/g)?.join('-') || code, time: Date.now() };
  try { fs.writeFileSync(CODE_FILE, code + '\n' + clean + '\n' + new Date().toISOString()); } catch {}
  clearPendingPhone();
  return code;
}

function getLastCode() { return pendingCodeForDashboard; }

// ── API interne SaaS (port 3500) ──────────────────────────────────────────────
function startInternalApi() {
  const PORT = parseInt(process.env.INTERNAL_API_PORT) || 3500;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if ((req.headers['x-internal-token'] || '') !== (process.env.INTERNAL_TOKEN || 'lucifer-internal-2024')) {
      res.writeHead(401); return res.end(JSON.stringify({ error: 'Token invalide.' }));
    }
    let body = ''; req.on('data', d => body += d);
    req.on('end', async () => {
      let p = {}; try { p = body ? JSON.parse(body) : {}; } catch {}
      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200);
        return res.end(JSON.stringify({ connected: botConnected, phone: globalSock?.user?.id?.split(':')[0] || null, uptime: Math.floor(process.uptime()) }));
      }
      if (req.method === 'POST' && req.url === '/restart') {
        res.writeHead(200); res.end(JSON.stringify({ message: 'Redémarrage...' }));
        setTimeout(() => process.exit(0), 500); return;
      }
      res.writeHead(404); res.end(JSON.stringify({ error: 'Route inconnue.' }));
    });
  });
  server.listen(PORT, '127.0.0.1', () => logger.info(`🔌 API interne — localhost:${PORT}`));
}

// ── Démarrage du bot ───────────────────────────────────────────────────────────
async function startBot() {
  fs.ensureDirSync(SESSION_DIR);
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(BOT_BANNER);
  logger.info(`📱 WhatsApp v${version.join('.')} ${isLatest ? '✓ latest' : ''}`);

  const silentLog = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger: silentLog,
    printQRInTerminal: false,
    // ✅ Browsers.ubuntu('Chrome') = identifié comme Chrome sur Ubuntu (plus stable pour pair code)
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      // ✅ makeCacheableSignalKeyStore améliore la stabilité des clés de session
      keys: makeCacheableSignalKeyStore(state.keys, silentLog),
    },
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      const msg = store ? await store.loadMessage(key.remoteJid, key.id) : null;
      return msg?.message || proto.Message.fromObject({});
    },
  });

  globalSock = sock;
  store.bind(sock.ev);
  web.setSocket(sock);
  web.setPairCodeFn(triggerPairCode);
  web.setGetLastCodeFn(getLastCode);

  // ── Auto pair code si numéro en attente ─────────────────────────────────────
  if (!state.creds.registered) {
    const pending = getPendingPhone();
    if (pending) {
      logger.info(`📲 Numéro en attente: ${pending} — code dans 3s...`);
      setTimeout(async () => {
        try {
          if (!botConnected && globalSock) {
            const code = await globalSock.requestPairingCode(pending);
            logger.info(`✅ Pair code auto: ${code}`);
            pendingCodeForDashboard = { code, formatted: code.match(/.{1,4}/g)?.join('-') || code, time: Date.now() };
            try { fs.writeFileSync(CODE_FILE, code + '\n' + pending + '\n' + new Date().toISOString()); } catch {}
            web.setPendingCode(code);
            clearPendingPhone();
          }
        } catch(e) { logger.error(`❌ Pair code auto échoué: ${e.message}`); }
      }, 3000);
    } else {
      logger.info(`📲 Aucune session. Ouvrez le dashboard pour connecter le bot.`);
      logger.info(`   Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
    }
  } else {
    logger.info(`♻️  Session existante détectée — reconnexion en cours...`);
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      botConnected = false;
      web.setConnected(false);
      globalSock = null;
      const code   = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn(`🔌 Connexion fermée (code: ${code})`);

      if (code === DisconnectReason.loggedOut) {
        logger.error('⛔ Déconnecté (loggedOut) — videz la session et redémarrez.');
        web.setSocket(null);
      } else if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        logger.info(`🔄 Reconnexion ${reconnectAttempts}/${MAX_RECONNECT} dans ${delay/1000}s`);
        setTimeout(startBot, delay);
      } else {
        logger.error('⛔ Max tentatives atteint.');
      }

    } else if (connection === 'open') {
      botConnected = true;
      reconnectAttempts = 0;
      pendingCodeForDashboard = null;
      web.setConnected(true);
      clearPendingPhone();
      logger.info(`✅ ${sock.user?.name || config.BOT_NAME} (${sock.user?.id?.split(':')[0]}) connecté!`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  if (process.env.AUTO_VIEW_STATUS === 'true') {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages)
        if (m.key?.remoteJid === 'status@broadcast' && !m.key.fromMe)
          try { await sock.readMessages([m.key]); } catch {}
    });
  }

  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  let welcomePlugin, channelPlugin;
  try { welcomePlugin = require('../plugins/21_welcome_bye'); } catch {}
  try { channelPlugin  = require('../plugins/31_channel'); }   catch {}

  sock.ev.on('group-participants.update', async ({ id: gid, participants, action }) => {
    try {
      if (!['add','remove','leave'].includes(action)) return;
      const meta = await sock.groupMetadata(gid);
      for (const p of participants) {
        const num = p.split('@')[0];
        if (action === 'add' && welcomePlugin && db.getNote(gid, '__welcome_on__') === '1') {
          const idx = parseInt(db.getNote(gid, '__welcome_style__') || '0') % welcomePlugin.welcomeMessages.length;
          await sock.sendMessage(gid, { text: welcomePlugin.formatMsg(welcomePlugin.welcomeMessages[idx], '@'+num, meta.subject, meta.participants.length), mentions: [p] });
        }
        if ((action === 'remove' || action === 'leave') && welcomePlugin && db.getNote(gid, '__bye_on__') === '1') {
          const idx = Math.floor(Math.random() * welcomePlugin.goodbyeMessages.length);
          await sock.sendMessage(gid, { text: welcomePlugin.formatMsg(welcomePlugin.goodbyeMessages[idx], num, meta.subject, meta.participants.length) });
        }
      }
    } catch(e) { logger.error('welcome/bye:', e.message); }
  });

  const cooldowns = new Map();
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const mek = messages[0];
      if (!mek?.message) return;
      const m = smsg(sock, mek, store);
      m.pushName = mek.pushName || '';
      const body = m.body || '';
      if (!body.startsWith(config.PREFIX)) {
        const senderJid = m.sender;
        if (!m.isGroup && !channelPromoSent.has(senderJid)) {
          const data = db.getData();
          if (!data.users?.[senderJid] && channelPlugin) channelPlugin.sendChannelPromo(sock, senderJid, m.pushName).catch(() => {});
          channelPromoSent.add(senderJid);
        }
        db.touchUser(m.sender);
        return;
      }

      const senderJid = m.sender;
      const isOwner   = senderJid === config.OWNER_NUMBER + '@s.whatsapp.net' || senderJid.startsWith(config.OWNER_NUMBER);
      const isVip     = db.isVip(senderJid) || isOwner;
      const isBanned  = db.isBanned(senderJid);
      const botJid    = sock.user?.id?.replace(/:[0-9]+/, '') + '@s.whatsapp.net';

      if (senderJid === botJid) return;
      if (isBanned && !isOwner) return await m.reply(`🚫 Vous êtes banni.\nContactez: wa.me/${config.OWNER_NUMBER}`);

      db.touchUser(senderJid);

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
        if (plugin.vipOnly  && !isVip)    return await m.reply(`👑 *Commande VIP!*\nContactez: wa.me/${config.OWNER_NUMBER}`);
        if (plugin.ownerOnly && !isOwner) return await m.reply(`🔱 *Réservé au propriétaire.*`);
        await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });
      } else {
        await m.reply(`❌ *${config.PREFIX}${command}* inconnue. Tapez *${config.PREFIX}menu*`);
      }
    } catch(e) { logger.error('Handler:', e.message); }
  });

  return sock;
}

web.startWebServer(parseInt(process.env.WEB_PORT) || 3000);
startInternalApi();
startBot().catch(e => { logger.error('Erreur fatale:', e); process.exit(1); });
