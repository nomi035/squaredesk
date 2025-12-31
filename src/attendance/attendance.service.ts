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

async patchAttendance(
  attendanceId: number,
  dto: PatchAttendanceDto,
) {
  return this.dataSource.transaction(async (manager) => {
    const attendance = await manager.findOne(Attendance, {
      where: { id: attendanceId },
      relations: ['breaks'],
    });

    if (!attendance) {
      throw new BadRequestException('Attendance not found');
    }

    // 1️⃣ Update attendance scalars
    const { breaks, ...attendanceData } = dto;
    Object.assign(attendance, attendanceData);

    // 2️⃣ Handle breaks
    if (breaks?.length) {
      for (const breakDto of breaks) {
        if (breakDto.id) {
          // UPDATE
          const existing = attendance.breaks.find(
            (b) => b.id === breakDto.id,
          );

          if (!existing) {
            throw new BadRequestException(
              `Break ${breakDto.id} not found`,
            );
          }
          const duration= breakDto.duration ??
            await (this.getDiffInMinutes12H(
              breakDto.startTime,
              breakDto.endTime,
            )).toString();
          existing.startTime = breakDto.startTime;
          existing.endTime = breakDto.endTime;
          existing.duration = duration;

        } else {
          // CREATE
           const duration= breakDto.duration ??
            await (this.getDiffInMinutes12H(
              breakDto.startTime,
              breakDto.endTime,
            )).toString();
          const newBreak = manager.create(Break, {
            startTime: breakDto.startTime,
            endTime: breakDto.endTime,
            duration: duration,
            attendance,
          });

          attendance.breaks.push(newBreak);
        }
      }
    }

    return manager.save(attendance);
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

  async getDiffInMinutes12H(start: string, end: string): Promise<number> {
    const startMin = await this.time12ToMinutes(start);
    const endMin = await this.time12ToMinutes(end);

    let diff = endMin - startMin;

    // handle crossing midnight
    if (diff < 0) diff += 24 * 60;

    return diff;
  }


}
