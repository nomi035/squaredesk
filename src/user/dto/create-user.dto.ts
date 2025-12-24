import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/user.entity';
import { IsOptional } from 'class-validator';

export class CreateUserDto {
@ApiProperty()
  firstName: string;
@ApiProperty()
  lastName: string;
 @ApiProperty()
  password: string;
@ApiProperty()
  email: string;
@ApiProperty()
  phone: string;
 @ApiProperty()
  address1: string;
 @ApiProperty()
  address2: string;
 @ApiProperty()
  city: string;
 @ApiProperty()
  state: string;
 @ApiProperty()
  zip: string;
 @ApiProperty()
  officeId:number
 @ApiProperty()
  departmentId:number
 @ApiProperty()
  designationId:number
 @ApiProperty()
  employmentType:string
 @ApiProperty()
  ptoDays:number
 @ApiProperty()
  emergencyName:string
 @ApiProperty()
  emergencyPhone:string
 @ApiProperty()
  emergencyRelation:string
 @ApiProperty()
  role: Role;
}
