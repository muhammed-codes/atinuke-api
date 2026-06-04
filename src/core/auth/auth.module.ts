import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [SupabaseJwtStrategy, SupabaseJwtGuard],
  exports: [SupabaseJwtGuard],
})
export class AuthModule {}
