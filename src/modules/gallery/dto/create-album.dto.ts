import { IsString, IsOptional } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageId?: string;
}
