import { ApiProperty } from "@nestjs/swagger";

export class CreateOfficeDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    address1: string;

    @ApiProperty()
    address2: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    state: string;

    @ApiProperty()
    zip: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    extension: string;
}
