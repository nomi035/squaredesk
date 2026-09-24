import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Lead } from './entities/lead.entity';
import { Outreach } from 'src/outreach/entities/outreach.entity';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Outreach)
    private readonly outreachRepository: Repository<Outreach>,
  ) {}

  async create(createLeadDto: CreateLeadDto, userId: number, organizationId: number) {
    const outreach = await this.outreachRepository.findOne({ where: { id: createLeadDto.outreachId } });
    if (!outreach) {
      throw new NotFoundException('Outreach record not found');
    }

    // Optional: Prevent duplicate claiming by the same user
    const existing = await this.leadRepository.findOne({
      where: { outreachId: outreach.id, userId },
    });
    if (existing) {
      throw new BadRequestException('You have already added this to your leads');
    }

    const lead = this.leadRepository.create({
      outreachId: outreach.id,
      userId,
      organizationId,
      npi: outreach.npi,
      name: outreach.name,
      enumerationDate: outreach.enumerationDate,
      taxonomy: outreach.taxonomy,
      city: outreach.city,
      state: outreach.state,
      postalCode: outreach.postalCode,
      practicePhone: outreach.practicePhone,
      authFirst: outreach.authFirst,
      authLast: outreach.authLast,
      authPhone: outreach.authPhone,
      email: outreach.email,
      disposition: outreach.disposition,
      csvComments: outreach.csvComments,
      comment: outreach.comment,
      status: outreach.status,
      additionalData: outreach.additionalData,
      leadType: createLeadDto.leadType || 'General Lead',
    });

    return await this.leadRepository.save(lead);
  }

  async findAll(userId: number, role: string, organizationId: number, query: any) {
    const { startDate, endDate, targetUserId, leadType } = query;
    const whereClause: any = {};

    if (leadType) {
      whereClause.leadType = leadType;
    }

    // Filter by date
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = Between(start, end);
    }

    // Role-based visibility
    if (role === 'admin') {
      whereClause.organizationId = organizationId;
      if (targetUserId) {
        whereClause.userId = targetUserId;
      }
    } else {
      // Manager and Employee see only their own leads
      whereClause.userId = userId;
    }

    return await this.leadRepository.find({
      where: whereClause,
      relations: ['user'], // So we can see the lead owner
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersWithLeads(organizationId: number) {
    // Returns distinct users/leadType pairs who have leads in this organization
    const leads = await this.leadRepository.find({
      where: { organizationId },
      relations: ['user'],
    });

    const userMap = new Map();
    leads.forEach((lead) => {
      if (lead.user) {
        const type = lead.leadType || 'General Lead';
        const key = `${lead.user.id}-${type}`;
        if (!userMap.has(key)) {
          userMap.set(key, {
            id: lead.user.id,
            firstName: lead.user.firstName,
            lastName: lead.user.lastName,
            role: lead.user.role,
            leadType: type,
          });
        }
      }
    });

    return Array.from(userMap.values());
  }

  async update(id: number, updateData: { leadType?: string }) {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    
    if (updateData.leadType) {
      lead.leadType = updateData.leadType;
    }
    
    return await this.leadRepository.save(lead);
  }

  async remove(id: number) {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return await this.leadRepository.remove(lead);
  }

  async removeByUser(userId: number, organizationId: number, leadType?: string) {
    const whereClause: any = { userId, organizationId };
    if (leadType) {
      whereClause.leadType = leadType;
    }
    const leads = await this.leadRepository.find({
      where: whereClause,
    });
    if (leads.length === 0) {
      throw new NotFoundException('No leads found for this user');
    }
    return await this.leadRepository.remove(leads);
  }
}
