const path = require('path');
const dotenv = require('dotenv');
const rootDir = __dirname;

const apiEnv = dotenv.config({ path: path.join(rootDir, 'apps/api/.env') }).parsed || {};
const workerEnv = dotenv.config({ path: path.join(rootDir, 'apps/worker/.env') }).parsed || {};
const webEnv = dotenv.config({ path: path.join(rootDir, 'apps/web/.env.production') }).parsed || {};

module.exports = {
  apps: [
    {
      name: "pms-api",
      script: "apps/api/dist/main.js",
      cwd: rootDir,
      instances: 1,
      exec_mode: "fork",
      env: {
        ...apiEnv,
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0",
      },
      max_memory_restart: "500M"
    },
    {
      name: "pms-worker",
      script: "apps/worker/dist/main.js",
      cwd: rootDir,
      instances: 1,
      exec_mode: "fork",
      env: {
        ...workerEnv,
        NODE_ENV: "production",
      },
      max_memory_restart: "400M"
    },
    {
      name: "pms-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      cwd: path.join(rootDir, "apps/web"),
      instances: 1,
      exec_mode: "fork",
      env: {
        ...webEnv,
        NODE_ENV: "production",
        PORT: 3002
      },
      max_memory_restart: "600M"
    }
  ]
};

