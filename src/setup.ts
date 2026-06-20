import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NextFunction, Request, Response } from "express";
import * as path from "node:path";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { HttpLoggingInterceptor } from "./common/interceptors/http-logging.interceptor";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import { LoggerService } from "./core/logger/logger.service";
import { ActivityLogService } from "./modules/activity-log/activity-log.service";
import { Reflector } from "@nestjs/core";

const swaggerUiDistPath = path.dirname(
  require.resolve("swagger-ui-dist/package.json"),
);

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
  SwaggerModule.setup("api/docs", app, document, {
    customSwaggerUiPath: swaggerUiDistPath,
  });
}

export function setupApp(app: INestApplication) {
  const logger = app.get(LoggerService);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  const activityLogService = app.get(ActivityLogService, { strict: false });

  app.useGlobalInterceptors(
    new HttpLoggingInterceptor(logger, activityLogService),
    new ResponseInterceptor(reflector),
  );

  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app);
  } else {
    app.use("/api/docs", (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers["authorization"];
      if (!auth || !auth.startsWith("Basic ")) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Swagger Docs"');
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [, encoded] = auth.split(' ');
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');
      const validUser = process.env.SWAGGER_USER || 'admin';
      if (username !== validUser || password !== process.env.SWAGGER_PASSWORD) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    });
    setupSwagger(app);
  }
}
