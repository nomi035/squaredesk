import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Between, DataSource } from 'typeorm';
import { PatchAttendanceDto } from './dto/patch-attendance.dto';
import { Break } from 'src/break/entities/break.entity';

@Injectable()
export class AttendanceService {
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
    .andWhere('employee.officeId = :orgId', { orgId: id })
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
    });

    await manager.save(attendance);

    // 2️⃣ Update breaks
    if (dto.breaks?.length) {
      for (const breakDto of dto.breaks) {
        if (!breakDto.id) {
          // ➕ CREATE new break
          const newBreak = manager.create(Break, {
            startTime: breakDto.startTime,
            endTime: breakDto.endTime,
            duration: await this.calculateDuration(
              breakDto.startTime,
              breakDto.endTime,
            ).toString(),
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

          existingBreak.startTime =
            breakDto.startTime ?? existingBreak.startTime;

          existingBreak.endTime =
            breakDto.endTime ?? existingBreak.endTime;

          existingBreak.duration = await this.calculateDuration(
            existingBreak.startTime,
            existingBreak.endTime,
          ).toString();

          await manager.save(existingBreak);
        }
      }
    }

    return attendance;
  });
}
  async time12ToMinutes(time: string): Promise<number> {
    const [hh, mm, period] = time.split(':');

    let hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  async calculateDuration(start: string, end: string): Promise<number> {
    const startMin = await this.time12ToMinutes(start);
    const endMin = await this.time12ToMinutes(end);

    let diff = endMin - startMin;

    // handle crossing midnight
    if (diff < 0) diff += 24 * 60;

    return diff;
  }


}
