import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';
import { LoggerService } from '../logger/logger.service';

export const CACHE_KEYS = {
  FAMILY_TREE: 'family_tree',
  USER_PROFILE: (userId: string) => `profile:${userId}`,
} as const;

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.client = new Redis({
      url: this.configService.get<string>('UPSTASH_REDIS_URL')!,
      token: this.configService.get<string>('UPSTASH_REDIS_TOKEN')!,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (error) {
      this.logger.error(`Redis GET failed for key: ${key}`, String(error), 'RedisService');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { ex: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis SET failed for key: ${key}`, String(error), 'RedisService');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL failed for key: ${key}`, String(error), 'RedisService');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS failed for key: ${key}`, String(error), 'RedisService');
      return false;
    }
  }
}
