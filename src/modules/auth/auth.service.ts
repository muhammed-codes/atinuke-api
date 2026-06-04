import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthCredentialsDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
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
