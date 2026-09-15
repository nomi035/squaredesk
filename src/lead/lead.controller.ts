import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadService.remove(+id);
  }
}
