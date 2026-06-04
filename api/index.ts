import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup';

const server = express();
let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bufferLogs: true,
    });
    app.setGlobalPrefix('api');
    setupApp(app);
    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await bootstrap();
  server(req as any, res as any);
}
