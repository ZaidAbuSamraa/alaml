import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  createSupplier(@Body(ValidationPipe) createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(createSupplierDto);
  }

  @Get()
  findAllSuppliers() {
    return this.suppliersService.findAllSuppliers();
  }

  @Get(':id')
  findOneSupplier(@Param('id') id: string) {
    return this.suppliersService.findOneSupplier(+id);
  }

  @Delete(':id')
  removeSupplier(@Param('id') id: string) {
    return this.suppliersService.removeSupplier(+id);
  }

  @Post('invoices')
  createInvoice(@Body(ValidationPipe) createInvoiceDto: CreateInvoiceDto) {
    return this.suppliersService.createInvoice(createInvoiceDto);
  }

  @Get(':id/invoices')
  findInvoicesBySupplier(@Param('id') id: string) {
    return this.suppliersService.findInvoicesBySupplier(+id);
  }

  @Put('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body(ValidationPipe) updateInvoiceDto: CreateInvoiceDto) {
    return this.suppliersService.updateInvoice(+id, updateInvoiceDto);
  }

  @Delete('invoices/:id')
  deleteInvoice(@Param('id') id: string) {
    return this.suppliersService.deleteInvoice(+id);
  }

  @Post('payments')
  createPayment(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
    return this.suppliersService.createPayment(createPaymentDto);
  }

  @Get(':id/payments')
  findPaymentsBySupplier(@Param('id') id: string) {
    return this.suppliersService.findPaymentsBySupplier(+id);
  }

  @Put('payments/:id')
  updatePayment(@Param('id') id: string, @Body(ValidationPipe) updatePaymentDto: CreatePaymentDto) {
    return this.suppliersService.updatePayment(+id, updatePaymentDto);
  }

  @Delete('payments/:id')
  deletePayment(@Param('id') id: string) {
    return this.suppliersService.deletePayment(+id);
  }
}
