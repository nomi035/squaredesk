import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { User, Role } from 'src/user/entities/user.entity';
import { Between, Repository, Not } from 'typeorm';
import { Payroll } from './entities/payroll.entity';
import { AttendanceService } from 'src/attendance/attendance.service';

const HOURS_PER_WORKDAY = 9;

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrollRepository: Repository<Payroll>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly attendanceService: AttendanceService,
  ) {}

  getCurrentMonthKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getMonthDateRange(monthKey: string): { start: Date; end: Date } {
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  countWeekdaysInMonth(monthKey: string): number {
    const { start, end } = this.getMonthDateRange(monthKey);
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = cursor.getDay();
      if (day >= 1 && day <= 5) {
        count += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  async getExpectedHoursForMonth(monthKey: string, shift?: any): Promise<number> {
    const shiftHours = await this.attendanceService.getExpectedDailyWorkingHours(shift);
    return this.countWeekdaysInMonth(monthKey) * shiftHours;
  }

  async getWorkedHoursForUser(
    userId: number,
    monthKey: string,
  ): Promise<number> {
    const { start, end } = this.getMonthDateRange(monthKey);
    const totalMinutes = await this.attendanceService.getDynamicMonthlyWorkedMinutes(userId, start, end);
    return Number((totalMinutes / 60).toFixed(2));
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }

  async findPayrollForUserMonth(userId: number, monthKey: string) {
    return this.payrollRepository.findOne({
      where: { userId, month: monthKey },
      relations: ['user'],
    });
  }

  async calculatePayrollForUser(
    userId: number,
    organizationId: number,
    monthKey = this.getCurrentMonthKey(),
  ) {
    const existing = await this.findPayrollForUserMonth(userId, monthKey);
    if (existing) {
      return {
        generated: false,
        payroll: existing,
        message: `Payroll already exists for ${monthKey}`,
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
      relations: ['shift']
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found in organization`);
    }
    if (user.isActive === false) {
      throw new BadRequestException(`User ${userId} is inactive`);
    }
    if (user.role === Role.ADMIN) {
      throw new BadRequestException(`Cannot generate payroll for Admin ${userId}`);
    }
    if (!user.salaryAmount || user.salaryAmount <= 0) {
      throw new BadRequestException(
        `User ${userId} does not have a valid salaryAmount`,
      );
    }

    const expectedHours = await this.getExpectedHoursForMonth(monthKey, user.shift);
    if (expectedHours <= 0) {
      throw new BadRequestException(`User ${userId} has no active shift assigned or 0 expected hours`);
    }

    const workedHours = await this.getWorkedHoursForUser(userId, monthKey);
    const hourlyRate = user.salaryAmount / expectedHours;
    const amount = this.roundCurrency(workedHours * hourlyRate);

    const payrollData: Partial<Payroll> = {
      userId,
      month: monthKey,
      salary: user.salaryAmount,
      amount,
      workedHours,
      expectedHours,
      hourlyRate: Number(hourlyRate.toFixed(4)),
      organizationId,
    };

    const saved = await this.payrollRepository.save(payrollData);
    const payroll = await this.payrollRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    return {
      generated: true,
      payroll,
      message: `Payroll generated for ${monthKey}`,
    };
  }

  async generateBulk(organizationId: number, monthKey = this.getCurrentMonthKey()) {
    const users = await this.userRepository.find({
      where: { organizationId, isActive: true, role: Not(Role.ADMIN) },
      relations: ['shift']
    });

    const results: Array<{
      userId: number;
      success: boolean;
      generated: boolean;
      payroll?: Payroll;
      message?: string;
      error?: string;
    }> = [];

    for (const user of users) {
      if (!user.salaryAmount || user.salaryAmount <= 0) {
        results.push({
          userId: user.id,
          success: false,
          generated: false,
          error: 'Missing salaryAmount',
        });
        continue;
      }

      try {
        const result = await this.calculatePayrollForUser(
          user.id,
          organizationId,
          monthKey,
        );
        results.push({
          userId: user.id,
          success: true,
          generated: result.generated,
          payroll: result.payroll,
          message: result.message,
        });
      } catch (error) {
        results.push({
          userId: user.id,
          success: false,
          generated: false,
          error: error.message,
        });
      }
    }

    const generated = results.filter((r) => r.generated).length;
    const skipped = results.filter((r) => r.success && !r.generated).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      month: monthKey,
      expectedHoursPerUser: await this.getExpectedHoursForMonth(monthKey),
      hoursPerWorkday: HOURS_PER_WORKDAY,
      totalUsers: users.length,
      generated,
      skipped,
      failed,
      results,
    };
  }

  async findAll(organizationId: number, month?: string, page: number = 1, limit: number = 25) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.payrollRepository.findAndCount({
      where: {
        organizationId,
        ...(month && month !== 'all' ? { month } : {}),
      },
      relations: ['user'],
      order: { month: 'DESC', userId: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  findByUser(userId: number, organizationId: number) {
    return this.payrollRepository.find({
      where: { userId, organizationId },
      relations: ['user'],
      order: { month: 'DESC' },
    });
  }

  async findOne(id: number, organizationId: number) {
    const payroll = await this.payrollRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });
    if (!payroll) {
      throw new NotFoundException(`Payroll ${id} not found`);
    }
    return payroll;
  }
}
