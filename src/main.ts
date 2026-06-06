import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import type { Express, Request, Response } from "express";
import { AppModule } from "./app.module";
import { setupApp } from "./setup";

let server: Express | null = null;

const createApp = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    credentials: true,
  });
  setupApp(app);

  return app;
};

const getServer = async () => {
  if (server) {
    return server;
  }

  const app = await createApp();
  await app.init();
  server = app.getHttpAdapter().getInstance() as Express;
  return server;
};

const handler = (request: Request, response: Response) => {
  return getServer()
    .then((expressServer) => expressServer(request, response))
    .catch((error: Error) => {
      response.status(500).json({ message: error.message || "Internal server error" });
    });
};

const bootstrap = async () => {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
};

if (!process.env.VERCEL) {
  bootstrap();
}

export default handler;
