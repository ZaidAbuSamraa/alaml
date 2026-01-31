import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { CashFlowDay } from '../entities/cashflow-day.entity';
import { CashFlowPayment } from '../entities/cashflow-payment.entity';
import { CashFlowSettings } from '../entities/cashflow-settings.entity';
import { Supplier } from '../entities/supplier.entity';
import { SupplierCashflowNote } from '../entities/supplier-cashflow-note.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class CashFlowService {
  constructor(
    @InjectRepository(CashFlowDay)
    private dayRepository: Repository<CashFlowDay>,
    @InjectRepository(CashFlowPayment)
    private paymentRepository: Repository<CashFlowPayment>,
    @InjectRepository(CashFlowSettings)
    private settingsRepository: Repository<CashFlowSettings>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(SupplierCashflowNote)
    private supplierCashflowNoteRepository: Repository<SupplierCashflowNote>,
  ) {}

  async getSettings(): Promise<CashFlowSettings> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({
        defaultDailySales: 6000,
        safetyThreshold: 2000,
      });
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(data: Partial<CashFlowSettings>): Promise<CashFlowSettings> {
    let settings = await this.getSettings();
    Object.assign(settings, data);
    return this.settingsRepository.save(settings);
  }

  async getOrCreateDay(date: string): Promise<CashFlowDay> {
    let day = await this.dayRepository.findOne({ 
      where: { date },
      relations: ['payments'],
    });
    
    if (!day) {
      const settings = await this.getSettings();
      day = this.dayRepository.create({
        date,
        useDefaultSales: true,
        sales: settings.defaultDailySales,
        deductSameDay: true,
      });
      await this.dayRepository.save(day);
      day.payments = [];
    }
    
    return day;
  }

  async setOpeningCash(date: string, amount: number): Promise<CashFlowDay> {
    const day = await this.getOrCreateDay(date);
    day.openingCash = amount;
    day.isOpeningCashManual = true;
    return this.dayRepository.save(day);
  }

  async setSales(date: string, amount: number): Promise<CashFlowDay> {
    const day = await this.getOrCreateDay(date);
    day.manualSales = amount;
    day.useDefaultSales = false;
    day.sales = amount;
    return this.dayRepository.save(day);
  }

  async addPayment(data: { amount: number; recipientName: string; date: string; description?: string }): Promise<CashFlowPayment> {
    const day = await this.getOrCreateDay(data.date);
    
    const payment = this.paymentRepository.create({
      amount: data.amount,
      recipientName: data.recipientName,
      date: data.date,
      description: data.description,
      cashFlowDayId: day.id,
    });
    
    const savedPayment = await this.paymentRepository.save(payment);
    
    // Check if recipient name matches any supplier
    const suppliers = await this.supplierRepository.find();
    const matchingSupplier = suppliers.find(supplier => 
      supplier.name.toLowerCase().trim() === data.recipientName.toLowerCase().trim()
    );
    
    if (matchingSupplier) {
      // Create a cashflow note for this supplier
      const note = this.supplierCashflowNoteRepository.create({
        amount: data.amount,
        recipientName: data.recipientName,
        date: data.date,
        description: data.description,
        cashflowPaymentId: savedPayment.id,
        supplierId: matchingSupplier.id,
      });
      await this.supplierCashflowNoteRepository.save(note);
    }
    
    return savedPayment;
  }

  async updateDaySettings(date: string, data: { deductSameDay?: boolean; sales?: number }): Promise<CashFlowDay> {
    const day = await this.getOrCreateDay(date);
    
    if (data.deductSameDay !== undefined) {
      day.deductSameDay = data.deductSameDay;
    }
    if (data.sales !== undefined) {
      day.sales = data.sales;
      day.manualSales = data.sales;
      day.useDefaultSales = false;
    }
    
    return this.dayRepository.save(day);
  }

  async getMonthData(month: string): Promise<any[]> {
    const settings = await this.getSettings();
    const [year, monthNum] = month.split('-').map(Number);
    
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = `${month}-01`;
    const endDate = `${month}-${daysInMonth.toString().padStart(2, '0')}`;
    
    const existingDays = await this.dayRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['payments'],
      order: { date: 'ASC' },
    });
    
    const dayMap = new Map<string, CashFlowDay>();
    existingDays.forEach(day => dayMap.set(day.date, day));
    
    const result: any[] = [];
    let previousEndingCash: number | null = null;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${d.toString().padStart(2, '0')}`;
      const currentDate = new Date(dateStr);
      currentDate.setHours(0, 0, 0, 0);
      
      let day = dayMap.get(dateStr);
      
      const dayOfWeek = currentDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      const sales = day?.useDefaultSales === false ? Number(day.sales) : Number(settings.defaultDailySales);
      const payments = day?.payments || [];
      const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      let openingCash: number;
      if (day?.isOpeningCashManual) {
        openingCash = Number(day.openingCash);
      } else if (previousEndingCash !== null) {
        openingCash = previousEndingCash;
      } else {
        openingCash = day?.openingCash ? Number(day.openingCash) : 0;
      }
      
      const deductSameDay = day?.deductSameDay !== undefined ? day.deductSameDay : true;
      
      result.push({
        date: dateStr,
        day: dayNames[dayOfWeek],
        sales,
        openingCash,
        endingCash: 0,
        tomorrowPayments: 0,
        payments,
        totalPayments,
        status: 'Safe',
        deductSameDay,
        isOpeningCashManual: day?.isOpeningCashManual || false,
        useDefaultSales: day?.useDefaultSales !== false,
      });
    }
    
    for (let i = 0; i < result.length; i++) {
      const currentDay = result[i];
      const deductSameDay = currentDay.deductSameDay;
      
      let endingCash: number;
      let tomorrowPayments: number = 0;
      
      if (deductSameDay) {
        // نفس اليوم: المدفوعات تُخصم من اليوم الحالي
        endingCash = currentDay.openingCash + currentDay.sales - currentDay.totalPayments;
        tomorrowPayments = 0;
      } else {
        // وضع النقل: المدفوعات تُخصم من اليوم السابق
        // نخصم المدفوعات من اليوم السابق بدلاً من اليوم الحالي
        if (i > 0) {
          const previousDay = result[i - 1];
          previousDay.endingCash = previousDay.endingCash - currentDay.totalPayments;
          tomorrowPayments = currentDay.totalPayments;
        }
        endingCash = currentDay.openingCash + currentDay.sales;
      }
      
      const status = endingCash >= settings.safetyThreshold ? 'Safe' : (endingCash >= 0 ? 'Warning' : 'Deficit');
      
      currentDay.endingCash = endingCash;
      currentDay.tomorrowPayments = tomorrowPayments;
      currentDay.status = status;
      
      // تحديث opening cash لليوم التالي
      if (i + 1 < result.length) {
        if (!result[i + 1].isOpeningCashManual) {
          result[i + 1].openingCash = endingCash;
        }
      }
    }
    
    return result;
  }

  async deletePayment(id: number): Promise<void> {
    await this.paymentRepository.delete(id);
  }

  async getPayment(id: number): Promise<CashFlowPayment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  async getAllPayments(): Promise<CashFlowPayment[]> {
    return this.paymentRepository.find({ order: { date: 'DESC' } });
  }

  async resetMonth(month: string): Promise<{ message: string }> {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

    await this.paymentRepository
      .createQueryBuilder()
      .delete()
      .where('date >= :startDate AND date <= :endDate', { startDate, endDate })
      .execute();

    await this.dayRepository
      .createQueryBuilder()
      .delete()
      .where('date >= :startDate AND date <= :endDate', { startDate, endDate })
      .execute();

    return { message: `تم إعادة تعيين بيانات Cash Flow للشهر ${month} بنجاح` };
  }

  async exportToExcel(month: string): Promise<Buffer> {
    const monthData = await this.getMonthData(month);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cash Flow');

    // Add title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `Cash Flow Report - ${month}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Date',
      'Day',
      'Sales',
      'Opening',
      'المدفوعات',
      'Ending',
      'Status',
      'Details'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data
    for (const day of monthData) {
      const dayNumber = new Date(day.date).getDate();
      const paymentDetails = day.payments && day.payments.length > 0 
        ? day.payments.map(p => `${p.recipientName}: ${p.amount}${p.description ? ' - ' + p.description : ''}`).join('\n')
        : '';
      
      worksheet.addRow([
        day.date,
        dayNumber,
        day.sales,
        day.openingCash,
        day.totalPayments,
        day.endingCash,
        day.status,
        paymentDetails
      ]);
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
