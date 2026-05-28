const rpActions = {
  hug: { emoji: '🤗', msg: (a, b) => `*${a}* serre *${b}* dans ses bras chaleureusement!` },
  kiss: { emoji: '💋', msg: (a, b) => `*${a}* embrasse tendrement *${b}*!` },
  slap: { emoji: '👋', msg: (a, b) => `*${a}* donne une belle gifle à *${b}*! 😤` },
  pat: { emoji: '👆', msg: (a, b) => `*${a}* tapote gentiment la tête de *${b}*!` },
  bite: { emoji: '😬', msg: (a, b) => `*${a}* mord *${b}*! Aïe! 😂` },
  poke: { emoji: '👉', msg: (a, b) => `*${a}* donne un coup de coude à *${b}*!` },
  cuddle: { emoji: '🥰', msg: (a, b) => `*${a}* se blottit contre *${b}*!` },
  highfive: { emoji: '🙌', msg: (a, b) => `*${a}* tape dans la main de *${b}*! High five!` },
  punch: { emoji: '👊', msg: (a, b) => `*${a}* envoie un direct à *${b}*! Pow!` },
  kill: { emoji: '💀', msg: (a, b) => `*${a}* élimine *${b}* dans un combat épique! ⚔️` },
  marry: { emoji: '💍', msg: (a, b) => `*${a}* demande *${b}* en mariage! 💒` },
  divorce: { emoji: '📄', msg: (a, b) => `*${a}* divorce d'avec *${b}*! 💔` },
  feed: { emoji: '🍽️', msg: (a, b) => `*${a}* nourrit *${b}* avec amour!` },
  wave: { emoji: '👋', msg: (a, b) => `*${a}* fait un grand signe de la main à *${b}*!` },
  stare: { emoji: '👀', msg: (a, b) => `*${a}* fixe *${b}* intensément...` },
  lick: { emoji: '👅', msg: (a, b) => `*${a}* lèche *${b}*! Bizarre mais ok! 😅` },
  tackle: { emoji: '🤼', msg: (a, b) => `*${a}* se jette sur *${b}*!` },
  tickle: { emoji: '😂', msg: (a, b) => `*${a}* chatouille *${b}*! Hihihi!` },
  dance: { emoji: '💃', msg: (a, b) => `*${a}* invite *${b}* à danser!` },
  smile: { emoji: '😊', msg: (a, b) => `*${a}* sourit à *${b}*!` },
};

module.exports = {
  commands: Object.keys(rpActions),
  description: 'Commandes RP / Anime',
  execute: async ({ sock, m, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const action = rpActions[cmd];
    if (!action) return;

    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const sender = m.sender.split('@')[0];
    const target = mentions[0] ? mentions[0].split('@')[0] : 'tout le monde';

    await sock.sendMessage(m.chat, {
      text: `${action.emoji} ${action.msg(sender, target)}`,
      mentions: mentions,
    }, { quoted: m });
  },
};
