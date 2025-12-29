import { Inject, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class OrganizationsService {
  constructor(@InjectRepository(Organization) private organizationRepository: Repository<Organization>) {}  

  create(createOrganizationDto: CreateOrganizationDto) {
    return this.organizationRepository.save(createOrganizationDto);
  }

  findAll() {
    return this.organizationRepository.find();
  }

  findOne(id: number) {
        return this.organizationRepository.findOneBy({id}); 
  }

  update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationRepository.update(id, updateOrganizationDto);
  }

  remove(id: number) {
  return this.organizationRepository.delete(id); 
 }
}
