import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { User } from 'src/user/entities/user.entity';
import { AdmsController } from './adms.controller';
import { AdmsService } from './adms.service';
import { BiometricDevice } from './entities/biometric-device.entity';
import { DevicePunchLog } from './entities/device-punch-log.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BiometricDevice, DevicePunchLog, User]),
    AttendanceModule,
  ],
  controllers: [AdmsController],
  providers: [AdmsService],
})
export class AdmsModule {}
