import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  create(createTaskDto: CreateTaskDto) {
    return this.taskRepository.save(createTaskDto);
  }

  findAll(organizationId: number, status?: TaskStatus) {
    return this.taskRepository.find({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      relations: ['assignTo'],
      order: { id: 'DESC' },
    });
  }

  findByAssignee(assignToId: number, organizationId: number) {
    return this.taskRepository.find({
      where: { assignToId, organizationId },
      relations: ['assignTo'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignTo'],
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);
    await this.taskRepository.update(id, updateTaskDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.taskRepository.delete(id);
    return { deleted: true };
  }
}
