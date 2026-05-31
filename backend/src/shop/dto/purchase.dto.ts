import { IsString } from 'class-validator';

export class PurchaseDto {
  @IsString()
  itemId: string;
}
