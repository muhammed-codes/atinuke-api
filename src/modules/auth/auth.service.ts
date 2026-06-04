import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthCredentialsDto } from './dto/auth.dto';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(authCredentialsDto: AuthCredentialsDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: authCredentialsDto.email,
      password: authCredentialsDto.password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (data.user) {
      // Create the profile in Prisma so the JWT strategy can find it
      await this.prisma.profile.create({
        data: {
          id: data.user.id,
          displayName: authCredentialsDto.email.split('@')[0], // Default display name based on email
        },
      });
    }

    return data;
  }

  async logIn(authCredentialsDto: AuthCredentialsDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: authCredentialsDto.email,
      password: authCredentialsDto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }
    return data;
  }
}
