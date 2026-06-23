import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AuthCredentialsDto,
  SignUpDto,
  ForgotPasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";
import { PrismaService } from "../../core/prisma/prisma.service";
import { LoggerService } from "../../core/logger/logger.service";

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL")!;
    const supabaseKey = this.configService.get<string>("SUPABASE_ANON_KEY")!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(signUpDto: SignUpDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (error) {
      this.logger.security(
        "SIGNUP_FAILED",
        { email: signUpDto.email, reason: error.message },
        "AuthService",
      );
      throw new BadRequestException(error.message);
    }

    if (data.user) {
      const userCount = await this.prisma.profile.count();
      const isFirstUser = userCount === 0;

      await this.prisma.profile.create({
        data: {
          id: data.user.id,
          displayName: signUpDto.displayName,
          profilePhoto: signUpDto.profilePhoto,
          bio: signUpDto.bio,
          role: isFirstUser ? "ADMIN" : "MEMBER",
          status: isFirstUser ? "APPROVED" : "PENDING",
        },
      });

      this.logger.log(
        `SIGNUP_SUCCESS: ${signUpDto.email} (role: ${isFirstUser ? "ADMIN" : "MEMBER"})`,
        "AuthService",
      );
    }

    return data;
  }

  async logIn(authCredentialsDto: AuthCredentialsDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: authCredentialsDto.email,
      password: authCredentialsDto.password,
    });

    if (error) {
      this.logger.security(
        "LOGIN_FAILED",
        { email: authCredentialsDto.email, reason: error.message },
        "AuthService",
      );
      throw new UnauthorizedException(error.message);
    }

    this.logger.log(
      `LOGIN_SUCCESS: ${authCredentialsDto.email}`,
      "AuthService",
    );
    return data;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const { error } = await this.supabase.auth.resetPasswordForEmail(
      forgotPasswordDto.email,
      { redirectTo: `${frontendUrl}/reset-password` },
    );

    if (error) {
      this.logger.security(
        "PASSWORD_RESET_FAILED",
        { email: forgotPasswordDto.email, reason: error.message },
        "AuthService",
      );
      throw new BadRequestException(error.message);
    }

    this.logger.log(
      `PASSWORD_RESET_REQUESTED: ${forgotPasswordDto.email}`,
      "AuthService",
    );
    return { message: "Password reset email sent successfully" };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL")!;
    const serviceRoleKey = this.configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!serviceRoleKey) {
      throw new BadRequestException(
        "Server misconfiguration: service role key not set",
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: changePasswordDto.password,
    });

    if (error) {
      this.logger.security(
        "PASSWORD_CHANGE_FAILED",
        { userId, reason: error.message },
        "AuthService",
      );
      throw new BadRequestException(error.message);
    }

    this.logger.log(`PASSWORD_CHANGE_SUCCESS: userId=${userId}`, "AuthService");
    return { message: "Password changed successfully" };
  }

}
