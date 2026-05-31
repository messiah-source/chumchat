import { IsArray, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchUsersByTagsDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tags: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
