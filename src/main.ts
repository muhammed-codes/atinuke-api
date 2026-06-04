import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupApp } from "./setup";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    credentials: true,
  });
  setupApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
};

bootstrap();
