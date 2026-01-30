import { IsNotEmpty, IsString, MinLength, IsNumber, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsNumber()
  hourlyWage?: number;

  @IsOptional()
  @IsString()
  specialty?: string;
}
