import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { Logger } from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    this.logger = pino(
      {
        level: 'debug',
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      isDev
        ? pino.transport({
            target: 'pino-pretty',
            options: { colorize: true, singleLine: false },
          })
        : undefined,
    );
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  security(message: string, meta: Record<string, unknown> = {}, context?: string): void {
    this.logger.warn({ context, security: true, ...meta }, message);
  }
}
