import serverless from "serverless-http";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupApp } from "./setup";
import type { Request, Response } from "express";

let handler: any;

async function bootstrapHandler() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true, credentials: true });
  setupApp(app);
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

export default async function (req: Request, res: Response) {
  if (!handler) {
    handler = await bootstrapHandler();
  }
  return handler(req, res);
}
