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
    @ApiProperty()
    employeeId: number;
    @ApiProperty()
    officeId: number;
    @ApiProperty()
    assignmentId: number;
    @ApiProperty()
     providerId:number
    @ApiProperty({
    required: false
    })
    providerName?: string;

}
