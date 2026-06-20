import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';
import { SupabaseJwtGuard } from './supabase-jwt.guard';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), LoggerModule],
  providers: [SupabaseJwtStrategy, SupabaseJwtGuard],
  exports: [SupabaseJwtGuard],
})
export class AuthModule {}
