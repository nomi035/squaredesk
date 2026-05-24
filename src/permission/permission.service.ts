import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission, PermissionName } from './entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    return this.permissionRepository.save(createPermissionDto);
  }

  findByUser(userId: number) {
    return this.permissionRepository.find({
      where: { userId },
      relations: ['user'],
      order: { permissionName: 'ASC' },
    });
  }

  async findOne(id: number) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission ${id} not found`);
    }
    return permission;
  }

  async isAllowed(userId: number, permissionName: PermissionName) {
    const permission = await this.permissionRepository.findOne({
      where: { userId, permissionName },
    });
    return {
      userId,
      permissionName,
      allowed: permission?.allowed ?? false,
    };
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);
    await this.permissionRepository.update(id, updatePermissionDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.permissionRepository.delete(id);
    return { deleted: true };
  }
}
