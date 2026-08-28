import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { User } from 'src/user/entities/user.entity';
import { Payroll } from './entities/payroll.entity';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { AttendanceModule } from 'src/attendance/attendance.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, User, Attendance]), AttendanceModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
