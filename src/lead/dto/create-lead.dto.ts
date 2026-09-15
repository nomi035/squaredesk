import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateLeadDto {
  @IsNumber()
  @IsNotEmpty()
  outreachId: number;
}
