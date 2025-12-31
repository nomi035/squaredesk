import { ApiProperty } from "@nestjs/swagger";

export class UpsertBreakDto {
  @ApiProperty({ required: false })
  id?: number; // present = update, missing = create

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ required: false })
  duration?: string;
}