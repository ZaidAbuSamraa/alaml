import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cash } from '../entities/cash.entity';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(Cash)
    private cashRepository: Repository<Cash>,
  ) {}

  async getCash(): Promise<Cash> {
    let cash = await this.cashRepository.findOne({ where: { id: 1 } });
    
    if (!cash) {
      cash = this.cashRepository.create({ amount: 0, notes: '' });
      await this.cashRepository.save(cash);
    }
    
    return cash;
  }

  async updateCash(amount: number, notes?: string): Promise<Cash> {
    let cash = await this.getCash();
    
    cash.amount = amount; // This is the base/initial cash
    if (notes !== undefined) {
      cash.notes = notes;
    }
    
    return await this.cashRepository.save(cash);
  }

  async getBaseCash(): Promise<number> {
    const cash = await this.getCash();
    return Number(cash.amount) || 0;
  }
}
