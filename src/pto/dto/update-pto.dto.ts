import { PartialType } from '@nestjs/mapped-types';
import { CreatePtoDto } from './create-pto.dto';

export class UpdatePtoDto extends PartialType(CreatePtoDto) {}
