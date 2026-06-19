import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
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
  ],
  providers: [RebuildTreeCacheCommand],
})
export class AppModule {}
