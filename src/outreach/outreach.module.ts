import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { OutreachComment } from './entities/outreach-comment.entity';
import { Outreach } from './entities/outreach.entity';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';

@Module({
  imports: [TypeOrmModule.forFeature([Outreach, OutreachComment, User])],
  controllers: [OutreachController],
  providers: [OutreachService],
})
export class OutreachModule {}
