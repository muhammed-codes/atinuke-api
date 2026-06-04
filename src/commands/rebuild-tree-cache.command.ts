import { Injectable } from '@nestjs/common';
import { LoggerService } from '../core/logger/logger.service';
import { BodyTreeService } from '../modules/body/body-tree.service';

@Injectable()
export class RebuildTreeCacheCommand {
  constructor(
    private readonly bodyTreeService: BodyTreeService,
    private readonly logger: LoggerService,
  ) {}

  async execute(): Promise<void> {
    this.logger.log('Starting manual tree cache rebuild...', 'RebuildTreeCacheCommand');
    
    try {
      await this.bodyTreeService.buildAndCacheTree();
      this.logger.log('Tree cache successfully rebuilt manually.', 'RebuildTreeCacheCommand');
    } catch (error) {
      this.logger.error('Failed to rebuild tree cache manually', String(error), 'RebuildTreeCacheCommand');
      throw error;
    }
  }
}
