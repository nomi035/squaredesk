import { ApiProperty } from "@nestjs/swagger";

export class CreateDepartmentDto {
    @ApiProperty()
    departmentName: string;
    @ApiProperty()
    description: string;
}
