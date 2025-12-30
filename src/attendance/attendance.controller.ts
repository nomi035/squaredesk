import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BreakService } from 'src/break/break.service';
import { CreateBreakDto } from 'src/break/dto/create-break.dto';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService,
    private readonly breakService: BreakService
  ) {}

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/checkin')
  async checkIn(@currentUser()user:any) {
    const attendance = await this.attendanceService.getTodayAttendance(user.userId);
    if(attendance){ // if attendance already exists for today, update it
     throw new Error('Attendance already checked in for today');
    }
    const time= new Date().toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

    return this.attendanceService.create({
      checkinDate: new Date(),
      checkinTime: time,
      employeeId:user.userId


    
    })

      }
 @Post(':attendanceId/breaks')
async addBreak(
  @Param('attendanceId', ParseIntPipe) attendanceId: number,
  @Body() dto: CreateBreakDto,
) {
  const attendance = await this.attendanceService.findOne(attendanceId);
  return this.breakService.create(dto, attendance)
}
  
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('/checkout')
  async checkOut(@currentUser() user: any) {
   const attendance = await this.attendanceService.getTodayAttendance(user.userId);
   if(!attendance){
    throw new Error('No attendance found for today');
   }
   attendance.checkoutDate = new Date();
   attendance.checkoutTime = new Date().toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});
  const updatedAttendance = await this.attendanceService.update(attendance.id, attendance);
  return updatedAttendance;
   }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceService.update(+id, updateAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(+id);
  }
  @Get('/employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.attendanceService.findByEmployeeId(+employeeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/status/today')
  async getTodayAttendanceStatus(@currentUser() user: any) {
    const attendancde=await this.attendanceService.getTodayAttendance(user.userId);
    if(attendancde){
      return{ status: 'Checked In', attendance: attendancde };

    }
    return { status: 'Not Checked In' };
  }


}
