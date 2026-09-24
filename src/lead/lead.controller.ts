import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    return this.leadService.create(createLeadDto, req.user.userId, req.user.organization);
  }

  @Get('users')
  getUsersWithLeads(@Request() req) {
    return this.leadService.getUsersWithLeads(req.user.organization);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.leadService.findAll(req.user.userId, req.user.role, req.user.organization, query);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() updateData: { leadType?: string }) {
    return this.leadService.update(+id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete leads');
    }
    return this.leadService.remove(+id);
  }

  @Delete('user/:userId')
  removeByUser(@Param('userId') userId: string, @Request() req, @Query('leadType') leadType?: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete leads');
    }
    return this.leadService.removeByUser(+userId, req.user.organization, leadType);
  }
}
