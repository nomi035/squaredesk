import { ApiProperty } from "@nestjs/swagger";

export class CreateDesignationDto {
    @ApiProperty()
    designation:string;
    
    @ApiProperty()
    description:string;

     organizationId: number;
}
