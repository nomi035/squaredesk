import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard';
import { currentUser } from 'src/decorators/currentuser';

@ApiTags('designation')
@Controller('designation')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createDesignationDto: CreateDesignationDto,@currentUser() user:any) {
    return this.designationService.create({...createDesignationDto,organizationId:user.organization});
  }

   @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@currentUser() user:any) {
    return this.designationService.findAll(user.organization);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDesignationDto: UpdateDesignationDto) {
    return this.designationService.update(+id, updateDesignationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationService.remove(+id);
  }
}
