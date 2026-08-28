import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Between, DataSource, IsNull } from 'typeorm';
import { PatchAttendanceDto } from './dto/patch-attendance.dto';
import { Break } from 'src/break/entities/break.entity';
import { BreakService } from 'src/break/break.service';
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
  private readonly dataSource: DataSource,
    private readonly breakService: BreakService) {

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

  async findByEmployeeId(employeeId: number) {
    const attendances = await this.attendanceRepository.find({ 
      where: { employeeId },
      order: { checkinDate: 'DESC' },
      relations: ['breaks', 'employee', 'employee.shift']  
    });
    
    const globalBreaks = await this.breakService.findGlobalBreaks();
    const grouped = this.groupByEmployee(attendances, globalBreaks);
    
    if (grouped.length > 0) {
      return grouped[0].attendances;
    }
    return [];
  }
  async getTodayAttendance(employeeId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.attendanceRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        employeeId: employeeId,
      },
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
      relations: ['employee'],
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
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('attendance.breaks', 'breaks')
    .where('attendance.checkinDate BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .andWhere('employee.organizationId = :orgId', { orgId: id })
    .orderBy('attendance.employeeId', 'ASC')
    .addOrderBy('attendance.checkinDate', 'ASC')
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  return this.groupByEmployee(attendances, globalBreaks);
}
  async getAttendanceByDateRangeOffice(
  startDate: Date,
  endDate: Date,
  id:number
) {
 
  const attendances = await this.attendanceRepository
    .createQueryBuilder('attendance')
    .leftJoinAndSelect('attendance.employee', 'employee')
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('attendance.breaks', 'breaks')
    .where('attendance.checkinDate BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .andWhere('employee.organizationId = :orgId', { orgId: id })
    .orderBy('attendance.employeeId', 'ASC')
    .addOrderBy('attendance.checkinDate', 'ASC')
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  return this.groupByEmployee(attendances, globalBreaks);
}
private groupByEmployee(attendances: Attendance[], globalBreaks: Break[] = []) {
  const map = new Map<number, any>();

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const cleaned = timeStr.trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[4];
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const minutesToTimeStr = (totalMins: number) => {
    let hours = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    const hStr = h12.toString().padStart(2, '0');
    const mStr = mins.toString().padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  };

  const relativeMins = (base: number, target: number) => {
      let diff = target - base;
      if (diff < -12 * 60) diff += 24 * 60; 
      return diff;
  };

  for (const attendance of attendances) {
    const empId = attendance.employeeId;

    if (!map.has(empId)) {
      map.set(empId, {
        employeeId: empId,
        employeeName: attendance.employee?.firstName + ' ' + attendance.employee?.lastName,
        attendances: [],
      });
    }

    let sessions: any[] = [];
    let totalWorkedMinutes = 0;

    if (attendance.checkinTime) {
      let originalCheckinMins = parseTimeToMinutes(attendance.checkinTime);
      let originalCheckoutMins = attendance.checkoutTime ? parseTimeToMinutes(attendance.checkoutTime) : null;
      let checkinMins = originalCheckinMins;
      let checkoutMins = originalCheckoutMins;
      
      const shift = attendance.employee?.shift;
      if (shift) {
         let shiftStartMins = parseTimeToMinutes(shift.startTime);
         if (relativeMins(shiftStartMins, checkinMins) < 0) {
            checkinMins = shiftStartMins; 
         }
         
         if (checkoutMins !== null) {
             let shiftEndMins = parseTimeToMinutes(shift.endTime);
             if (relativeMins(shiftEndMins, checkoutMins) > 0) {
                 checkoutMins = shiftEndMins;
             }
         }
      }
      
      if (checkoutMins !== null && relativeMins(checkinMins, checkoutMins) <= 0) {
          checkoutMins = checkinMins; 
      }

      let currentStartMins: number | null = checkinMins;
      const allBreaks = [...(attendance.breaks || []), ...globalBreaks];
      
      const validBreaks = allBreaks.map(b => ({
          start: parseTimeToMinutes(b.startTime),
          end: b.endTime ? parseTimeToMinutes(b.endTime) : null
      })).filter(b => {
          if (b.end !== null && relativeMins(checkinMins, b.end) <= 0) return false;
          if (checkoutMins !== null && relativeMins(checkoutMins, b.start) >= 0) return false;
          return true;
      }).map(b => {
          let start = b.start;
          let end = b.end;
          if (relativeMins(checkinMins, start) < 0) start = checkinMins;
          if (checkoutMins !== null && end !== null && relativeMins(checkoutMins, end) > 0) end = checkoutMins;
          return { start, end };
      }).sort((a, b) => relativeMins(checkinMins, a.start) - relativeMins(checkinMins, b.start));

      let punchBillableMins = 0;

      for (let i = 0; i < validBreaks.length; i++) {
        const brk = validBreaks[i];

        if (currentStartMins !== null) {
           const chunkDur = relativeMins(currentStartMins, brk.start);
           if (chunkDur > 0) {
               punchBillableMins += chunkDur;
           }
        }
        
        if (brk.end !== null) {
           if (currentStartMins === null || relativeMins(currentStartMins, brk.end) > 0) {
               currentStartMins = brk.end;
           }
        } else {
           currentStartMins = null;
           break;
        }
      }

      if (currentStartMins !== null && checkoutMins !== null) {
        const finalChunkDur = relativeMins(currentStartMins, checkoutMins);
        if (finalChunkDur > 0) {
            punchBillableMins += finalChunkDur;
        }
      }

      sessions.push({
          name: `Session 1`,
          startDate: attendance.checkinDate,
          startTime: minutesToTimeStr(originalCheckinMins),
          endDate: attendance.checkoutDate || attendance.checkinDate,
          endTime: originalCheckoutMins !== null ? minutesToTimeStr(originalCheckoutMins) : '-',
          duration: punchBillableMins
      });
      
      totalWorkedMinutes += punchBillableMins;
    }

    map.get(empId).attendances.push({
      id: attendance.id,
      checkinDate: attendance.checkinDate,
      checkinTime: attendance.checkinTime,
      checkoutDate: attendance.checkoutDate,
      checkoutTime: attendance.checkoutTime,
      breaks: attendance.breaks,
      sessions: sessions,
      duration: totalWorkedMinutes,
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

  async getDynamicMonthlyWorkedMinutes(employeeId: number, start: Date, end: Date): Promise<number> {
    const attendances = await this.attendanceRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.employee', 'employee')
      .leftJoinAndSelect('employee.shift', 'shift')
      .leftJoinAndSelect('a.breaks', 'breaks')
      .where('a.employeeId = :employeeId', { employeeId })
      .andWhere('a.checkinDate BETWEEN :start AND :end', { start, end })
      .getMany();

    const globalBreaks = await this.breakService.findGlobalBreaks();
    const grouped = this.groupByEmployee(attendances, globalBreaks);
    if (grouped.length === 0) return 0;
    
    return grouped[0].attendances.reduce((sum, att) => sum + (att.duration || 0), 0);
  }

  async getExpectedDailyWorkingHours(shift: any): Promise<number> {
    if (!shift || !shift.startTime || !shift.endTime) {
      return 0;
    }

    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    let rawDuration = (endH + endM / 60) - (startH + startM / 60);
    if (rawDuration < 0) rawDuration += 24;

    const globalBreaks = await this.breakService.findGlobalBreaks();
    let totalGlobalBreakMinutes = 0;
    for (const b of globalBreaks) {
      if (b.startTime && b.endTime) {
        const [bsH, bsM] = b.startTime.split(':').map(Number);
        const [beH, beM] = b.endTime.split(':').map(Number);
        let bDur = (beH * 60 + beM) - (bsH * 60 + bsM);
        if (bDur < 0) bDur += 24 * 60;
        totalGlobalBreakMinutes += bDur;
      }
    }

    const breakHours = totalGlobalBreakMinutes / 60;
    return Math.max(0, rawDuration - breakHours);
  }

async getWeekAndMonthDuration(employeeId: number) {
  const now = new Date();
  const todayStartJs = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStartJs = startOfWeek(now);
  const monthStartJs = startOfMonth(now);

  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.employee', 'employee')
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('a.breaks', 'breaks')
    .where('a.employeeId = :employeeId', { employeeId })
    .andWhere('a.checkinDate >= :monthStartJs', { monthStartJs })
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  const grouped = this.groupByEmployee(attendances, globalBreaks);
  const dynamicAttendances = grouped.length > 0 ? grouped[0].attendances : [];

  let todayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;

  for (const attendance of dynamicAttendances) {
    const checkin = new Date(attendance.checkinDate);

    if (checkin >= todayStartJs) {
      todayTotal += attendance.duration || 0;
    }

    if (checkin >= weekStartJs) {
      weekTotal += attendance.duration || 0;
    }

    if (checkin >= monthStartJs) {
      monthTotal += attendance.duration || 0;
    }
  }

  return {
    currentDay: Number((todayTotal / 60).toFixed(2)),
    currentWeek: Number((weekTotal / 60).toFixed(2)),
    currentMonth: Number((monthTotal / 60).toFixed(2)),
  };
}

async getManagerMonthHours(officeId:number){
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  startDate.setHours(0, 0, 0, 0);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .innerJoinAndSelect('a.employee', 'employee')
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('a.breaks', 'breaks')
    .where('employee.officeId = :officeId', { officeId })
    .andWhere('a.checkinDate >= :startDate', { startDate })
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  const grouped = this.groupByEmployee(attendances, globalBreaks);
  const dynamicAttendances = grouped.flatMap(g => g.attendances);

  const result: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthNames[d.getMonth()];
    result[monthKey] = 0;
  }

  for (const att of dynamicAttendances) {
    const d = new Date(att.checkinDate);
    const monthKey = monthNames[d.getMonth()];
    if (result[monthKey] !== undefined) {
      result[monthKey] += att.duration || 0;
    }
  }

  return result;
}

async getAdminMonthHours(officeId:number){
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  startDate.setHours(0, 0, 0, 0);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .innerJoinAndSelect('a.employee', 'employee')
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('a.breaks', 'breaks')
    .where('employee.organizationId = :officeId', { officeId })
    .andWhere('a.checkinDate >= :startDate', { startDate })
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  const grouped = this.groupByEmployee(attendances, globalBreaks);
  const dynamicAttendances = grouped.flatMap(g => g.attendances);

  const result: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthNames[d.getMonth()];
    result[monthKey] = 0;
  }

  for (const att of dynamicAttendances) {
    const d = new Date(att.checkinDate);
    const monthKey = monthNames[d.getMonth()];
    if (result[monthKey] !== undefined) {
      result[monthKey] += att.duration || 0;
    }
  }

  return result;
}

async getTodayAndMonthStats(organizationId: number) {
  const now = new Date();
  const todayStartJs = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStartJs = startOfWeek(now);
  const monthStartJs = startOfMonth(now);

  const attendances = await this.attendanceRepository
    .createQueryBuilder('a')
    .innerJoinAndSelect('a.employee', 'employee')
    .leftJoinAndSelect('employee.shift', 'shift')
    .leftJoinAndSelect('a.breaks', 'breaks')
    .where('employee.organizationId = :organizationId', { organizationId })
    .andWhere('a.checkinDate >= :monthStartJs', { monthStartJs })
    .getMany();

  const globalBreaks = await this.breakService.findGlobalBreaks();
  const grouped = this.groupByEmployee(attendances, globalBreaks);
  const dynamicAttendances = grouped.flatMap(g => g.attendances);

  let todayTotalMinutes = 0;
  let weekTotalMinutes = 0;
  let monthTotalMinutes = 0;
  const todayEmployeeIds = new Set<number>();

  for (const emp of grouped) {
    for (const att of emp.attendances) {
      const checkin = new Date(att.checkinDate);
      
      if (checkin >= todayStartJs) {
        todayTotalMinutes += att.duration || 0;
        todayEmployeeIds.add(emp.employeeId);
      }
      if (checkin >= weekStartJs) {
        weekTotalMinutes += att.duration || 0;
      }
      if (checkin >= monthStartJs) {
        monthTotalMinutes += att.duration || 0;
      }
    }
  }

  return {
    todayTotalHours: Number((todayTotalMinutes / 60).toFixed(2)),
    todayEmployeeCount: todayEmployeeIds.size,
    weekTotalHours: Number((weekTotalMinutes / 60).toFixed(2)),
    monthTotalHours: Number((monthTotalMinutes / 60).toFixed(2)),
  };
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








