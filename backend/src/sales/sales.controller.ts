import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  createSale(@Body(ValidationPipe) createSaleDto: CreateSaleDto) {
    return this.salesService.createSale(createSaleDto);
  }

  @Get()
  findAllSales() {
    return this.salesService.findAllSales();
  }

  @Get('total')
  getTotalSales() {
    return this.salesService.getTotalSales();
  }

  @Get(':id')
  findOneSale(@Param('id') id: string) {
    return this.salesService.findOneSale(+id);
  }

  @Put(':id')
  updateSale(@Param('id') id: string, @Body(ValidationPipe) updateSaleDto: CreateSaleDto) {
    return this.salesService.updateSale(+id, updateSaleDto);
  }

  @Delete(':id')
  deleteSale(@Param('id') id: string) {
    return this.salesService.deleteSale(+id);
  }
}
