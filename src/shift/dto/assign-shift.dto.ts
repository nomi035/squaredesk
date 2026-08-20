import { ApiProperty } from "@nestjs/swagger";

export class AssignShiftDto {
    @ApiProperty()
    employeeId: number;
}
