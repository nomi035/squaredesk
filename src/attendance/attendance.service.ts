import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Between, DataSource, IsNull } from 'typeorm';
import { PatchAttendanceDto } from './dto/patch-attendance.dto';
import { Break } from 'src/break/entities/break.entity';
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(@InjectRepository(Attendance) private attendanceRepository: Repository<Attendance>,
  private readonly dataSource: DataSource,) {

  }
  create(createAttendanceDto: CreateAttendanceDto) {
    const attendance = this.attendanceRepository.create(createAttendanceDto);
    return this.attendanceRepository.save(attendance);
  }

  findAll() {
    return this.attendanceRepository.find({
      relations: ['breaks','employee'],
    });
  }

  findOne(id: number) {
    return this.attendanceRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    await this.attendanceRepository.update(id, updateAttendanceDto)
  }

  remove(id: number) {
    return this.attendanceRepository.delete(id);
  }

  findByEmployeeId(employeeId: number) {
    return this.attendanceRepository.find({ where: { employeeId },
    order: { createdAt: 'DESC' },
  relations: ['breaks']  });
  }
  async getTodayAttendance(employeeId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.attendanceRepository.findOne({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        employeeId: employeeId,
      },
      relations: ['breaks'],
    });
  }

  async getTodayAttendanceAllOffice(id:number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // return this.attendanceRepository.findOne({
    //   where: {
    //     createdAt: Between(startOfDay, endOfDay),
    //     employee:{
    //       officeId: id
    //     }
    //   },
    //   relations: ['breaks'],
    // });
  }
    async getTodayAttendanceAllOrganization(id:number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.attendanceRepository.findOne({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        employee:{
          organizationId: id
        }
      },
      relations: ['breaks'],
    });
  }
   async getTodayAttendanceWithoutBreaks(employeeId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.attendanceRepository.findOne({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        employeeId: employeeId,
      },

    });
  }
  async getAttendanceByDateRange(
  startDate: Date,
  endDate: Date,
  id:number
) {
 
  const attendances = await this.attendanceRepository
    .createQueryBuilder('attendance')
    .leftJoinAndSelect('attendance.employee', 'employee')
    .leftJoinAndSelect('attendance.breaks', 'breaks')
    .where('attendance.checkinDate BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .andWhere('employee.organizationId = :orgId', { orgId: id })
    .orderBy('attendance.employeeId', 'ASC')
    .addOrderBy('attendance.checkinDate', 'ASC')
    .getMany();


  return this.groupByEmployee(attendances);
}
  async getAttendanceByDateRangeOffice(
  startDate: Date,
  endDate: Date,
  id:number
) {
 
  const attendances = await this.attendanceRepository
    .createQueryBuilder('attendance')
    .leftJoinAndSelect('attendance.employee', 'employee')
    .leftJoinAndSelect('attendance.breaks', 'breaks')
    .where('attendance.checkinDate BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .andWhere('employee.organizationId = :orgId', { orgId: id })
    .orderBy('attendance.employeeId', 'ASC')
    .addOrderBy('attendance.checkinDate', 'ASC')
    .getMany();


  return this.groupByEmployee(attendances);
}
private groupByEmployee(attendances: Attendance[]) {
  const map = new Map<number, any>();

  for (const attendance of attendances) {
    const empId = attendance.employeeId;

    if (!map.has(empId)) {
      map.set(empId, {
        employeeId: empId,
        employeeName: attendance.employee.firstName+' '+attendance.employee.lastName,
        attendances: [],
      });
    }


    map.get(empId).attendances.push({
      id: attendance.id,
      checkinDate: attendance.checkinDate,
      checkinTime: attendance.checkinTime,
      checkoutDate: attendance.checkoutDate,
      checkoutTime: attendance.checkoutTime,
      breaks: attendance.breaks,
    });
  }

  return Array.from(map.values());
}

async updateAttendance(
  attendanceId: number,
  dto: UpdateAttendanceDto,
) {
  return this.dataSource.transaction(async (manager) => {
    const attendance = await manager.findOne(Attendance, {
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance not found');
    }

    // 1️⃣ Update attendance fields
    Object.assign(attendance, {
      checkinDate: dto.checkinDate ?? attendance.checkinDate,
      checkinTime: dto.checkinTime ?? attendance.checkinTime,
      checkoutDate: dto.checkoutDate ?? attendance.checkoutDate,
      checkoutTime: dto.checkoutTime ?? attendance.checkoutTime,
      duration: dto.duration ?? attendance.duration,
    });

    await manager.save(attendance);

    // 2️⃣ Update breaks
    if (dto.breaks?.length) {
      for (const breakDto of dto.breaks) {
        if (!breakDto.id) {
          const durationCalculated=await this.calculateDuration(
              breakDto.startTime,
              breakDto.endTime,
            ).toString()

            console.log("new durationCalculated",durationCalculated)
          // ➕ CREATE new break
          const newBreak = manager.create(Break, {
            startTime: breakDto.startTime,
            endTime: breakDto.endTime,
            duration: durationCalculated,
            attendance,
          });

          await manager.save(newBreak);
        } else {
          // ✏️ UPDATE existing break
          const existingBreak = await manager.findOne(Break, {
            where: {
              id: breakDto.id,
              attendance: { id: attendanceId },
            },
          });

          if (!existingBreak) {
            throw new BadRequestException(
              `Break ${breakDto.id} not found`,
            );
          }

           const durationCalculated=await this.calculateDuration(
              breakDto.startTime,
              breakDto.endTime,
            ).toString()
            console.log("existing durationCalculated",durationCalculated)
          existingBreak.startTime =
            breakDto.startTime ?? existingBreak.startTime;

          existingBreak.endTime =
            breakDto.endTime ?? existingBreak.endTime;


              existingBreak.duration = durationCalculated

          await manager.save(existingBreak);
        }
      }
    }

    return attendance;
  });
}
 time12toSeconds(time: string): number {
  // Example: "12:06:43 PM"
  const [hms, period] = [time.slice(0, 8), time.slice(9)]; 
  const [hoursStr, minutesStr, secondsStr] = hms.split(':');

  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);

  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds; // total seconds
}


  calculateDuration(start: string, end: string) {
    const t1 = this.time12toSeconds(start);
    const t2 = this.time12toSeconds(end);

  let diff = t2 - t1;
  if (diff < 0) diff += 24 * 3600; // handle next day

  return diff/60;
  }

async getWeekAndMonthDuration(employeeId: number) {
  const weekStart = `date_trunc('week', NOW())`;
  const monthStart = `date_trunc('month', NOW())`;

  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .select([
      'a.id',
      'a.checkinDate',
      'a.duration',
    ])
    .where('a.employeeId = :employeeId', { employeeId })
   
    .andWhere(
      `(a.checkinDate >= ${weekStart} OR a.checkinDate >= ${monthStart})`,
    )
    .getMany();
console.log("attendances",attendances)
  // Now calculate manually
  const now = new Date();
  const weekStartJs = startOfWeek(now);
  const monthStartJs = startOfMonth(now);

  let weekTotal = 0;
  let monthTotal = 0;

  for (const attendance of attendances) {
    const checkin = new Date(attendance.checkinDate);

    if (checkin >= weekStartJs) {
      weekTotal += attendance.duration;
    }

    if (checkin >= monthStartJs) {
      monthTotal += attendance.duration;
    }
  }
console.log("weekTotal",weekTotal)
console.log("monthTotal",monthTotal)
  return {
    currentWeek: Number(weekTotal.toFixed(2)),
    currentMonth: Number(monthTotal.toFixed(2)),
  };
}

async getManagerMonthHours(officeId:number){
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  startDate.setHours(0, 0, 0, 0);

  // Month names
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Fetch attendances for employees in this office
  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .innerJoin('a.employee', 'e')
    .select(['a.checkinDate', 'a.duration'])
    .where('a.duration > 0')
    .andWhere('e.officeId = :officeId', { officeId })
    .andWhere('a.checkinDate >= :startDate', { startDate })
    .getMany();

  // Initialize result object with 12 months
  const result: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthNames[d.getMonth()];
    result[monthKey] = 0;
  }

  // Aggregate durations
  for (const att of attendances) {
    const d = new Date(att.checkinDate);
    const monthKey = monthNames[d.getMonth()];
    if (result[monthKey] !== undefined) {
      result[monthKey] += att.duration;
    }
  }

  return result;
}

async getAdminMonthHours(officeId:number){
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  startDate.setHours(0, 0, 0, 0);

  // Month names
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Fetch attendances for employees in this office
  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .innerJoin('a.employee', 'e')
    .select(['a.checkinDate', 'a.duration'])
    .where('a.duration > 0')
    .andWhere('e.organizationId = :officeId', { officeId })
    .andWhere('a.checkinDate >= :startDate', { startDate })
    .getMany();

  // Initialize result object with 12 months
  const result: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthNames[d.getMonth()];
    result[monthKey] = 0;
  }

  // Aggregate durations
  for (const att of attendances) {
    const d = new Date(att.checkinDate);
    const monthKey = monthNames[d.getMonth()];
    if (result[monthKey] !== undefined) {
      result[monthKey] += att.duration;
    }
  }

  return result;
}

  toDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  formatTime12h(date: Date): string {
    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const period = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) {
      hours12 = 12;
    }

    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')} ${period}`;
  }

  async findAttendanceByCheckinDate(employeeId: number, checkinDate: Date) {
    return this.attendanceRepository.findOne({
      where: {
        employeeId,
        checkinDate,
      },
    });
  }

  async findOpenAttendanceByCheckinDate(
    employeeId: number,
    checkinDate: Date,
  ) {
    return this.attendanceRepository.findOne({
      where: {
        employeeId,
        checkinDate,
        checkoutDate: IsNull(),
        checkoutTime: IsNull(),
      },
      order: { id: 'DESC' },
    });
  }

  async recordBiometricPunch(
    employeeUserId: number,
    punchAt: Date,
    status?: number,
  ) {
    const checkinDate = this.toDateOnly(punchAt);
    const punchTime = this.formatTime12h(punchAt);
    const openAttendance = await this.findOpenAttendanceByCheckinDate(
      employeeUserId,
      checkinDate,
    );

    const isCheckIn = status === 0;
    const isCheckOut =
      status === 1 || (!isCheckIn && !!openAttendance);

    if (isCheckIn || !isCheckOut) {
      // Check-in: create only when no open record exists that day
      // (checkoutDate and checkoutTime both null).
      if (openAttendance) {
        this.logger.log(
          `Check-in skipped for user ${employeeUserId}: already checked in at ${openAttendance.checkinTime}`,
        );
        return openAttendance;
      }

      const created = await this.attendanceRepository.save(
        this.attendanceRepository.create({
          employeeId: employeeUserId,
          checkinDate,
          checkinTime: punchTime,
        }),
      );

      this.logger.log(
        `User ${employeeUserId} checked in successfully at ${punchTime} (attendance #${created.id})`,
      );
      return created;
    }

    if (!openAttendance) {
      this.logger.warn(
        `Check-out skipped for user ${employeeUserId}: no open check-in found for ${checkinDate.toISOString().slice(0, 10)}`,
      );
      return null;
    }

    openAttendance.checkoutDate = checkinDate;
    openAttendance.checkoutTime = punchTime;
    openAttendance.duration = this.calculateDuration(
      openAttendance.checkinTime,
      punchTime,
    );

    await this.attendanceRepository.save(openAttendance);
    this.logger.log(
      `User ${employeeUserId} checked out successfully at ${punchTime} (attendance #${openAttendance.id}, duration ${openAttendance.duration})`,
    );
    return openAttendance;
  }
}








