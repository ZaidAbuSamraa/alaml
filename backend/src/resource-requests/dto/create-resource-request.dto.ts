import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateResourceRequestDto {
  @IsNotEmpty()
  @IsString()
  requestName: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  requestDate: string;

  @IsNotEmpty()
  @IsNumber()
  employeeId: number;
}
