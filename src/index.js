require('dotenv').config();
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    proto,
  } = require('@whiskeysockets/baileys');

  const pino   = require('pino');
  const { Boom } = require('@hapi/boom');
  const QRCode = require('qrcode');
  const path   = require('path');
  const config = require('../config/config');
  const { loadPlugins } = require('./plugins');
  const { smsg }        = require('./utils');
  const db              = require('../database/db');
  const web             = require('../web/server');

  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
  const logger = pino({
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:dd-mm-yyyy HH:MM:ss', ignore: 'pid,hostname' } },
  });

  const BOT_BANNER = `
  ╔══════════════════════════════════════╗
  ║   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂               ║
  ║   v${config.VERSION} | 684+ Cmds | IA | Web   ║
  ╚══════════════════════════════════════╝`;

  const channelPromoSent = new Set();

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

    store.bind(sock.ev);
    web.setSocket(sock);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        logger.info('📲 QR dispo — Dashboard: http://localhost:' + (process.env.WEB_PORT || 3000));
        try { web.setQr(await QRCode.toDataURL(qr)); } catch { web.setQr(null); }
      }
      if (connection === 'close') {
        web.setConnected(false);
        const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) { logger.info('🔄 Reconnexion...'); startBot(); }
        else logger.error('⛔ Déconnecté. Supprimez le dossier session et redémarrez.');
      } else if (connection === 'open') {
        web.setConnected(true);
        logger.info(`✅ ${config.BOT_NAME} connecté ! Dashboard: http://localhost:${process.env.WEB_PORT || 3000}`);
      }
    });

    sock.ev.on('creds.update', saveCreds);

    const plugins = await loadPlugins();
    logger.info(`📦 ${plugins.size} commandes chargées`);

    let welcomePlugin, channelPlugin;
    try { welcomePlugin = require('../plugins/21_welcome_bye'); } catch {}
    try { channelPlugin  = require('../plugins/31_channel'); } catch {}

    // Welcome / Bye auto
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

        // Auto-promo canal au premier contact
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

  web.startWebServer(parseInt(process.env.WEB_PORT) || 3000);
  startBot().catch(err => { logger.error('Erreur fatale:', err); process.exit(1); });
  