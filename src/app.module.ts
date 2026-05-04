import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { OfficeModule } from './office/office.module';
import { ShiftModule } from './shift/shift.module';
import { DepartmentModule } from './department/department.module';
import { DesignationModule } from './designation/designation.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PtoModule } from './pto/pto.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BreakModule } from './break/break.module';

@Module({
  imports: [UserModule,
    ConfigModule.forRoot(),
     TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.database_url,
    port: Number(process.env.DB_PORT),
  
    autoLoadEntities: true,
    //synchronize: true,
  
    //  ssl: {
    //  rejectUnauthorized: false,
    //  },
  }),
     AuthModule,
     OfficeModule,
     ShiftModule,
     DepartmentModule,
     DesignationModule,
     AttendanceModule,
     AssignmentsModule,
     PtoModule,
     OrganizationsModule,
     BreakModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
