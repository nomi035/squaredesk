import { Injectable } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class AttendanceService {
  constructor(@InjectRepository(Attendance) private attendanceRepository: Repository<Attendance>) {

  }
  create(createAttendanceDto: CreateAttendanceDto) {
    const attendance = this.attendanceRepository.create(createAttendanceDto);
    return this.attendanceRepository.save(attendance) ;
  }

  findAll() {
    return this.attendanceRepository.find();
  }

  findOne(id: number) {
    return  this.attendanceRepository.findOne({ where: { id } });
  }

  update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    return  this.attendanceRepository.update(id, updateAttendanceDto);
  }

  remove(id: number) {
    return  this.attendanceRepository.delete(id);
  }

  findByEmployeeId(employeeId: number) {
    return this.attendanceRepository.find({ where: { employeeId } });
  }
}
