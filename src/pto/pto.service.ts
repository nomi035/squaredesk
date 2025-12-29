import { Injectable } from '@nestjs/common';
import { CreatePtoDto } from './dto/create-pto.dto';
import { UpdatePtoDto } from './dto/update-pto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pto } from './entities/pto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PtoService {
  constructor(@InjectRepository(Pto) private ptoRepository: Repository<Pto>) {}

  

  create(createPtoDto: CreatePtoDto) {
    return this.ptoRepository.save(createPtoDto);
  }

  findAll() {
    return this.ptoRepository.find();
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
