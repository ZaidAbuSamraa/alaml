import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { CashFlowService } from './cashflow.service';
import { CreateOpeningCashDto, CreateSalesDto, CreatePaymentDto, UpdateDaySettingsDto, UpdateSettingsDto } from './dto/cashflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cashflow')
@UseGuards(JwtAuthGuard)
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get('settings')
  async getSettings() {
    return this.cashFlowService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.cashFlowService.updateSettings(dto);
  }

  @Get('month/:month')
  async getMonthData(@Param('month') month: string) {
    return this.cashFlowService.getMonthData(month);
  }

  @Post('opening-cash')
  async setOpeningCash(@Body() dto: CreateOpeningCashDto) {
    return this.cashFlowService.setOpeningCash(dto.date, dto.amount);
  }

  @Post('sales')
  async setSales(@Body() dto: CreateSalesDto) {
    return this.cashFlowService.setSales(dto.date, dto.amount);
  }

  @Post('payment')
  async addPayment(@Body() dto: CreatePaymentDto) {
    return this.cashFlowService.addPayment(dto);
  }

  @Put('day/:date')
  async updateDaySettings(@Param('date') date: string, @Body() dto: UpdateDaySettingsDto) {
    return this.cashFlowService.updateDaySettings(date, dto);
  }

  @Delete('payment/:id')
  async deletePayment(@Param('id') id: string) {
    await this.cashFlowService.deletePayment(parseInt(id));
    return { success: true };
  }

  @Get('payments')
  async getAllPayments() {
    return this.cashFlowService.getAllPayments();
  }

  @Delete('reset/:month')
  async resetMonth(@Param('month') month: string) {
    return this.cashFlowService.resetMonth(month);
  }

  @Get('export/:month')
  async exportToExcel(@Param('month') month: string, @Res() res: Response) {
    const buffer = await this.cashFlowService.exportToExcel(month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cashflow-${month}.xlsx`);
    res.send(buffer);
  }
}
