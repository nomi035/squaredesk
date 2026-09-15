import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  create(@Body() createHolidayDto: CreateHolidayDto, @Request() req) {
    if (!createHolidayDto.organizationId && req.user?.organizationId) {
      createHolidayDto.organizationId = req.user.organizationId;
    }
    return this.holidayService.create(createHolidayDto);
  }

  @Get()
  findAll(@Request() req, @Query('month') month?: string) {
    const organizationId = req.user?.organizationId;
    if (month && organizationId) {
       return this.holidayService.findByMonth(organizationId, month);
    }
    return this.holidayService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    return this.holidayService.update(+id, updateHolidayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidayService.remove(+id);
  }
}
