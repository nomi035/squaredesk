import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../entities/user.entity';

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

  @ApiPropertyOptional()
  address1?: string;

  @ApiPropertyOptional()
  address2?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  zip?: string;

  @ApiPropertyOptional()
  ptoDays?: number;

  @ApiPropertyOptional()
  emergencyName?: string;

  @ApiPropertyOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  emergencyRelation?: string;

  @ApiProperty()
  role: Role;

  @ApiPropertyOptional()
  salaryAmount?: number;

  @ApiPropertyOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  bloodGroup?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  cnicNumber?: string;

  @ApiPropertyOptional({ description: 'User id of the manager this person reports to' })
  reportsToId?: number;

  @ApiPropertyOptional()
  designation?: string;

  @ApiPropertyOptional()
  isActive?: boolean;

  organizationId?: number;
}
