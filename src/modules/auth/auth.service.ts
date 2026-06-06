import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthCredentialsDto, SignUpDto } from './dto/auth.dto';
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

  async signUp(signUpDto: SignUpDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (data.user) {
      // Check if this is the first user in the database
      const userCount = await this.prisma.profile.count();
      const isFirstUser = userCount === 0;

      // Create the profile in Prisma so the JWT strategy can find it
      await this.prisma.profile.create({
        data: {
          id: data.user.id,
          displayName: signUpDto.displayName,
          profilePhoto: signUpDto.profilePhoto,
          bio: signUpDto.bio,
          role: isFirstUser ? 'ADMIN' : 'MEMBER',
          status: isFirstUser ? 'APPROVED' : 'PENDING',
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
