import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateBreakDto } from 'src/break/dto/update-break.dto';

export class UpdateAttendanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkinDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkinTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkoutDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkoutTime?: string;

 

  @ApiPropertyOptional({ type: () => [UpdateBreakDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBreakDto)
  breaks?: UpdateBreakDto[];
}
