import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');
  setupApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();
