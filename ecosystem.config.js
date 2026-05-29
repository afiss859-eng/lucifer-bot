/**
 * PM2 Ecosystem — Bot WhatsApp TOUJOURS ACTIF
 * Usage:
 *   pm2 start ecosystem.config.js   — démarrer tout
 *   pm2 startup                     — démarrage auto au boot
 *   pm2 save                        — sauvegarder la liste
 *   pm2 logs                        — voir les logs
 *   pm2 restart all                 — redémarrer tout
 */
module.exports = {
  apps: [
    {
      // ── Bot WhatsApp ────────────────────────────────────────────────────
      name:            '𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯-bot',
      script:          'src/index.js',
      cwd:             __dirname,
      instances:       1,
      autorestart:     true,
      watch:           false,
      max_memory_restart: '400M',
      restart_delay:   3000,
      max_restarts:    50,
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:      'logs/bot-error.log',
      out_file:        'logs/bot-out.log',
      merge_logs:      true,
    },
    {
      // ── Panel Web SaaS ──────────────────────────────────────────────────
      name:            '𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯-panel',
      script:          'panel/server.js',
      cwd:             __dirname,
      instances:       1,
      autorestart:     true,
      watch:           false,
      max_memory_restart: '300M',
      restart_delay:   2000,
      env: {
        NODE_ENV: 'production',
        PANEL_PORT: 4000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:      'logs/panel-error.log',
      out_file:        'logs/panel-out.log',
      merge_logs:      true,
    },
    {
      // ── Dashboard Admin (Bot) ───────────────────────────────────────────
      name:            '𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯-dashboard',
      script:          'web/server.js',
      cwd:             __dirname,
      instances:       1,
      autorestart:     true,
      watch:           false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV:  'production',
        WEB_PORT:  3000,
      },
      error_file:  'logs/dashboard-error.log',
      out_file:    'logs/dashboard-out.log',
      merge_logs:  true,
    },
  ],
};
