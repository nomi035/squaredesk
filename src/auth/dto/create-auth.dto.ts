import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateAuthDto {
  @ApiPropertyOptional({ description: 'Login with email (provide email or employeeId)' })
  @ValidateIf((dto) => !dto.employeeId)
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Login with employee id (provide email or employeeId)' })
  @ValidateIf((dto) => !dto.email)
  @IsString()
  employeeId?: string;

  @IsNotEmpty()
  password: string;
}
