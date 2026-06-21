import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { LoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { AuthModule } from './core/auth/auth.module';
import { BodyModule } from './modules/body/body.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './events/events.module';
import { RebuildTreeCacheCommand } from './commands/rebuild-tree-cache.command';
import { AuthApiModule } from './modules/auth/auth.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    LoggerModule,
    PrismaModule,
    RedisModule,
    CloudinaryModule,
    AuthModule,
    EventsModule,
    BodyModule,
    ProfileModule,
    AdminModule,
    AuthApiModule,
    GalleryModule,
    ActivityLogModule,
  ],
  providers: [
    RebuildTreeCacheCommand,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
