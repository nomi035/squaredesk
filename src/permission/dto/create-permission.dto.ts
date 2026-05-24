import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { PermissionName } from '../entities/permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ enum: PermissionName })
  @IsEnum(PermissionName)
  permissionName: PermissionName;

  @ApiProperty()
  @IsBoolean()
  allowed: boolean;

  @ApiProperty()
  @IsNumber()
  userId: number;
}
