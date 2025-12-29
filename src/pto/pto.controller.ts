import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PtoService } from './pto.service';
import { CreatePtoDto } from './dto/create-pto.dto';
import { UpdatePtoDto } from './dto/update-pto.dto';

@Controller('pto')
export class PtoController {
  constructor(private readonly ptoService: PtoService) {}

  @Post()
  create(@Body() createPtoDto: CreatePtoDto) {
    return this.ptoService.create(createPtoDto);
  }

  @Get()
  findAll() {
    return this.ptoService.findAll();
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
