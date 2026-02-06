import { IsNotEmpty, IsString, IsDateString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestItemDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class CreateResourceRequestDto {
  @IsNotEmpty()
  @IsString()
  requestName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @IsNotEmpty()
  @IsDateString()
  requestDate: string;

  @IsNotEmpty()
  @IsNumber()
  employeeId: number;
}
