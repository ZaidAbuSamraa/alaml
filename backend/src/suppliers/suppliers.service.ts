import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { SupplierCashflowNote } from '../entities/supplier-cashflow-note.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(SupplierCashflowNote)
    private supplierCashflowNoteRepository: Repository<SupplierCashflowNote>,
  ) {}

  async createSupplier(createSupplierDto: CreateSupplierDto) {
    const supplier = this.supplierRepository.create(createSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async findAllSuppliers() {
    return await this.supplierRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOneSupplier(id: number) {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['invoices', 'payments'],
    });

    if (!supplier) {
      throw new NotFoundException('المورد غير موجود');
    }

    return supplier;
  }

  async removeSupplier(id: number) {
    const supplier = await this.supplierRepository.findOne({ 
      where: { id },
      relations: ['invoices', 'payments']
    });
    
    if (!supplier) {
      throw new NotFoundException('المورد غير موجود');
    }

    // Delete all transactions related to this supplier
    await this.transactionRepository.delete({ supplier: { id } });
    
    // Delete all invoices
    if (supplier.invoices && supplier.invoices.length > 0) {
      await this.invoiceRepository.delete({ supplierId: id });
    }
    
    // Delete all payments
    if (supplier.payments && supplier.payments.length > 0) {
      await this.paymentRepository.delete({ supplierId: id });
    }
    
    // Finally delete the supplier
    await this.supplierRepository.delete(id);
    
    return { message: 'تم حذف المورد بنجاح' };
  }

  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    // Auto-generate invoice number if not provided
    if (!createInvoiceDto.invoiceNumber) {
      const lastInvoice = await this.invoiceRepository.findOne({
        order: { id: 'DESC' },
      });
      const nextNumber = lastInvoice ? lastInvoice.id + 1 : 1;
      createInvoiceDto.invoiceNumber = `INV-${nextNumber.toString().padStart(5, '0')}`;
    }

    const invoice = this.invoiceRepository.create(createInvoiceDto);
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      type: TransactionType.INVOICE,
      amount: createInvoiceDto.amount,
      date: createInvoiceDto.date,
      description: createInvoiceDto.description || `فاتورة رقم ${createInvoiceDto.invoiceNumber}`,
      supplier: { id: createInvoiceDto.supplierId },
      invoice: savedInvoice,
    });
    await this.transactionRepository.save(transaction);

    return savedInvoice;
  }

  async findInvoicesBySupplier(supplierId: number) {
    return await this.invoiceRepository.find({
      where: { supplierId },
      order: { date: 'DESC' },
    });
  }

  async createPayment(createPaymentDto: CreatePaymentDto) {
    // Auto-generate payment number if not provided
    if (!createPaymentDto.paymentNumber) {
      const lastPayment = await this.paymentRepository.findOne({
        order: { id: 'DESC' },
      });
      const nextNumber = lastPayment ? lastPayment.id + 1 : 1;
      createPaymentDto.paymentNumber = `PAY-${nextNumber.toString().padStart(5, '0')}`;
    }

    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      type: TransactionType.PAYMENT,
      amount: createPaymentDto.amount,
      date: createPaymentDto.date,
      description: createPaymentDto.notes || 'دفعة',
      supplier: { id: createPaymentDto.supplierId },
      payment: savedPayment,
    });
    await this.transactionRepository.save(transaction);

    return savedPayment;
  }

  async findPaymentsBySupplier(supplierId: number) {
    return await this.paymentRepository.find({
      where: { supplierId },
      order: { date: 'DESC' },
    });
  }

  async updateInvoice(id: number, updateInvoiceDto: CreateInvoiceDto) {
    await this.invoiceRepository.update(id, updateInvoiceDto);
    return await this.invoiceRepository.findOne({ where: { id } });
  }

  async deleteInvoice(id: number) {
    // Find the invoice first to get its data
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    // Delete related transaction
    await this.transactionRepository.delete({ invoice: { id } });
    
    // Delete the invoice
    await this.invoiceRepository.delete(id);
    
    return { message: 'تم حذف الفاتورة بنجاح' };
  }

  async updatePayment(id: number, updatePaymentDto: CreatePaymentDto) {
    await this.paymentRepository.update(id, updatePaymentDto);
    return await this.paymentRepository.findOne({ where: { id } });
  }

  async deletePayment(id: number) {
    // Find the payment first to get its data
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('الدفعة غير موجودة');
    }

    // Delete related transaction
    await this.transactionRepository.delete({ payment: { id } });
    
    // Delete the payment
    await this.paymentRepository.delete(id);
    
    return { message: 'تم حذف الدفعة بنجاح' };
  }

  async getCashflowNotes(supplierId: number) {
    return await this.supplierCashflowNoteRepository.find({
      where: { supplierId },
      order: { date: 'DESC' },
    });
  }
}
