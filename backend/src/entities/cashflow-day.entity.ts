import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CashFlowPayment } from './cashflow-payment.entity';

@Entity('cashflow_days')
export class CashFlowDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  openingCash: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  sales: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  manualSales: number;

  @Column({ default: false })
  useDefaultSales: boolean;

  @Column({ default: true })
  deductSameDay: boolean;

  @Column({ default: false })
  isOpeningCashManual: boolean;

  @OneToMany(() => CashFlowPayment, payment => payment.cashFlowDay)
  payments: CashFlowPayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
