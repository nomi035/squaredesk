import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/user/entities/user.entity';


@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift) private shiftRepository: Repository<Shift>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  create(createShiftDto: CreateShiftDto) {
    const shift = this.shiftRepository.create(createShiftDto);
    return this.shiftRepository.save(shift);
  }

  findAll(organizationId: number) {
    return this.shiftRepository.find({
      where: { organizationId },
      relations: ['users'],
      select:{
        users:{
          firstName:true,
          lastName:true,
        }
      }
    });
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
    return this.shiftRepository.find({
      where: { users: { id: employeeId } },
      relations: ['users'],
      select:{
        users:{
          firstName:true,
          lastName:true,
        }
      } });
  }

  async assignEmployee(id: number, employeeId: number) {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift ${id} not found`);
    }

    const employee = await this.userRepository.findOne({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    await this.userRepository.update(employeeId, { shiftId: id });

    return this.shiftRepository.findOne({
      where: { id },
      relations: ['users'],
      select: {
        users: {
          firstName: true,
          lastName: true,
        },
      },
    });
  }
}
