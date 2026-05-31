import { IsString, MinLength, MaxLength, Matches, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { TagType } from '@prisma/client';

export class CreateTagDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[а-яёa-z0-9_\- ]+$/i, { message: 'Только буквы, цифры, пробел, _ и -' })
  name: string;

  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCount?: number;
}
