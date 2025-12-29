import { Injectable } from '@nestjs/common';
import { CreateBreakDto } from './dto/create-break.dto';
import { UpdateBreakDto } from './dto/update-break.dto';

@Injectable()
export class BreakService {
  create(createBreakDto: CreateBreakDto) {
    return 'This action adds a new break';
  }

  findAll() {
    return `This action returns all break`;
  }

  findOne(id: number) {
    return `This action returns a #${id} break`;
  }

  update(id: number, updateBreakDto: UpdateBreakDto) {
    return `This action updates a #${id} break`;
  }

  remove(id: number) {
    return `This action removes a #${id} break`;
  }
}
