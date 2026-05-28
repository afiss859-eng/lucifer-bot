const fs = require('fs-extra');
const path = require('path');

async function loadPlugins() {
  const plugins = new Map();
  const pluginDir = path.join(__dirname, '..', 'plugins');
  if (!fs.existsSync(pluginDir)) return plugins;
  const files = fs.readdirSync(pluginDir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    try {
      const plugin = require(path.join(pluginDir, file));
      if (plugin.commands && Array.isArray(plugin.commands)) {
        for (const cmd of plugin.commands) {
          plugins.set(cmd, plugin);
        }
      }
    } catch (err) {
      console.error(`Erreur plugin ${file}:`, err.message);
    }
  }
  return plugins;
}

module.exports = { loadPlugins };
