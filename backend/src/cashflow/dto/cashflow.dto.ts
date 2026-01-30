import { IsNumber, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateOpeningCashDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;
}

export class CreateSalesDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;
}

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  recipientName: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDaySettingsDto {
  @IsOptional()
  @IsBoolean()
  deductSameDay?: boolean;

  @IsOptional()
  @IsNumber()
  sales?: number;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  defaultDailySales?: number;

  @IsOptional()
  @IsNumber()
  safetyThreshold?: number;
}

export class GetMonthDataDto {
  @IsString()
  month: string; // Format: YYYY-MM
}
