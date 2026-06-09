import { Controller, Post, Body, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, SignUpDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';

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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiBearerAuth()
  @UseGuards(SupabaseJwtGuard)
  @Post('change-password')
  @ApiOperation({ summary: 'Change password using JWT token' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.changePassword(token, changePasswordDto);
  }
}
