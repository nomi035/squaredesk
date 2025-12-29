import { Injectable } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}
  create(createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsRepository.save(createAssignmentDto);
  }

  findAll(id:number) {
    return this.assignmentsRepository.find({
      where: { organizationId: id }
    });
  }

  findOne(id: number) {
    return this.assignmentsRepository.findOne({ where: { id } });
  }

  update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentsRepository.update(id, updateAssignmentDto);
  }

  remove(id: number) {
    return this.assignmentsRepository.delete(id);
  }
}
