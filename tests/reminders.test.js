'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const db = require('../database/db');
const reminders = require('../plugins/33_reminder');

test('reminder duration parser accepts seconds, minutes and hours', () => {
  assert.equal(reminders.parseDuration('30s'), 30_000);
  assert.equal(reminders.parseDuration('10m'), 600_000);
  assert.equal(reminders.parseDuration('1h'), 3_600_000);
  assert.equal(reminders.parseDuration('1.5h'), 5_400_000);
  assert.equal(reminders.parseDuration('0s'), null);
  assert.equal(reminders.parseDuration('abc'), null);
  assert.equal(reminders.parseDuration('10d'), null);
});

test('reminder formatter handles remaining durations', () => {
  assert.equal(reminders.formatMs(12_000), '12s');
  assert.equal(reminders.formatMs(120_000), '2m');
  assert.equal(reminders.formatMs(3_720_000), '1h 2m');
  assert.equal(reminders.formatMs(-500), '0s');
});

test('reminders are stored, scoped to their owner and deletable', () => {
  const id = `test-${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
  const ownerJid = 'test-owner@s.whatsapp.net';
  const record = {
    id,
    ownerJid,
    chat: ownerJid,
    text: 'Test de persistance',
    createdAt: Date.now(),
    dueAt: Date.now() + 60_000,
    durationLabel: '1m',
    type: 'reminder',
  };

  try {
    db.addReminder(record);
    assert.equal(db.getReminders(ownerJid).some(item => item.id === id), true);
    assert.equal(db.getReminders('another-user@s.whatsapp.net').some(item => item.id === id), false);
    assert.equal(db.getAllReminders().some(item => item.id === id), true);
    assert.equal(db.removeReminder('another-user@s.whatsapp.net', id), false);
    assert.equal(db.removeReminder(ownerJid, id), true);
    assert.equal(db.getReminders(ownerJid).some(item => item.id === id), false);
  } finally {
    db.removeReminder(ownerJid, id);
  }
});

test('expired saved reminders are delivered when the WhatsApp socket reconnects', async () => {
  const entry = {
    id: `expired-${crypto.randomBytes(4).toString('hex')}`,
    ownerJid: 'owner@s.whatsapp.net',
    chat: 'owner@s.whatsapp.net',
    text: 'Rappel restauré',
    createdAt: Date.now() - 10_000,
    dueAt: Date.now() - 1_000,
    durationLabel: '5s',
    type: 'reminder',
  };
  let delivered = 0;
  let removed = 0;

  const fakeDb = {
    getAllReminders: () => [entry],
    removeReminder: (ownerJid, id) => {
      assert.equal(ownerJid, entry.ownerJid);
      assert.equal(id, entry.id);
      removed += 1;
      return true;
    },
  };
  const fakeSocket = {
    async sendMessage(chat, message) {
      assert.equal(chat, entry.chat);
      assert.match(message.text, /Rappel restauré/);
      delivered += 1;
    },
  };
  const fakeLogger = { info() {}, warn() {}, error() {} };

  reminders.initialize(fakeSocket, fakeDb, fakeLogger);
  await new Promise(resolve => setTimeout(resolve, 25));

  assert.equal(delivered, 1);
  assert.equal(removed, 1);
});
