import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customerId: string;

  @IsNumber()
  amount: number;

  @IsArray()
  items: any[]; // Can be refined with a specific ItemDto

  @IsString()
  @IsOptional()
  status?: string;
}