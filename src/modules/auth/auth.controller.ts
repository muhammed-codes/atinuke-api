import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, SignUpDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('test-env')
  testEnv() {
    return {
      url: this.configService.get('SUPABASE_URL'),
      key: this.configService.get('SUPABASE_ANON_KEY')?.substring(0, 5) + '...',
      node_version: process.version
    };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user via Supabase' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and get JWT token via Supabase' })
  @ApiResponse({ status: 200, description: 'User successfully logged in, returns access token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logIn(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.logIn(authCredentialsDto);
  }
}
