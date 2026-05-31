import { IsString, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
