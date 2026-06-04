import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NextFunction, Request, Response } from "express";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { LoggerService } from "./core/logger/logger.service";
import { Reflector } from "@nestjs/core";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Atinuke Family Tree API")
    .setDescription("REST API for Atinuke Family Tree management")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth")
    .addTag("Profile")
    .addTag("Admin")
    .addTag("Body")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
}

export function setupApp(app: INestApplication) {
  const logger = app.get(LoggerService);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app);
  } else {
    app.use("/api/docs", (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers["authorization"];
      if (!auth || !auth.startsWith("Basic ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [, encoded] = auth.split(" ");
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [, password] = decoded.split(":");
      if (password !== process.env.SWAGGER_PASSWORD) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    });
    setupSwagger(app);
  }
}
