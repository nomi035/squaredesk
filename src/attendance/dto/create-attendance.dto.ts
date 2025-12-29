import { ApiProperty } from "@nestjs/swagger";
import { CreateBreakDto } from "src/break/dto/create-break.dto";

export class CreateAttendanceDto {
      @ApiProperty()
        checkinDate: Date;
    
       @ApiProperty()
        checkinTime: string;
    
       @ApiProperty()
        checkoutDate?: Date;
    
       @ApiProperty()
        checkoutTime?: string;
    
        @ApiProperty()
        employeeId: number;


        @ApiProperty({ type: [CreateBreakDto], required: false })
         breaks?: CreateBreakDto[];
    
}
