import { ApiProperty } from "@nestjs/swagger";

export class CreateAttendanceDto {
      @ApiProperty()
        checkinDate: Date;
    
       @ApiProperty()
        checkinTime: string;
    
       @ApiProperty()
        checkoutDate: Date;
    
       @ApiProperty()
        checkoutTime: string;
    
        @ApiProperty()
        employeeId: number;
    
}
