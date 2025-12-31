import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';

export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, ['breaks', 'employeeId'] as const),
) {}
