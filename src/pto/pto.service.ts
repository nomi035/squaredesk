import { Injectable } from '@nestjs/common';
import { CreatePtoDto } from './dto/create-pto.dto';
import { UpdatePtoDto } from './dto/update-pto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pto, PtoStatus } from './entities/pto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PtoService {
  constructor(@InjectRepository(Pto) private ptoRepository: Repository<Pto>) {}

  

  create(createPtoDto: CreatePtoDto) {
    return this.ptoRepository.save(createPtoDto);
  }

  findAll(status?: PtoStatus) {
    return this.ptoRepository.find({
      where:{
        status
      }
    });
  }

  findByEmployeeId(employeeId: number) {
    return this.ptoRepository.find({ where: { employeeId } });
  }

  findByBranchId(branchId: number) {
    return this.ptoRepository.find({ where:{
      employee:{
        officeId: branchId
      }
    } });
  }

  findOne(id: number) {
    return this.ptoRepository.findOne({ where: { id } });
  }

  update(id: number, updatePtoDto: UpdatePtoDto) {
    return this.ptoRepository.update(id, updatePtoDto);
  }

  remove(id: number) {
    return this.ptoRepository.delete(id);
  }
}
