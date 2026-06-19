import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import type { Express, Request, Response } from "express";
import { AppModule } from "./app.module";
import { corsOptions } from "./config/cors.config";
import { setupApp } from "./setup";

let server: Express | null = null;

const createApp = () => {
  return NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  }).then((app) => {
    app.setGlobalPrefix("api");
    app.enableCors(corsOptions);
    setupApp(app);

    return app;
  });
};

const getServer = () => {
  if (server) {
    return Promise.resolve(server);
  }

  return createApp().then((app) => {
    return app.init().then(() => {
      server = app.getHttpAdapter().getInstance() as Express;
      return server;
    });
  });
};

const handler = (request: Request, response: Response) => {
  return getServer()
    .then((expressServer) => expressServer(request, response))
    .catch((error: Error) => {
      response.status(500).json({ message: error.message || "Internal server error" });
    });
};

const bootstrap = () => {
  return createApp().then((app) => {
    const port = process.env.PORT || 3000;
    return app.listen(port).then(() => {
      console.log(`Application is running on: http://localhost:${port}/api`);
    });
  });
};

if (!process.env.VERCEL) {
  bootstrap().catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
}

export default handler;
