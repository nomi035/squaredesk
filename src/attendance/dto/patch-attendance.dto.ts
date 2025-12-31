import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { UpdateAttendanceDto } from "./update-attendance.dto";
import { UpsertBreakDto } from "./upsertbreak.dto";

export class PatchAttendanceDto extends UpdateAttendanceDto {
  @ApiProperty({ type: [UpsertBreakDto], required: false })
  breaks?: UpsertBreakDto[];
}