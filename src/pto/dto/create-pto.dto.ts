import { ApiProperty } from "@nestjs/swagger";
import { PtoStatus } from "../entities/pto.entity";

export class CreatePtoDto {
    @ApiProperty()
    employeeId: number;

    status: PtoStatus;

    @ApiProperty()
    startDate: Date;




    @ApiProperty()
    endDate: Date;

    @ApiProperty()
    reason: string;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;
}
