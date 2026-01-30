import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  async createSale(saleData: Partial<Sale>): Promise<Sale> {
    // Auto-generate sale number if not provided
    if (!saleData.saleNumber) {
      const lastSale = await this.saleRepository.findOne({
        order: { id: 'DESC' },
      });
      const nextNumber = lastSale ? lastSale.id + 1 : 1;
      saleData.saleNumber = `SALE-${nextNumber.toString().padStart(5, '0')}`;
    }
    
    const sale = this.saleRepository.create(saleData);
    return await this.saleRepository.save(sale);
  }

  async findAllSales(): Promise<Sale[]> {
    return await this.saleRepository.find({
      order: { date: 'DESC' },
    });
  }

  async findOneSale(id: number): Promise<Sale> {
    return await this.saleRepository.findOne({ where: { id } });
  }

  async updateSale(id: number, saleData: Partial<Sale>): Promise<Sale> {
    await this.saleRepository.update(id, saleData);
    return await this.saleRepository.findOne({ where: { id } });
  }

  async deleteSale(id: number): Promise<{ message: string }> {
    await this.saleRepository.delete(id);
    return { message: 'تم حذف المبيعة بنجاح' };
  }

  async getTotalSales(): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.amount)', 'total')
      .getRawOne();
    return Number(result.total) || 0;
  }
}
