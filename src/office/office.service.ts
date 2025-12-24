import { Injectable } from '@nestjs/common';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Office } from './entities/office.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class OfficeService {
  constructor(@InjectRepository(Office) private officeRepository: Repository<Office>) {}

  create(createOfficeDto: CreateOfficeDto) {
    const office = this.officeRepository.create(createOfficeDto);
    return this.officeRepository.save(office);
  }

  findAll() {   
    return this.officeRepository.find();
    
  }

  findOne(id: number) {
    return this.officeRepository.findOne({ where: { id } });
  }

  update(id: number, updateOfficeDto: UpdateOfficeDto) {
    return this.officeRepository.update(id, updateOfficeDto);
  }

  remove(id: number) {
    return this.officeRepository.delete(id);
  }
}
