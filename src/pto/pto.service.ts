import { Injectable } from '@nestjs/common';
import { CreatePtoDto } from './dto/create-pto.dto';
import { UpdatePtoDto } from './dto/update-pto.dto';

@Injectable()
export class PtoService {
  create(createPtoDto: CreatePtoDto) {
    return 'This action adds a new pto';
  }

  findAll() {
    return `This action returns all pto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pto`;
  }

  update(id: number, updatePtoDto: UpdatePtoDto) {
    return `This action updates a #${id} pto`;
  }

  remove(id: number) {
    return `This action removes a #${id} pto`;
  }
}
