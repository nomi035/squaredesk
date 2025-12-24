import { Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Office } from './entities/office.entity';

@Module({
  controllers: [OfficeController],
  providers: [OfficeService],
  imports: [TypeOrmModule.forFeature([Office])],
})
export class OfficeModule {}
