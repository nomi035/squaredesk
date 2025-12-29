import { Injectable } from '@nestjs/common';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { Designation } from './entities/designation.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';

@Injectable()
export class DesignationService {
  constructor(@InjectRepository(Designation) private designationRepository: Repository<Designation>) {

  }
  create(createDesignationDto: CreateDesignationDto) {
    const designation = this.designationRepository.create(createDesignationDto);
    return this.designationRepository.save(designation);
  }

  findAll(id:number) {
    return this.designationRepository.find({
      where: { organizationId: id }
    });
  }

  findOne(id: number) {
    return this.designationRepository.findOne({ where: { id } });
  }

  update(id: number, updateDesignationDto: UpdateDesignationDto) {
    return this.designationRepository.update(id, updateDesignationDto);
  }

  remove(id: number) {
    return this.designationRepository.delete(id);
  }
}
