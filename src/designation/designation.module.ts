import { Module } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { DesignationController } from './designation.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Designation } from './entities/designation.entity';

@Module({
  controllers: [DesignationController],
  providers: [DesignationService],
  imports: [TypeOrmModule.forFeature([Designation])],
})
export class DesignationModule {}
