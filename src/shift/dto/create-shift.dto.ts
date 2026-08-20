import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateShiftDto {
    @IsOptional()
    @ApiProperty()
    name?: string;
    @ApiProperty()
    startTime: string;
    @ApiProperty()
    endTime: string;
  

    organizationId?: number;

}
