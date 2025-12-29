import { ApiProperty } from "@nestjs/swagger";

export class CreateAssignmentDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    colour: string;

    organizationId: number;
}
