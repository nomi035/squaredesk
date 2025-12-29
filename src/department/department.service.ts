import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class DepartmentService {
  constructor(@InjectRepository(Department) private departmentRepository: Repository<Department>) {

  }
  create(createDepartmentDto: CreateDepartmentDto) {
    return this.departmentRepository.save(createDepartmentDto);

  }
  findAll(id:number) {
    return this.departmentRepository.find({
      where: { organizationId: id }
    });
  }

  findOne(id: number) {
    return this.departmentRepository.findOne({
      where: { id },
    });
  }

  update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentRepository.update(id, updateDepartmentDto);
  }

  remove(id: number) {
    return this.departmentRepository.delete(id);
  }
}
