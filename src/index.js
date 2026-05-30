require('dotenv').config();

// ── Imports Baileys avec fallbacks sécurisés ──────────────────────────────────
// Certaines versions n'exportent pas tout — on importe prudemment
const baileys = require('@whiskeysockets/baileys');
const makeWASocket                 = baileys.default;
const useMultiFileAuthState        = baileys.useMultiFileAuthState;
const DisconnectReason             = baileys.DisconnectReason;
const fetchLatestBaileysVersion    = baileys.fetchLatestBaileysVersion;
const makeInMemoryStore            = baileys.makeInMemoryStore;
const proto                        = baileys.proto;
// Fallbacks si la version ne les exporte pas
const makeCacheableSignalKeyStore  = baileys.makeCacheableSignalKeyStore || null;
const Browsers                     = baileys.Browsers || null;

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
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', ignore: 'pid,hostname' },
  },
});

const SESSION_DIR = path.join(__dirname, '..', config.SESSION_NAME || 'lucifer-session');
const PHONE_FILE  = path.join(SESSION_DIR, 'pending_phone.txt');

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
let pendingCodeInfo   = null; // { code, formatted, time }

// ── Helpers session ───────────────────────────────────────────────────────────
function getPendingPhone()  { try { return fs.readFileSync(PHONE_FILE, 'utf-8').trim() || null; } catch { return null; } }
function setPendingPhone(p) { fs.ensureDirSync(SESSION_DIR); fs.writeFileSync(PHONE_FILE, p.replace(/[^0-9]/g, '')); }
function clearPendingPhone(){ try { fs.removeSync(PHONE_FILE); } catch {} }

// ── triggerPairCode : appelé par le dashboard ─────────────────────────────────
async function triggerPairCode(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean || clean.length < 7) throw new Error('Numéro invalide. Entrez indicatif+numéro (ex: 33612345678)');
  if (botConnected) throw new Error('Bot déjà connecté.');

  setPendingPhone(clean);

  if (!globalSock) throw new Error('Bot en démarrage. Le code sera généré automatiquement. Rafraîchissez dans 20s.');

  // Vérifier si déjà enregistré
  const registered = globalSock.authState?.creds?.registered;
  if (registered) throw new Error('Session existante détectée. Videz la session et redémarrez.');

  // 1.5s de délai puis appel direct — pattern standard bots XMD
  await new Promise(r => setTimeout(r, 1500));
  logger.info(`🔑 Génération pair code → ${clean}`);

  const code = await globalSock.requestPairingCode(clean);
  const formatted = code.match(/.{1,4}/g)?.join('-') || code;
  pendingCodeInfo = { code, formatted, time: Date.now() };
  clearPendingPhone();

  logger.info(`✅ Code: ${formatted}`);
  return code;
}

function getLastCode() { return pendingCodeInfo; }

// ── API interne (port 3500) ───────────────────────────────────────────────────
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

// ── Démarrage du bot ──────────────────────────────────────────────────────────
async function startBot() {
  fs.ensureDirSync(SESSION_DIR);
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(BOT_BANNER);
  logger.info(`📱 WhatsApp v${version.join('.')}${isLatest ? ' ✓' : ''}`);

  const silentLog = pino({ level: 'silent' });

  // ── Auth: avec makeCacheableSignalKeyStore si disponible ────────────────────
  const authKeys = makeCacheableSignalKeyStore
    ? makeCacheableSignalKeyStore(state.keys, silentLog)
    : state.keys;

  // ── Browser: Browsers.ubuntu si disponible, sinon chaîne standard ──────────
  const browserConfig = Browsers
    ? Browsers.ubuntu('Chrome')
    : ['Ubuntu', 'Chrome', '20.0.0'];

  const sock = makeWASocket({
    version,
    logger: silentLog,
    printQRInTerminal: false,
    browser: browserConfig,
    auth: {
      creds: state.creds,
      keys: authKeys,
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
    logger.info(`📲 Bot non connecté — en attente du pair code via dashboard.`);
    logger.info(`   Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);

    const pending = getPendingPhone();
    if (pending) {
      logger.info(`🔄 Numéro en attente détecté (${pending}) — génération dans 3s...`);
      setTimeout(async () => {
        try {
          if (!botConnected && globalSock) {
            const code = await globalSock.requestPairingCode(pending);
            const formatted = code.match(/.{1,4}/g)?.join('-') || code;
            pendingCodeInfo = { code, formatted, time: Date.now() };
            clearPendingPhone();
            web.setPendingCode(code);
            logger.info(`✅ Pair code auto: ${formatted}`);
          }
        } catch (e) {
          logger.error(`❌ Pair code auto échoué: ${e.message}`);
        }
      }, 3000);
    }
  } else {
    logger.info(`♻️  Session existante — reconnexion...`);
  }

  // ── Événements connexion ────────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      botConnected = false;
      web.setConnected(false);
      globalSock = null;

      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn(`🔌 Connexion fermée — code: ${statusCode}`);

      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('⛔ Déconnecté (loggedOut). Videz la session et redémarrez.');
        web.setSocket(null);
      } else if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        logger.info(`🔄 Reconnexion ${reconnectAttempts}/${MAX_RECONNECT} dans ${delay / 1000}s...`);
        setTimeout(startBot, delay);
      } else {
        logger.error('⛔ Trop de tentatives. Redémarrage manuel requis.');
      }

    } else if (connection === 'open') {
      botConnected = true;
      reconnectAttempts = 0;
      pendingCodeInfo = null;
      web.setConnected(true);
      clearPendingPhone();
      const num  = sock.user?.id?.split(':')[0] || '?';
      const name = sock.user?.name || config.BOT_NAME;
      logger.info(`✅ ${name} (${num}) connecté avec succès!`);
      logger.info(`🌐 Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Auto-vue statuts ────────────────────────────────────────────────────────
  if (process.env.AUTO_VIEW_STATUS === 'true') {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages)
        if (m.key?.remoteJid === 'status@broadcast' && !m.key.fromMe)
          try { await sock.readMessages([m.key]); } catch {}
    });
  }

  // ── Chargement des plugins ──────────────────────────────────────────────────
  const plugins = await loadPlugins();
  logger.info(`📦 ${plugins.size} commandes chargées`);

  let welcomePlugin, channelPlugin;
  try { welcomePlugin = require('../plugins/21_welcome_bye'); } catch {}
  try { channelPlugin  = require('../plugins/31_channel'); }   catch {}

  // ── Bienvenue / Au revoir groupes ───────────────────────────────────────────
  sock.ev.on('group-participants.update', async ({ id: gid, participants, action }) => {
    try {
      if (!['add', 'remove', 'leave'].includes(action)) return;
      const meta = await sock.groupMetadata(gid);
      for (const p of participants) {
        const num = p.split('@')[0];
        if (action === 'add' && welcomePlugin && db.getNote(gid, '__welcome_on__') === '1') {
          const idx = parseInt(db.getNote(gid, '__welcome_style__') || '0') % welcomePlugin.welcomeMessages.length;
          await sock.sendMessage(gid, {
            text: welcomePlugin.formatMsg(welcomePlugin.welcomeMessages[idx], '@' + num, meta.subject, meta.participants.length),
            mentions: [p],
          });
        }
        if ((action === 'remove' || action === 'leave') && welcomePlugin && db.getNote(gid, '__bye_on__') === '1') {
          const idx = Math.floor(Math.random() * welcomePlugin.goodbyeMessages.length);
          await sock.sendMessage(gid, { text: welcomePlugin.formatMsg(welcomePlugin.goodbyeMessages[idx], num, meta.subject, meta.participants.length) });
        }
      }
    } catch (e) { logger.error('welcome/bye:', e.message); }
  });

  // ── Handler messages ─────────────────────────────────────────────────────────
  const cooldowns = new Map();

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const mek = messages[0];
      if (!mek?.message) return;

      const m = smsg(sock, mek, store);
      m.pushName = mek.pushName || '';
      const body     = m.body || '';
      const sender   = m.sender;
      const isOwner  = sender === config.OWNER_NUMBER + '@s.whatsapp.net' || sender.startsWith(config.OWNER_NUMBER);
      const isVip    = db.isVip(sender) || isOwner;
      const isBanned = db.isBanned(sender);
      const botJid   = sock.user?.id?.replace(/:[0-9]+/, '') + '@s.whatsapp.net';

      if (sender === botJid) return;
      db.touchUser(sender);

      if (!m.isGroup && channelPlugin && !channelPromoSent.has(sender)) {
        const data = db.getData();
        if (!data.users?.[sender]) channelPlugin.sendChannelPromo(sock, sender, m.pushName).catch(() => {});
        channelPromoSent.add(sender);
      }

      if (!body.startsWith(config.PREFIX)) return;
      if (isBanned && !isOwner) return await m.reply(`🚫 Vous êtes banni.\nContactez: wa.me/${config.OWNER_NUMBER}`);

      const command = body.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
      const args    = body.trim().split(/\s+/).slice(1);
      const q       = args.join(' ');

      const coolKey = `${sender}:${command}`;
      const now     = Date.now();
      if (cooldowns.has(coolKey) && now - cooldowns.get(coolKey) < config.ANTI_SPAM_DELAY) return;
      cooldowns.set(coolKey, now);

      logger.info(`💬 ${config.PREFIX}${command} — ${sender}`);

      const plugin = plugins.get(command);
      if (!plugin) return await m.reply(`❌ Commande *${config.PREFIX}${command}* inconnue.\nTapez *${config.PREFIX}menu*`);
      if (plugin.vipOnly   && !isVip)   return await m.reply(`👑 Commande VIP! Contact: wa.me/${config.OWNER_NUMBER}`);
      if (plugin.ownerOnly && !isOwner) return await m.reply(`🔱 Réservé au propriétaire.`);

      await plugin.execute({ sock, m, args, q, isOwner, isVip, config, logger, db });

    } catch (e) { logger.error('Handler:', e.message); }
  });

  return sock;
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
web.startWebServer(parseInt(process.env.WEB_PORT) || 3000);
startInternalApi();
startBot().catch(e => { logger.error('Erreur fatale:', e.message); process.exit(1); });
