import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AuthCredentialsDto {
  @ApiProperty({ example: "bellomuhammedoladimeji@gmail.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Atinuke@top1" })
  @IsString()
  @MinLength(6)
  password!: string;
}
