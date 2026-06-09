import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOutreachCommentDto {
  @ApiProperty()
  @IsString()
  comment: string;
}
