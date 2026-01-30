import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction, TransactionType } from '../entities/transaction.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getAnalytics(startDate?: string, endDate?: string, supplierId?: number) {
    const whereCondition: any = {};

    if (startDate && endDate) {
      whereCondition.date = Between(startDate, endDate);
    } else if (startDate) {
      whereCondition.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereCondition.date = LessThanOrEqual(endDate);
    }

    if (supplierId) {
      whereCondition.supplier = { id: supplierId };
    }

    // If no filters, fetch all transactions
    const findOptions: any = {
      relations: ['supplier'],
      order: { date: 'DESC' },
    };

    // Only add where clause if there are conditions
    if (Object.keys(whereCondition).length > 0) {
      findOptions.where = whereCondition;
    }

    const transactions = await this.transactionRepository.find(findOptions);
    
    console.log('Analytics Query:', { startDate, endDate, supplierId, whereCondition, transactionCount: transactions.length });

    const totalInvoices = transactions
      .filter(t => t.type === TransactionType.INVOICE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPayments = transactions
      .filter(t => t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalInvoices - totalPayments;

    const invoiceCount = transactions.filter(t => t.type === TransactionType.INVOICE).length;
    const paymentCount = transactions.filter(t => t.type === TransactionType.PAYMENT).length;

    // Group by supplier
    const bySupplier = transactions.reduce((acc, transaction) => {
      const supplierId = transaction.supplier.id;
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: transaction.supplier,
          totalInvoices: 0,
          totalPayments: 0,
          balance: 0,
        };
      }

      if (transaction.type === TransactionType.INVOICE) {
        acc[supplierId].totalInvoices += Number(transaction.amount);
      } else {
        acc[supplierId].totalPayments += Number(transaction.amount);
      }

      acc[supplierId].balance = acc[supplierId].totalInvoices - acc[supplierId].totalPayments;

      return acc;
    }, {});

    return {
      summary: {
        totalInvoices,
        totalPayments,
        balance,
        invoiceCount,
        paymentCount,
      },
      bySupplier: Object.values(bySupplier),
      transactions,
    };
  }

  async getRecentTransactions(limit: number = 10) {
    return this.transactionRepository.find({
      relations: ['supplier'],
      order: { date: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }
}
