import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthCredentialsDto {
  @ApiProperty({ example: "bellomuhammedoladimeji@gmail.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Atinuke@top1" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class SignUpDto extends AuthCredentialsDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({ example: "https://example.com/photo.jpg" })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ example: "Software Engineer from Lagos" })
  @IsOptional()
  @IsString()
  bio?: string;
}
