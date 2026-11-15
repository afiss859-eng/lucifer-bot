'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeGroupMessage, sameJid } = require('../src/group-guard');

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