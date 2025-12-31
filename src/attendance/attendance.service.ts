import { Injectable } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Between } from 'typeorm';

@Injectable()
export class AttendanceService {
  constructor(@InjectRepository(Attendance) private attendanceRepository: Repository<Attendance>) {

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

  update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceRepository.update(id, updateAttendanceDto);
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


}
