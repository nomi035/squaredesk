import { Injectable } from '@nestjs/common';
import { CreateBreakDto } from './dto/create-break.dto';
import { UpdateBreakDto } from './dto/update-break.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Break } from './entities/break.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Injectable()
export class BreakService {
    constructor(@InjectRepository(Break) private breakRepository: Repository<Break>) {

  }

  create(createBreakDto: CreateBreakDto, attendance:Attendance) {
    return this.breakRepository.save({...createBreakDto, attendance});
  }

  findAll() {
    return this.breakRepository.find();
  }

  findOne(id: number) {
    return this.breakRepository.findOne({ where: { id } });
  }

  update(id: number, updateBreakDto: UpdateBreakDto) {
    return this.breakRepository.update(id, updateBreakDto);
  }

  remove(id: number) {
    return this.breakRepository.delete(id);
  }
}
