import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: any; // Can be refined with a stricter DTO
}