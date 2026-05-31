import { IsString, IsEnum } from 'class-validator';

export class EquipDto {
  @IsString()
  inventoryId: string;

  @IsEnum(['skin', 'frame'])
  slot: 'skin' | 'frame';
}
