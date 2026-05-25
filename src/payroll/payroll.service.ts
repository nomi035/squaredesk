import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { User } from 'src/user/entities/user.entity';
import { Between, Repository } from 'typeorm';
import { Payroll } from './entities/payroll.entity';

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

  getExpectedHoursForMonth(monthKey: string): number {
    return this.countWeekdaysInMonth(monthKey) * HOURS_PER_WORKDAY;
  }

  async getWorkedHoursForUser(
    userId: number,
    monthKey: string,
  ): Promise<number> {
    const { start, end } = this.getMonthDateRange(monthKey);
    const attendances = await this.attendanceRepository.find({
      where: {
        employeeId: userId,
        checkinDate: Between(start, end),
      },
      select: ['duration'],
    });

    const totalMinutes = attendances.reduce(
      (sum, record) => sum + (Number(record.duration) || 0),
      0,
    );
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
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found in organization`);
    }
    if (!user.salaryAmount || user.salaryAmount <= 0) {
      throw new BadRequestException(
        `User ${userId} does not have a valid salaryAmount`,
      );
    }

    const expectedHours = this.getExpectedHoursForMonth(monthKey);
    if (expectedHours <= 0) {
      throw new BadRequestException('No working days in the selected month');
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
      where: { organizationId },
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
      expectedHoursPerUser: this.getExpectedHoursForMonth(monthKey),
      hoursPerWorkday: HOURS_PER_WORKDAY,
      totalUsers: users.length,
      generated,
      skipped,
      failed,
      results,
    };
  }

  findAll(organizationId: number, month?: string) {
    return this.payrollRepository.find({
      where: {
        organizationId,
        ...(month ? { month } : {}),
      },
      relations: ['user'],
      order: { month: 'DESC', userId: 'ASC' },
    });
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
