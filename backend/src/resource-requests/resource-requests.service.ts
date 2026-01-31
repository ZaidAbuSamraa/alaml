import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceRequest, RequestStatus } from '../entities/resource-request.entity';
import { Notification, NotificationType } from '../entities/notification.entity';
import { CreateResourceRequestDto } from './dto/create-resource-request.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ResourceRequestsService {
  constructor(
    @InjectRepository(ResourceRequest)
    private resourceRequestRepository: Repository<ResourceRequest>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private whatsAppService: WhatsAppService,
  ) {}

  async create(createResourceRequestDto: CreateResourceRequestDto): Promise<ResourceRequest> {
    const request = this.resourceRequestRepository.create(createResourceRequestDto);
    const savedRequest = await this.resourceRequestRepository.save(request);

    // Create notification for admin
    const notification = this.notificationRepository.create({
      employeeId: createResourceRequestDto.employeeId,
      type: NotificationType.RESOURCE_REQUEST,
      message: `طلب موارد جديد: ${createResourceRequestDto.requestName}`,
      isRead: false,
    });
    await this.notificationRepository.save(notification);
    
    await this.whatsAppService.sendNotificationViaAPI(notification.message);

    return savedRequest;
  }

  async findAll(): Promise<ResourceRequest[]> {
    return await this.resourceRequestRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['employee'],
    });
  }

  async findByEmployee(employeeId: number): Promise<ResourceRequest[]> {
    return await this.resourceRequestRepository.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ResourceRequest> {
    const request = await this.resourceRequestRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!request) {
      throw new NotFoundException('الطلب غير موجود');
    }

    return request;
  }

  async updateStatus(id: number, status: RequestStatus, adminNotes?: string): Promise<ResourceRequest> {
    const request = await this.findOne(id);
    
    request.status = status;
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }

    return await this.resourceRequestRepository.save(request);
  }

  async delete(id: number): Promise<{ message: string }> {
    const request = await this.resourceRequestRepository.findOne({ where: { id } });
    
    if (!request) {
      throw new NotFoundException('الطلب غير موجود');
    }
    
    await this.resourceRequestRepository.delete(id);
    
    return { message: 'تم حذف الطلب بنجاح' };
  }
}
