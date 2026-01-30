import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CashFlowDay } from './cashflow-day.entity';

@Entity('cashflow_payments')
export class CashFlowPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  recipientName: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => CashFlowDay, day => day.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashFlowDayId' })
  cashFlowDay: CashFlowDay;

  @Column({ nullable: true })
  cashFlowDayId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
