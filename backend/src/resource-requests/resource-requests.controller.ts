import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ResourceRequestsService } from './resource-requests.service';
import { CreateResourceRequestDto } from './dto/create-resource-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { RequestStatus } from '../entities/resource-request.entity';

@Controller('resource-requests')
@UseGuards(JwtAuthGuard)
export class ResourceRequestsController {
  constructor(private readonly resourceRequestsService: ResourceRequestsService) {}

  @Post()
  create(@Body(ValidationPipe) createResourceRequestDto: CreateResourceRequestDto) {
    return this.resourceRequestsService.create(createResourceRequestDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.resourceRequestsService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.resourceRequestsService.findByEmployee(+employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceRequestsService.findOne(+id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: RequestStatus; adminNotes?: string }
  ) {
    return this.resourceRequestsService.updateStatus(+id, body.status, body.adminNotes);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.resourceRequestsService.delete(+id);
  }
}
