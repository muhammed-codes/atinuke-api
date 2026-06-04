import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user via Supabase' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and get JWT token via Supabase' })
  @ApiResponse({ status: 200, description: 'User successfully logged in, returns access token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logIn(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.logIn(authCredentialsDto);
  }
}
