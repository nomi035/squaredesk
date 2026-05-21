import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outreach } from './entities/outreach.entity';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';

@Module({
  imports: [TypeOrmModule.forFeature([Outreach])],
  controllers: [OutreachController],
  providers: [OutreachService],
})
export class OutreachModule {}
