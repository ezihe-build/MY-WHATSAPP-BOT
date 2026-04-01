module.exports = {
  apps: [{
    name: 'ezihe-bot',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Advanced features
    instance_var: 'INSTANCE_ID',
    // Monitoring
    monitoring: false,
    // Source map support
    source_map_support: true,
    // Disable PM2 daemon logs
    disable_logs: false,
    // Log rotation
    log_rotate_interval: '1d',
    log_rotate_keep: 7
  }]
};
