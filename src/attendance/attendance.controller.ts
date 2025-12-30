import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpException, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BreakService } from 'src/break/break.service';
import { CreateBreakDto } from 'src/break/dto/create-break.dto';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService,
    private readonly breakService: BreakService
  ) { }

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':checkInDate/checkin/:startTime')
  async checkIn(@currentUser() user: any, @Param('startTime') startTime: string, @Param('checkInDate') checkInDate: Date) {
    const attendance = await this.attendanceService.getTodayAttendance(user.userId);
    if (attendance) { // if attendance already exists for today, update it
      throw new BadRequestException('Attendance already checked in for today');
    }


    return this.attendanceService.create({
      checkinDate: checkInDate,
      checkinTime: startTime,
      employeeId: user.userId



    })

  }
  @Post(':attendanceId/break/start/:startTime')
  async addBreak(
    @Param('attendanceId', ParseIntPipe) attendanceId: number,
    @Param('startTime') startTime: string,

  ) {
    const attendance = await this.attendanceService.findOne(attendanceId);
    return this.breakService.create({
      startTime: startTime,
      inProgress: true

    }, attendance)
  }

  @Patch(':attendanceId/break/end/:endTime')
  async endBreak(
    @Param('attendanceId', ParseIntPipe) attendanceId: number,
    @Param('endTime') endTime: string,

  ) {
    const activeBreak = await this.breakService.findActiveBreaks(attendanceId);
    if (!activeBreak) {
      throw new BadRequestException('No active break found for this attendance');
    }
    const durationMinutes = this.getDiffInMinutes12H(
      activeBreak.startTime,
      endTime,
    );



    return this.breakService.update(activeBreak.id, { endTime, inProgress: false, duration: (await durationMinutes).toString() });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':checkOutDate/checkout/:endTime')
  async checkOut(@currentUser() user: any, @Param('endTime') endTime: string, @Param('checkOutDate') checkOutDate: Date) {
    const attendance = await this.attendanceService.getTodayAttendance(user.userId);
    if (!attendance) {
      throw new BadRequestException('no check-in record found for today');
    }
    attendance.checkoutDate = checkOutDate
    attendance.checkoutTime = endTime
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
    const attendance = await this.attendanceService.getTodayAttendance(user.userId);
    if (attendance && attendance.checkoutDate === null) {
      return { status: 'Checked In', attendance: attendance };

    }
    if (attendance.checkoutDate !== null) {
      return { status: 'Not Checked In' };
    }
  }

  async time12ToMinutes(time: string): Promise<number> {
    const [hh, mm, period] = time.split(':');

    let hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  async getDiffInMinutes12H(start: string, end: string): Promise<number> {
    const startMin = await this.time12ToMinutes(start);
    const endMin = await this.time12ToMinutes(end);

    let diff = endMin - startMin;

    // handle crossing midnight
    if (diff < 0) diff += 24 * 60;

    return diff;
  }


}
