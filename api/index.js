const { setDefaultResultOrder } = require('node:dns');
setDefaultResultOrder('ipv4first');

const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('../dist/src/app.module');
const { setupApp } = require('../dist/src/setup');

const server = express();
let appPromise = null;

const bootstrap = async () => {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        bufferLogs: true,
      });
      app.setGlobalPrefix('api');
      app.enableCors({
        origin: true,
        credentials: true,
      });
      setupApp(app);
      await app.init();
      return app;
    })();
  }
  return appPromise;
};

module.exports = async (req, res) => {
  await bootstrap();
  server(req, res);
};
