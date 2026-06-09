import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthCredentialsDto {
  @ApiProperty({ example: "[EMAIL_ADDRESS]" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "P@ssw0rd" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class SignUpDto extends AuthCredentialsDto {
  @ApiProperty({ example: "Muhammed Doe" })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({ example: "https://example.com/photo.jpg" })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ example: "Software Engineer from Lagun" })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "NewP@ssw0rd" })
  @IsString()
  @MinLength(6)
  password!: string;
}
