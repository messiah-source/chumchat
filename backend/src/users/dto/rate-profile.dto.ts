import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class RateProfileDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}
