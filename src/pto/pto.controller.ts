import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PtoService } from './pto.service';
import { CreatePtoDto } from './dto/create-pto.dto';
import { UpdatePtoDto } from './dto/update-pto.dto';
import { PtoStatus } from './entities/pto.entity';
import { JwtAuthGuard } from 'src/auth/guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { currentUser } from 'src/decorators/currentuser';
@ApiTags('pto')
@Controller('pto')
export class PtoController {
  constructor(private readonly ptoService: PtoService) {}

  @Post()
  create(@Body() createPtoDto: CreatePtoDto) {
    return this.ptoService.create(createPtoDto);
  }

  @Get()
  findAll(@Query('status') status?: PtoStatus) {
    return this.ptoService.findAll(status);
  }

  @Get('employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.ptoService.findByEmployeeId(+employeeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('office/based')
  findByBranchId(@currentUser()user:any) {
    return this.ptoService.findByBranchId(user.office);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ptoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePtoDto: UpdatePtoDto) {
    return this.ptoService.update(+id, updatePtoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ptoService.remove(+id);
  }
}
