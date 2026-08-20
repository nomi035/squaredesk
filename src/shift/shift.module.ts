import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  controllers: [ShiftController],
  providers: [ShiftService],
  imports:[TypeOrmModule.forFeature([Shift, User])],
})
export class ShiftModule {}
