import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';

export enum TransactionType {
  INVOICE = 'invoice',
  PAYMENT = 'payment',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Supplier, { eager: true })
  supplier: Supplier;

  @ManyToOne(() => Invoice, { nullable: true })
  invoice: Invoice;

  @ManyToOne(() => Payment, { nullable: true })
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;
}
