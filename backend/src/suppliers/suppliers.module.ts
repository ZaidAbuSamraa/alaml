import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { Supplier } from '../entities/supplier.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Transaction } from '../entities/transaction.entity';
import { SupplierCashflowNote } from '../entities/supplier-cashflow-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, Invoice, Payment, Transaction, SupplierCashflowNote])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
