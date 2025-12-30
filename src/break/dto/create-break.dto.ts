import { ApiProperty } from "@nestjs/swagger";

export class CreateBreakDto {
    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime?: string;

    @ApiProperty()
    duration?: string

    inProgress?: boolean;


}
