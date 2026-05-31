import { IsString, IsDateString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContestDto {
  @IsString()
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxWinners?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prizeXp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prizeCoins?: number;

  @IsOptional()
  @IsString()
  prizeTagName?: string;
}
