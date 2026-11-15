'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('every command alias is registered exactly once', () => {
  const pluginDir = path.join(__dirname, '..', 'plugins');
  const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js')).sort();
  const registered = new Map();
  const duplicates = [];

  for (const file of files) {
    const plugin = require(path.join(pluginDir, file));
    if (!Array.isArray(plugin?.commands)) continue;

    for (const rawCommand of plugin.commands) {
      const command = String(rawCommand || '').trim().toLowerCase();
      if (!command) continue;
      const firstFile = registered.get(command);
      if (firstFile) {
        duplicates.push(`${command}: ${firstFile} + ${file}`);
      } else {
        registered.set(command, file);
      }
    }
  }

  assert.deepEqual(duplicates, [], `Commandes dupliquées :\\n${duplicates.join('\\n')}`);
});
