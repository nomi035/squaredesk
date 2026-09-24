import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsNumber()
  @IsNotEmpty()
  outreachId: number;

  @IsString()
  @IsOptional()
  leadType?: string;
}
