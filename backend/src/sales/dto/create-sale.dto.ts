import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  saleNumber: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}
