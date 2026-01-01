import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class ShiftService {
  constructor(@InjectRepository(Shift) private shiftRepository: Repository<Shift>) {}
  create(createShiftDto: CreateShiftDto) {
    const shift = this.shiftRepository.create(createShiftDto);
    return this.shiftRepository.save(shift);
  }

  findAll() {
    return this.shiftRepository.find();
  }

  findOne(id: number) {
    return this.shiftRepository.findOne({
      where: { id },
    });
  }

  update(id: number, updateShiftDto: UpdateShiftDto) {
    return this.shiftRepository.update(id, updateShiftDto);
  }

  remove(id: number) {
    return this.shiftRepository.delete(id);
  }
  findByEmployee(employeeId: number) {
    return this.shiftRepository.find({ where: { employeeId } });
  }
}
