import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @IsIn(['dark', 'light'])
  theme?: string;
}
