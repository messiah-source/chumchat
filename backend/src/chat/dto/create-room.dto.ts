import { IsString, IsEnum, IsOptional, IsArray, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
