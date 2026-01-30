import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashFlowController } from './cashflow.controller';
import { CashFlowService } from './cashflow.service';
import { CashFlowDay } from '../entities/cashflow-day.entity';
import { CashFlowPayment } from '../entities/cashflow-payment.entity';
import { CashFlowSettings } from '../entities/cashflow-settings.entity';
import { Supplier } from '../entities/supplier.entity';
import { SupplierCashflowNote } from '../entities/supplier-cashflow-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashFlowDay, CashFlowPayment, CashFlowSettings, Supplier, SupplierCashflowNote])],
  controllers: [CashFlowController],
  providers: [CashFlowService],
  exports: [CashFlowService],
})
export class CashFlowModule {}
