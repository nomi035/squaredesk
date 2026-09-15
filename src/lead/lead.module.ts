import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { Lead } from './entities/lead.entity';
import { Outreach } from 'src/outreach/entities/outreach.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Outreach])],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
