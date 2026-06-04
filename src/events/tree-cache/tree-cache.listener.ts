import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../core/logger/logger.service';
import { RedisService, CACHE_KEYS } from '../../core/redis/redis.service';
import { BodyTreeService } from '../../modules/body/body-tree.service';
import { TreeCacheInvalidatedEvent } from './tree-cache.events';

@Injectable()
export class TreeCacheListener {
  constructor(
    private readonly redisService: RedisService,
    private readonly bodyTreeService: BodyTreeService,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent('tree-cache.invalidated', { async: true })
  async handleTreeCacheInvalidated(event: TreeCacheInvalidatedEvent): Promise<void> {
    try {
      this.logger.log(`Tree cache invalidation triggered by ${event.triggeredBy}`, 'TreeCacheListener');
      
      await this.redisService.del(CACHE_KEYS.FAMILY_TREE);
      
      // Wait 100ms (allow DB write to commit)
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      await this.bodyTreeService.buildAndCacheTree();
      
      this.logger.log('Tree cache successfully rebuilt in background', 'TreeCacheListener');
    } catch (error) {
      this.logger.error('Failed to rebuild tree cache in background', String(error), 'TreeCacheListener');
      // NEVER throw — catch all errors silently and log them (background job must not crash the request)
    }
  }
}
