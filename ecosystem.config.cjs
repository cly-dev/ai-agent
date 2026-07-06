/** PM2 生产部署（Docker / K8s / 裸机）。容器内请用 pm2-runtime 保持前台进程。 */
module.exports = {
  apps: [
    {
      name: 'agent-server',
      script: 'dist/src/runtime-main.js',
      cwd: __dirname,
      instances: process.env.PM2_INSTANCES
        ? Number.parseInt(process.env.PM2_INSTANCES, 10)
        : 1,
      exec_mode:
        process.env.PM2_INSTANCES &&
        Number.parseInt(process.env.PM2_INSTANCES, 10) > 1
          ? 'cluster'
          : 'fork',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'prod',
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        REDIS_URL: process.env.REDIS_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB,
        CLIENT_CORS_ORIGINS: process.env.CLIENT_CORS_ORIGINS,
        CORS_ORIGINS: process.env.CORS_ORIGINS,
        APP_CLIENT_HOST: process.env.APP_CLIENT_HOST,
        // API 只入队，不消费（多副本时避免 N×Worker 并发）
        SESSION_RUN_WORKER_ENABLED: '0',
      },
      max_memory_restart: process.env.PM2_MAX_MEMORY || '1G',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      autorestart: true,
    },
    {
      name: 'agent-server-worker',
      script: 'dist/src/worker-main.js',
      cwd: __dirname,
      instances: process.env.PM2_WORKER_INSTANCES
        ? Number.parseInt(process.env.PM2_WORKER_INSTANCES, 10)
        : 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'prod',
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        REDIS_URL: process.env.REDIS_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB,
        APP_CLIENT_HOST: process.env.APP_CLIENT_HOST,
        SESSION_RUN_WORKER_ENABLED: '1',
        SESSION_RUN_HTTP_ENABLED: '0',
        SESSION_RUN_WORKER_CONCURRENCY:
          process.env.SESSION_RUN_WORKER_CONCURRENCY || '4',
      },
      max_memory_restart: process.env.PM2_WORKER_MAX_MEMORY || '2G',
      error_file: 'logs/pm2-worker-error.log',
      out_file: 'logs/pm2-worker-out.log',
      merge_logs: true,
      kill_timeout: 30000,
      autorestart: true,
    },
  ],
};
