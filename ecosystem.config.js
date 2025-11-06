module.exports = {
  apps: [
    {
      name: 'n8n-workflows-api',
      script: 'api/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
    },
  ],
};