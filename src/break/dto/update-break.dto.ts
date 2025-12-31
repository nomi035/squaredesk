import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateBreakDto {
  @ApiPropertyOptional({
    description: 'If provided → update existing break',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

   inProgress?: boolean;

   @ApiProperty({ required: false })
     duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;
}
