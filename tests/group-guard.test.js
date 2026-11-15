'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeGroupMessage, sameJid, enforceGroupGuard, FLOOD_LIMIT } = require('../src/group-guard');

function fakeDb(enabled) {
  return {
    getNote(chat, key) {
      return enabled.has(key.replace(/^__|__$/g, '')) ? '1' : null;
    },
  };
}

test('antilink blocks a URL only when enabled', () => {
  const db = fakeDb(new Set(['antilink']));
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'Regarde https://example.com', db,
  }), 'Lien interdit');
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'Bonjour', db,
  }), null);
});

test('antiinvite blocks WhatsApp group invitation links', () => {
  const db = fakeDb(new Set(['antiinvite']));
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'https://chat.whatsapp.com/AbCdEf123', db,
  }), 'Lien d’invitation WhatsApp interdit');
});

test('antiinsult normalizes accents and catches configured insult patterns', () => {
  const db = fakeDb(new Set(['antiinsult']));
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'Espèce de connard !', db,
  }), 'Insulte ou vulgarité interdite');
});

test('antiforward detects forwarded messages', () => {
  const db = fakeDb(new Set(['antiforward']));
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'texte', isForwarded: true, db,
  }), 'Message transféré interdit');
});

test('anti tags only triggers for more than five mentions', () => {
  const db = fakeDb(new Set(['antitag']));
  assert.equal(analyzeGroupMessage({
    chat: '123@g.us', sender: '456@s.whatsapp.net',
    body: 'bonjour', mentionCount: 6, db,
  }), 'Mention massive interdite');
});

test('sameJid ignores Baileys device suffixes', () => {
  assert.equal(sameJid('22670000000:12@s.whatsapp.net', '22670000000@s.whatsapp.net'), true);
  assert.equal(sameJid('123@lid', '123@s.whatsapp.net'), false);
});

test('antiflood activates after the configured message threshold', () => {
  const db = fakeDb(new Set(['antiflood']));
  const tracker = new Map();
  let result = null;
  for (let i = 0; i < FLOOD_LIMIT; i++) {
    result = analyzeGroupMessage({
      chat: '123@g.us',
      sender: '456@s.whatsapp.net',
      body: 'message normal',
      db,
      now: 1000 + i * 100,
      tracker,
    });
    assert.equal(result, null);
  }
  result = analyzeGroupMessage({
    chat: '123@g.us',
    sender: '456@s.whatsapp.net',
    body: 'message en trop',
    db,
    now: 1600,
    tracker,
  });
  assert.equal(result, 'Trop de messages envoyés rapidement');
});

test('group guard deletes a matching message when the bot is admin', async () => {
  const sender = '22670000000@s.whatsapp.net';
  const bot = '22671111111:4@s.whatsapp.net';
  const db = fakeDb(new Set(['antilink']));
  let deleted = false;
  const sock = {
    user: { id: bot },
    async groupMetadata() {
      return {
        participants: [
          { id: sender },
          { id: '22671111111@s.whatsapp.net', admin: 'admin' },
        ],
      };
    },
    async sendMessage(chat, payload) {
      assert.equal(chat, '123@g.us');
      assert.deepEqual(payload.delete, { id: 'message-id', remoteJid: '123@g.us', participant: sender });
      deleted = true;
    },
  };
  const m = {
    isGroup: true,
    chat: '123@g.us',
    sender,
    body: 'https://example.com',
    mtype: 'conversation',
    key: { id: 'message-id', remoteJid: '123@g.us', participant: sender },
    msg: {},
  };

  assert.equal(await enforceGroupGuard({ sock, m, db, logger: { info() {}, warn() {} } }), true);
  assert.equal(deleted, true);
});

test('group guard does not delete admin messages', async () => {
  const sender = '22670000000@s.whatsapp.net';
  const db = fakeDb(new Set(['antilink']));
  let deleted = false;
  const sock = {
    user: { id: '22671111111@s.whatsapp.net' },
    async groupMetadata() {
      return { participants: [{ id: sender, admin: 'admin' }, { id: '22671111111@s.whatsapp.net', admin: 'admin' }] };
    },
    async sendMessage() { deleted = true; },
  };
  const m = {
    isGroup: true,
    chat: '123@g.us',
    sender,
    body: 'https://example.com',
    mtype: 'conversation',
    key: { id: 'message-id', remoteJid: '123@g.us', participant: sender },
    msg: {},
  };

  assert.equal(await enforceGroupGuard({ sock, m, db }), false);
  assert.equal(deleted, false);
});

test('group guard leaves the message and logs when the bot is not admin', async () => {
  const sender = '22670000000@s.whatsapp.net';
  const db = fakeDb(new Set(['antilink']));
  let deleted = false;
  let warned = false;
  const sock = {
    user: { id: '22671111111@s.whatsapp.net' },
    async groupMetadata() {
      return { participants: [{ id: sender }, { id: '22671111111@s.whatsapp.net' }] };
    },
    async sendMessage() { deleted = true; },
  };
  const m = {
    isGroup: true,
    chat: '123@g.us',
    sender,
    body: 'https://example.com',
    mtype: 'conversation',
    key: { id: 'message-id', remoteJid: '123@g.us', participant: sender },
    msg: {},
  };

  assert.equal(await enforceGroupGuard({
    sock, m, db, logger: { warn() { warned = true; } },
  }), false);
  assert.equal(deleted, false);
  assert.equal(warned, true);
});
