import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  async create(createHolidayDto: CreateHolidayDto) {
    const holiday = this.holidayRepository.create(createHolidayDto);
    return await this.holidayRepository.save(holiday);
  }

  async findAll(organizationId?: number) {
    const whereClause = organizationId ? { organizationId } : {};
    return await this.holidayRepository.find({
      where: whereClause,
      order: { date: 'ASC' },
    });
  }

  async findOne(id: number) {
    const holiday = await this.holidayRepository.findOne({ where: { id } });
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
    return holiday;
  }

  async update(id: number, updateHolidayDto: UpdateHolidayDto) {
    const holiday = await this.findOne(id);
    const updated = Object.assign(holiday, updateHolidayDto);
    return await this.holidayRepository.save(updated);
  }

  async remove(id: number) {
    const holiday = await this.findOne(id);
    return await this.holidayRepository.remove(holiday);
  }

  // Used by PayrollService
  async findByMonth(organizationId: number, monthKey: string): Promise<Holiday[]> {
    // monthKey is usually "YYYY-MM"
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    const qb = this.holidayRepository.createQueryBuilder('holiday')
      .where('holiday.organizationId = :organizationId', { organizationId })
      .andWhere('holiday.date >= :start', { start })
      .andWhere('holiday.date <= :end', { end })
      .orderBy('holiday.date', 'ASC');

    return await qb.getMany();
  }
}
