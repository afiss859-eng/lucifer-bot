const fs = require('fs-extra');
const path = require('path');

async function loadPlugins() {
  const plugins = new Map();
  const pluginDir = path.join(__dirname, '..', 'plugins');
  if (!fs.existsSync(pluginDir)) return plugins;

  const files = fs.readdirSync(pluginDir)
    .filter((f) => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    try {
      const plugin = require(path.join(pluginDir, file));
      if (!plugin || !Array.isArray(plugin.commands)) {
        console.warn(`⚠️ Plugin ignoré ${file}: commands[] absent`);
        continue;
      }

      for (const rawCommand of plugin.commands) {
        const cmd = String(rawCommand || '').trim().toLowerCase();
        if (!cmd) continue;
        if (plugins.has(cmd)) {
          console.warn(`⚠️ Commande dupliquée: ${cmd} (${file}) — dernière définition ignorée`);
          continue;
        }
        if (typeof plugin.execute !== 'function') {
          console.warn(`⚠️ Plugin ${file}: execute() absent pour ${cmd}`);
          continue;
        }
        plugins.set(cmd, plugin);
      }
    } catch (err) {
      console.error(`❌ Erreur plugin ${file}:`, err?.stack || err?.message || err);
    }
  }

  return plugins;
}

module.exports = { loadPlugins };
