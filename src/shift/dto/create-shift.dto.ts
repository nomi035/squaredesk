import { ApiProperty } from "@nestjs/swagger";

export class CreateShiftDto {
    @ApiProperty()
    startDate: Date;
    @ApiProperty()
    startTime: string;
    @ApiProperty()
    endTime: string;
    @ApiProperty()
    endDate: Date;

    organizationId: number;

}
